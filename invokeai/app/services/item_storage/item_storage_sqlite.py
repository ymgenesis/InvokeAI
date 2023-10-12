import sqlite3
import threading
from typing import Generic, Optional, TypeVar, get_args

from pydantic import BaseModel, parse_raw_as

from invokeai.app.services.shared.pagination import PaginatedResults
from invokeai.app.services.shared.sqlite import SqliteDatabase

from .item_storage_base import ItemStorageABC

T = TypeVar("T", bound=BaseModel)


class SqliteItemStorage(ItemStorageABC, Generic[T]):
    _table_name: str
    _conn: sqlite3.Connection
    _cursor: sqlite3.Cursor
    _id_field: str
    _lock: threading.Lock

    def __init__(self, db: SqliteDatabase, table_name: str, id_field: str = "id"):
        super().__init__()

        self._lock = db.lock
        self._conn = db.conn
        self._table_name = table_name
        self._id_field = id_field  # TODO: validate that T has this field
        self._cursor = self._conn.cursor()

        self._create_table()

    def _create_table(self):
        try:
            self._lock.acquire()
            self._cursor.execute(
                f"""CREATE TABLE IF NOT EXISTS {self._table_name} (
                item TEXT,
                id TEXT GENERATED ALWAYS AS (json_extract(item, '$.{self._id_field}')) VIRTUAL NOT NULL);"""
            )
            self._cursor.execute(
                f"""CREATE UNIQUE INDEX IF NOT EXISTS {self._table_name}_id ON {self._table_name}(id);"""
            )
        finally:
            self._lock.release()

    def _parse_item(self, item: str) -> T:
        # __orig_class__ is technically an implementation detail of the typing module, not a supported API
        item_type = get_args(self.__orig_class__)[0]  # type: ignore
        return parse_raw_as(item_type, item)

    def set(self, item: T):
        try:
            self._lock.acquire()
            self._cursor.execute(
                f"""INSERT OR REPLACE INTO {self._table_name} (item) VALUES (?);""",
                (item.json(),),
            )
            self._conn.commit()
        finally:
            self._lock.release()
        self._on_changed(item)

    def get(self, id: str) -> Optional[T]:
        try:
            self._lock.acquire()
            self._cursor.execute(f"""SELECT item FROM {self._table_name} WHERE id = ?;""", (str(id),))
            result = self._cursor.fetchone()
        finally:
            self._lock.release()

        if not result:
            return None

        return self._parse_item(result[0])

    def get_raw(self, id: str) -> Optional[str]:
        try:
            self._lock.acquire()
            self._cursor.execute(f"""SELECT item FROM {self._table_name} WHERE id = ?;""", (str(id),))
            result = self._cursor.fetchone()
        finally:
            self._lock.release()

        if not result:
            return None

        return result[0]

    def delete(self, id: str):
        try:
            self._lock.acquire()
            self._cursor.execute(f"""DELETE FROM {self._table_name} WHERE id = ?;""", (str(id),))
            self._conn.commit()
        finally:
            self._lock.release()
        self._on_deleted(id)

    def list(self, page: int = 0, per_page: int = 10) -> PaginatedResults[T]:
        try:
            self._lock.acquire()
            self._cursor.execute(
                f"""SELECT item FROM {self._table_name} LIMIT ? OFFSET ?;""",
                (per_page, page * per_page),
            )
            result = self._cursor.fetchall()

            items = list(map(lambda r: self._parse_item(r[0]), result))

            self._cursor.execute(f"""SELECT count(*) FROM {self._table_name};""")
            count = self._cursor.fetchone()[0]
        finally:
            self._lock.release()

        pageCount = int(count / per_page) + 1

        return PaginatedResults[T](items=items, page=page, pages=pageCount, per_page=per_page, total=count)

    def search(self, query: str, page: int = 0, per_page: int = 10) -> PaginatedResults[T]:
        try:
            self._lock.acquire()
            self._cursor.execute(
                f"""SELECT item FROM {self._table_name} WHERE item LIKE ? LIMIT ? OFFSET ?;""",
                (f"%{query}%", per_page, page * per_page),
            )
            result = self._cursor.fetchall()

            items = list(map(lambda r: self._parse_item(r[0]), result))

            self._cursor.execute(
                f"""SELECT count(*) FROM {self._table_name} WHERE item LIKE ?;""",
                (f"%{query}%",),
            )
            count = self._cursor.fetchone()[0]
        finally:
            self._lock.release()

        pageCount = int(count / per_page) + 1

        return PaginatedResults[T](items=items, page=page, pages=pageCount, per_page=per_page, total=count)
