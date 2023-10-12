from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional

from invokeai.app.services.shared.pagination import OffsetPaginatedResults

from .image_records_common import ImageCategory, ImageRecord, ImageRecordChanges, ResourceOrigin


class ImageRecordStorageBase(ABC):
    """Low-level service responsible for interfacing with the image record store."""

    # TODO: Implement an `update()` method

    @abstractmethod
    def get(self, image_name: str) -> ImageRecord:
        """Gets an image record."""
        pass

    @abstractmethod
    def get_metadata(self, image_name: str) -> Optional[dict]:
        """Gets an image's metadata'."""
        pass

    @abstractmethod
    def update(
        self,
        image_name: str,
        changes: ImageRecordChanges,
    ) -> None:
        """Updates an image record."""
        pass

    @abstractmethod
    def get_many(
        self,
        offset: Optional[int] = None,
        limit: Optional[int] = None,
        image_origin: Optional[ResourceOrigin] = None,
        categories: Optional[list[ImageCategory]] = None,
        is_intermediate: Optional[bool] = None,
        board_id: Optional[str] = None,
    ) -> OffsetPaginatedResults[ImageRecord]:
        """Gets a page of image records."""
        pass

    # TODO: The database has a nullable `deleted_at` column, currently unused.
    # Should we implement soft deletes? Would need coordination with ImageFileStorage.
    @abstractmethod
    def delete(self, image_name: str) -> None:
        """Deletes an image record."""
        pass

    @abstractmethod
    def delete_many(self, image_names: list[str]) -> None:
        """Deletes many image records."""
        pass

    @abstractmethod
    def delete_intermediates(self) -> list[str]:
        """Deletes all intermediate image records, returning a list of deleted image names."""
        pass

    @abstractmethod
    def save(
        self,
        image_name: str,
        image_origin: ResourceOrigin,
        image_category: ImageCategory,
        width: int,
        height: int,
        session_id: Optional[str],
        node_id: Optional[str],
        metadata: Optional[dict],
        is_intermediate: bool = False,
        starred: bool = False,
    ) -> datetime:
        """Saves an image record."""
        pass

    @abstractmethod
    def get_most_recent_image_for_board(self, board_id: str) -> Optional[ImageRecord]:
        """Gets the most recent image for a board."""
        pass
