# Copyright (c) 2022 Kyle Schouviller (https://github.com/kyle0654) and the InvokeAI Team
from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from logging import Logger

    from .board_image_records.board_image_records_base import BoardImageRecordStorageBase
    from .board_images.board_images_base import BoardImagesServiceABC
    from .board_records.board_records_base import BoardRecordStorageBase
    from .boards.boards_base import BoardServiceABC
    from .config import InvokeAIAppConfig
    from .events.events_base import EventServiceBase
    from .image_files.image_files_base import ImageFileStorageBase
    from .image_records.image_records_base import ImageRecordStorageBase
    from .images.images_base import ImageServiceABC
    from .invocation_cache.invocation_cache_base import InvocationCacheBase
    from .invocation_processor.invocation_processor_base import InvocationProcessorABC
    from .invocation_queue.invocation_queue_base import InvocationQueueABC
    from .invocation_stats.invocation_stats_base import InvocationStatsServiceBase
    from .item_storage.item_storage_base import ItemStorageABC
    from .latents_storage.latents_storage_base import LatentsStorageBase
    from .model_manager.model_manager_base import ModelManagerServiceBase
    from .names.names_base import NameServiceBase
    from .session_processor.session_processor_base import SessionProcessorBase
    from .session_queue.session_queue_base import SessionQueueBase
    from .shared.graph import GraphExecutionState, LibraryGraph
    from .urls.urls_base import UrlServiceBase


class InvocationServices:
    """Services that can be used by invocations"""

    # TODO: Just forward-declared everything due to circular dependencies. Fix structure.
    board_images: "BoardImagesServiceABC"
    board_image_record_storage: "BoardImageRecordStorageBase"
    boards: "BoardServiceABC"
    board_records: "BoardRecordStorageBase"
    configuration: "InvokeAIAppConfig"
    events: "EventServiceBase"
    graph_execution_manager: "ItemStorageABC[GraphExecutionState]"
    graph_library: "ItemStorageABC[LibraryGraph]"
    images: "ImageServiceABC"
    image_records: "ImageRecordStorageBase"
    image_files: "ImageFileStorageBase"
    latents: "LatentsStorageBase"
    logger: "Logger"
    model_manager: "ModelManagerServiceBase"
    processor: "InvocationProcessorABC"
    performance_statistics: "InvocationStatsServiceBase"
    queue: "InvocationQueueABC"
    session_queue: "SessionQueueBase"
    session_processor: "SessionProcessorBase"
    invocation_cache: "InvocationCacheBase"
    names: "NameServiceBase"
    urls: "UrlServiceBase"

    def __init__(
        self,
        board_images: "BoardImagesServiceABC",
        board_image_records: "BoardImageRecordStorageBase",
        boards: "BoardServiceABC",
        board_records: "BoardRecordStorageBase",
        configuration: "InvokeAIAppConfig",
        events: "EventServiceBase",
        graph_execution_manager: "ItemStorageABC[GraphExecutionState]",
        graph_library: "ItemStorageABC[LibraryGraph]",
        images: "ImageServiceABC",
        image_files: "ImageFileStorageBase",
        image_records: "ImageRecordStorageBase",
        latents: "LatentsStorageBase",
        logger: "Logger",
        model_manager: "ModelManagerServiceBase",
        processor: "InvocationProcessorABC",
        performance_statistics: "InvocationStatsServiceBase",
        queue: "InvocationQueueABC",
        session_queue: "SessionQueueBase",
        session_processor: "SessionProcessorBase",
        invocation_cache: "InvocationCacheBase",
        names: "NameServiceBase",
        urls: "UrlServiceBase",
    ):
        self.board_images = board_images
        self.board_image_records = board_image_records
        self.boards = boards
        self.board_records = board_records
        self.configuration = configuration
        self.events = events
        self.graph_execution_manager = graph_execution_manager
        self.graph_library = graph_library
        self.images = images
        self.image_files = image_files
        self.image_records = image_records
        self.latents = latents
        self.logger = logger
        self.model_manager = model_manager
        self.processor = processor
        self.performance_statistics = performance_statistics
        self.queue = queue
        self.session_queue = session_queue
        self.session_processor = session_processor
        self.invocation_cache = invocation_cache
        self.names = names
        self.urls = urls
