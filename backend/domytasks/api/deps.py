from collections.abc import Generator

from fastapi import Header
from sqlmodel import Session

from domytasks.db import get_session


def get_db() -> Generator[Session, None, None]:
    yield from get_session()


def get_source(
    x_source: str | None = Header(default=None, alias="X-Source"),
) -> str:
    return x_source or "ui"
