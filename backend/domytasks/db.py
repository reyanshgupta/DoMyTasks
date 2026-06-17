from collections.abc import Generator
from contextlib import contextmanager
from pathlib import Path

from sqlalchemy import event
from sqlmodel import Session, SQLModel, create_engine

from domytasks.config import get_settings

_engine = None


def _set_sqlite_pragma(dbapi_conn, _connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def get_engine(db_path: Path | None = None):
    global _engine
    if _engine is not None:
        return _engine

    path = db_path or get_settings().db_path
    path.parent.mkdir(parents=True, exist_ok=True)

    _engine = create_engine(
        f"sqlite:///{path}",
        connect_args={"check_same_thread": False},
    )
    event.listen(_engine, "connect", _set_sqlite_pragma)
    return _engine


def init_db(db_path: Path | None = None) -> None:
    engine = get_engine(db_path)
    SQLModel.metadata.create_all(engine)


def reset_engine() -> None:
    """Reset engine (for tests)."""
    global _engine
    if _engine is not None:
        _engine.dispose()
    _engine = None


@contextmanager
def session_scope(db_path: Path | None = None) -> Generator[Session, None, None]:
    engine = get_engine(db_path)
    with Session(engine) as session:
        yield session


def get_session() -> Generator[Session, None, None]:
    with Session(get_engine()) as session:
        yield session
