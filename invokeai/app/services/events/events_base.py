# Copyright (c) 2022 Kyle Schouviller (https://github.com/kyle0654)

from typing import Any, Optional

from invokeai.app.services.invocation_processor.invocation_processor_common import ProgressImage
from invokeai.app.services.session_queue.session_queue_common import (
    BatchStatus,
    EnqueueBatchResult,
    SessionQueueItem,
    SessionQueueStatus,
)
from invokeai.app.util.misc import get_timestamp
from invokeai.backend.model_management.model_manager import ModelInfo
from invokeai.backend.model_management.models.base import BaseModelType, ModelType, SubModelType


class EventServiceBase:
    queue_event: str = "queue_event"

    """Basic event bus, to have an empty stand-in when not needed"""

    def dispatch(self, event_name: str, payload: Any) -> None:
        pass

    def __emit_queue_event(self, event_name: str, payload: dict) -> None:
        """Queue events are emitted to a room with queue_id as the room name"""
        payload["timestamp"] = get_timestamp()
        self.dispatch(
            event_name=EventServiceBase.queue_event,
            payload=dict(event=event_name, data=payload),
        )

    # Define events here for every event in the system.
    # This will make them easier to integrate until we find a schema generator.
    def emit_generator_progress(
        self,
        queue_id: str,
        queue_item_id: int,
        queue_batch_id: str,
        graph_execution_state_id: str,
        node: dict,
        source_node_id: str,
        progress_image: Optional[ProgressImage],
        step: int,
        order: int,
        total_steps: int,
    ) -> None:
        """Emitted when there is generation progress"""
        self.__emit_queue_event(
            event_name="generator_progress",
            payload=dict(
                queue_id=queue_id,
                queue_item_id=queue_item_id,
                queue_batch_id=queue_batch_id,
                graph_execution_state_id=graph_execution_state_id,
                node_id=node.get("id"),
                source_node_id=source_node_id,
                progress_image=progress_image.model_dump() if progress_image is not None else None,
                step=step,
                order=order,
                total_steps=total_steps,
            ),
        )

    def emit_invocation_complete(
        self,
        queue_id: str,
        queue_item_id: int,
        queue_batch_id: str,
        graph_execution_state_id: str,
        result: dict,
        node: dict,
        source_node_id: str,
    ) -> None:
        """Emitted when an invocation has completed"""
        self.__emit_queue_event(
            event_name="invocation_complete",
            payload=dict(
                queue_id=queue_id,
                queue_item_id=queue_item_id,
                queue_batch_id=queue_batch_id,
                graph_execution_state_id=graph_execution_state_id,
                node=node,
                source_node_id=source_node_id,
                result=result,
            ),
        )

    def emit_invocation_error(
        self,
        queue_id: str,
        queue_item_id: int,
        queue_batch_id: str,
        graph_execution_state_id: str,
        node: dict,
        source_node_id: str,
        error_type: str,
        error: str,
    ) -> None:
        """Emitted when an invocation has completed"""
        self.__emit_queue_event(
            event_name="invocation_error",
            payload=dict(
                queue_id=queue_id,
                queue_item_id=queue_item_id,
                queue_batch_id=queue_batch_id,
                graph_execution_state_id=graph_execution_state_id,
                node=node,
                source_node_id=source_node_id,
                error_type=error_type,
                error=error,
            ),
        )

    def emit_invocation_started(
        self,
        queue_id: str,
        queue_item_id: int,
        queue_batch_id: str,
        graph_execution_state_id: str,
        node: dict,
        source_node_id: str,
    ) -> None:
        """Emitted when an invocation has started"""
        self.__emit_queue_event(
            event_name="invocation_started",
            payload=dict(
                queue_id=queue_id,
                queue_item_id=queue_item_id,
                queue_batch_id=queue_batch_id,
                graph_execution_state_id=graph_execution_state_id,
                node=node,
                source_node_id=source_node_id,
            ),
        )

    def emit_graph_execution_complete(
        self, queue_id: str, queue_item_id: int, queue_batch_id: str, graph_execution_state_id: str
    ) -> None:
        """Emitted when a session has completed all invocations"""
        self.__emit_queue_event(
            event_name="graph_execution_state_complete",
            payload=dict(
                queue_id=queue_id,
                queue_item_id=queue_item_id,
                queue_batch_id=queue_batch_id,
                graph_execution_state_id=graph_execution_state_id,
            ),
        )

    def emit_model_load_started(
        self,
        queue_id: str,
        queue_item_id: int,
        queue_batch_id: str,
        graph_execution_state_id: str,
        model_name: str,
        base_model: BaseModelType,
        model_type: ModelType,
        submodel: SubModelType,
    ) -> None:
        """Emitted when a model is requested"""
        self.__emit_queue_event(
            event_name="model_load_started",
            payload=dict(
                queue_id=queue_id,
                queue_item_id=queue_item_id,
                queue_batch_id=queue_batch_id,
                graph_execution_state_id=graph_execution_state_id,
                model_name=model_name,
                base_model=base_model,
                model_type=model_type,
                submodel=submodel,
            ),
        )

    def emit_model_load_completed(
        self,
        queue_id: str,
        queue_item_id: int,
        queue_batch_id: str,
        graph_execution_state_id: str,
        model_name: str,
        base_model: BaseModelType,
        model_type: ModelType,
        submodel: SubModelType,
        model_info: ModelInfo,
    ) -> None:
        """Emitted when a model is correctly loaded (returns model info)"""
        self.__emit_queue_event(
            event_name="model_load_completed",
            payload=dict(
                queue_id=queue_id,
                queue_item_id=queue_item_id,
                queue_batch_id=queue_batch_id,
                graph_execution_state_id=graph_execution_state_id,
                model_name=model_name,
                base_model=base_model,
                model_type=model_type,
                submodel=submodel,
                hash=model_info.hash,
                location=str(model_info.location),
                precision=str(model_info.precision),
            ),
        )

    def emit_session_retrieval_error(
        self,
        queue_id: str,
        queue_item_id: int,
        queue_batch_id: str,
        graph_execution_state_id: str,
        error_type: str,
        error: str,
    ) -> None:
        """Emitted when session retrieval fails"""
        self.__emit_queue_event(
            event_name="session_retrieval_error",
            payload=dict(
                queue_id=queue_id,
                queue_item_id=queue_item_id,
                queue_batch_id=queue_batch_id,
                graph_execution_state_id=graph_execution_state_id,
                error_type=error_type,
                error=error,
            ),
        )

    def emit_invocation_retrieval_error(
        self,
        queue_id: str,
        queue_item_id: int,
        queue_batch_id: str,
        graph_execution_state_id: str,
        node_id: str,
        error_type: str,
        error: str,
    ) -> None:
        """Emitted when invocation retrieval fails"""
        self.__emit_queue_event(
            event_name="invocation_retrieval_error",
            payload=dict(
                queue_id=queue_id,
                queue_item_id=queue_item_id,
                queue_batch_id=queue_batch_id,
                graph_execution_state_id=graph_execution_state_id,
                node_id=node_id,
                error_type=error_type,
                error=error,
            ),
        )

    def emit_session_canceled(
        self,
        queue_id: str,
        queue_item_id: int,
        queue_batch_id: str,
        graph_execution_state_id: str,
    ) -> None:
        """Emitted when a session is canceled"""
        self.__emit_queue_event(
            event_name="session_canceled",
            payload=dict(
                queue_id=queue_id,
                queue_item_id=queue_item_id,
                queue_batch_id=queue_batch_id,
                graph_execution_state_id=graph_execution_state_id,
            ),
        )

    def emit_queue_item_status_changed(
        self,
        session_queue_item: SessionQueueItem,
        batch_status: BatchStatus,
        queue_status: SessionQueueStatus,
    ) -> None:
        """Emitted when a queue item's status changes"""
        self.__emit_queue_event(
            event_name="queue_item_status_changed",
            payload=dict(
                queue_id=queue_status.queue_id,
                queue_item=dict(
                    queue_id=session_queue_item.queue_id,
                    item_id=session_queue_item.item_id,
                    status=session_queue_item.status,
                    batch_id=session_queue_item.batch_id,
                    session_id=session_queue_item.session_id,
                    error=session_queue_item.error,
                    created_at=str(session_queue_item.created_at) if session_queue_item.created_at else None,
                    updated_at=str(session_queue_item.updated_at) if session_queue_item.updated_at else None,
                    started_at=str(session_queue_item.started_at) if session_queue_item.started_at else None,
                    completed_at=str(session_queue_item.completed_at) if session_queue_item.completed_at else None,
                ),
                batch_status=batch_status.model_dump(),
                queue_status=queue_status.model_dump(),
            ),
        )

    def emit_batch_enqueued(self, enqueue_result: EnqueueBatchResult) -> None:
        """Emitted when a batch is enqueued"""
        self.__emit_queue_event(
            event_name="batch_enqueued",
            payload=dict(
                queue_id=enqueue_result.queue_id,
                batch_id=enqueue_result.batch.batch_id,
                enqueued=enqueue_result.enqueued,
            ),
        )

    def emit_queue_cleared(self, queue_id: str) -> None:
        """Emitted when the queue is cleared"""
        self.__emit_queue_event(
            event_name="queue_cleared",
            payload=dict(queue_id=queue_id),
        )
