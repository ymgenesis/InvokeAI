import time
import traceback
from threading import BoundedSemaphore, Event, Thread
from typing import Optional

import invokeai.backend.util.logging as logger

from ..invocations.baseinvocation import InvocationContext
from ..models.exceptions import CanceledException
from .invocation_queue import InvocationQueueItem
from .invocation_stats import InvocationStatsServiceBase
from .invoker import InvocationProcessorABC, Invoker


class DefaultInvocationProcessor(InvocationProcessorABC):
    __invoker_thread: Thread
    __stop_event: Event
    __invoker: Invoker
    __threadLimit: BoundedSemaphore

    def start(self, invoker) -> None:
        # if we do want multithreading at some point, we could make this configurable
        self.__threadLimit = BoundedSemaphore(1)
        self.__invoker = invoker
        self.__stop_event = Event()
        self.__invoker_thread = Thread(
            name="invoker_processor",
            target=self.__process,
            kwargs=dict(stop_event=self.__stop_event),
        )
        self.__invoker_thread.daemon = True  # TODO: make async and do not use threads
        self.__invoker_thread.start()

    def stop(self, *args, **kwargs) -> None:
        self.__stop_event.set()

    def __process(self, stop_event: Event):
        try:
            self.__threadLimit.acquire()
            statistics: InvocationStatsServiceBase = self.__invoker.services.performance_statistics
            queue_item: Optional[InvocationQueueItem] = None

            while not stop_event.is_set():
                try:
                    queue_item = self.__invoker.services.queue.get()
                except Exception as e:
                    self.__invoker.services.logger.error("Exception while getting from queue:\n%s" % e)

                if not queue_item:  # Probably stopping
                    # do not hammer the queue
                    time.sleep(0.5)
                    continue
                try:
                    graph_execution_state = self.__invoker.services.graph_execution_manager.get(
                        queue_item.graph_execution_state_id
                    )
                except Exception as e:
                    self.__invoker.services.logger.error("Exception while retrieving session:\n%s" % e)
                    self.__invoker.services.events.emit_session_retrieval_error(
                        queue_batch_id=queue_item.session_queue_batch_id,
                        queue_item_id=queue_item.session_queue_item_id,
                        queue_id=queue_item.session_queue_id,
                        graph_execution_state_id=queue_item.graph_execution_state_id,
                        error_type=e.__class__.__name__,
                        error=traceback.format_exc(),
                    )
                    continue

                try:
                    invocation = graph_execution_state.execution_graph.get_node(queue_item.invocation_id)
                except Exception as e:
                    self.__invoker.services.logger.error("Exception while retrieving invocation:\n%s" % e)
                    self.__invoker.services.events.emit_invocation_retrieval_error(
                        queue_batch_id=queue_item.session_queue_batch_id,
                        queue_item_id=queue_item.session_queue_item_id,
                        queue_id=queue_item.session_queue_id,
                        graph_execution_state_id=queue_item.graph_execution_state_id,
                        node_id=queue_item.invocation_id,
                        error_type=e.__class__.__name__,
                        error=traceback.format_exc(),
                    )
                    continue

                # get the source node id to provide to clients (the prepared node id is not as useful)
                source_node_id = graph_execution_state.prepared_source_mapping[invocation.id]

                # Send starting event
                self.__invoker.services.events.emit_invocation_started(
                    queue_batch_id=queue_item.session_queue_batch_id,
                    queue_item_id=queue_item.session_queue_item_id,
                    queue_id=queue_item.session_queue_id,
                    graph_execution_state_id=graph_execution_state.id,
                    node=invocation.dict(),
                    source_node_id=source_node_id,
                )

                # Invoke
                try:
                    graph_id = graph_execution_state.id
                    model_manager = self.__invoker.services.model_manager
                    with statistics.collect_stats(invocation, graph_id, model_manager):
                        # use the internal invoke_internal(), which wraps the node's invoke() method,
                        # which handles a few things:
                        # - nodes that require a value, but get it only from a connection
                        # - referencing the invocation cache instead of executing the node
                        outputs = invocation.invoke_internal(
                            InvocationContext(
                                services=self.__invoker.services,
                                graph_execution_state_id=graph_execution_state.id,
                                queue_item_id=queue_item.session_queue_item_id,
                                queue_id=queue_item.session_queue_id,
                                queue_batch_id=queue_item.session_queue_batch_id,
                            )
                        )

                        # Check queue to see if this is canceled, and skip if so
                        if self.__invoker.services.queue.is_canceled(graph_execution_state.id):
                            continue

                        # Save outputs and history
                        graph_execution_state.complete(invocation.id, outputs)

                        # Save the state changes
                        self.__invoker.services.graph_execution_manager.set(graph_execution_state)

                        # Send complete event
                        self.__invoker.services.events.emit_invocation_complete(
                            queue_batch_id=queue_item.session_queue_batch_id,
                            queue_item_id=queue_item.session_queue_item_id,
                            queue_id=queue_item.session_queue_id,
                            graph_execution_state_id=graph_execution_state.id,
                            node=invocation.dict(),
                            source_node_id=source_node_id,
                            result=outputs.dict(),
                        )
                    statistics.log_stats()

                except KeyboardInterrupt:
                    pass

                except CanceledException:
                    statistics.reset_stats(graph_execution_state.id)
                    pass

                except Exception as e:
                    error = traceback.format_exc()
                    logger.error(error)

                    # Save error
                    graph_execution_state.set_node_error(invocation.id, error)

                    # Save the state changes
                    self.__invoker.services.graph_execution_manager.set(graph_execution_state)

                    self.__invoker.services.logger.error("Error while invoking:\n%s" % e)
                    # Send error event
                    self.__invoker.services.events.emit_invocation_error(
                        queue_batch_id=queue_item.session_queue_batch_id,
                        queue_item_id=queue_item.session_queue_item_id,
                        queue_id=queue_item.session_queue_id,
                        graph_execution_state_id=graph_execution_state.id,
                        node=invocation.dict(),
                        source_node_id=source_node_id,
                        error_type=e.__class__.__name__,
                        error=error,
                    )
                    statistics.reset_stats(graph_execution_state.id)
                    pass

                # Check queue to see if this is canceled, and skip if so
                if self.__invoker.services.queue.is_canceled(graph_execution_state.id):
                    continue

                # Queue any further commands if invoking all
                is_complete = graph_execution_state.is_complete()
                if queue_item.invoke_all and not is_complete:
                    try:
                        self.__invoker.invoke(
                            session_queue_batch_id=queue_item.session_queue_batch_id,
                            session_queue_item_id=queue_item.session_queue_item_id,
                            session_queue_id=queue_item.session_queue_id,
                            graph_execution_state=graph_execution_state,
                            invoke_all=True,
                        )
                    except Exception as e:
                        self.__invoker.services.logger.error("Error while invoking:\n%s" % e)
                        self.__invoker.services.events.emit_invocation_error(
                            queue_batch_id=queue_item.session_queue_batch_id,
                            queue_item_id=queue_item.session_queue_item_id,
                            queue_id=queue_item.session_queue_id,
                            graph_execution_state_id=graph_execution_state.id,
                            node=invocation.dict(),
                            source_node_id=source_node_id,
                            error_type=e.__class__.__name__,
                            error=traceback.format_exc(),
                        )
                elif is_complete:
                    self.__invoker.services.events.emit_graph_execution_complete(
                        queue_batch_id=queue_item.session_queue_batch_id,
                        queue_item_id=queue_item.session_queue_item_id,
                        queue_id=queue_item.session_queue_id,
                        graph_execution_state_id=graph_execution_state.id,
                    )

        except KeyboardInterrupt:
            pass  # Log something? KeyboardInterrupt is probably not going to be seen by the processor
        finally:
            self.__threadLimit.release()
