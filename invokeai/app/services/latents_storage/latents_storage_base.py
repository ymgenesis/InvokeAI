# Copyright (c) 2023 Kyle Schouviller (https://github.com/kyle0654)

from abc import ABC, abstractmethod
from typing import Callable

import torch


class LatentsStorageBase(ABC):
    """Responsible for storing and retrieving latents."""

    _on_changed_callbacks: list[Callable[[torch.Tensor], None]]
    _on_deleted_callbacks: list[Callable[[str], None]]

    def __init__(self) -> None:
        self._on_changed_callbacks = list()
        self._on_deleted_callbacks = list()

    @abstractmethod
    def get(self, name: str) -> torch.Tensor:
        pass

    @abstractmethod
    def save(self, name: str, data: torch.Tensor) -> None:
        pass

    @abstractmethod
    def delete(self, name: str) -> None:
        pass

    def on_changed(self, on_changed: Callable[[torch.Tensor], None]) -> None:
        """Register a callback for when an item is changed"""
        self._on_changed_callbacks.append(on_changed)

    def on_deleted(self, on_deleted: Callable[[str], None]) -> None:
        """Register a callback for when an item is deleted"""
        self._on_deleted_callbacks.append(on_deleted)

    def _on_changed(self, item: torch.Tensor) -> None:
        for callback in self._on_changed_callbacks:
            callback(item)

    def _on_deleted(self, item_id: str) -> None:
        for callback in self._on_deleted_callbacks:
            callback(item_id)
