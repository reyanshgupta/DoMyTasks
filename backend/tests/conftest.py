import tempfile
from pathlib import Path

import pytest
from sqlmodel import Session

from domytasks.db import get_engine, init_db, reset_engine
from domytasks.service.workstreams import create_workstream


@pytest.fixture
def db_path(tmp_path: Path) -> Path:
    return tmp_path / "test.db"


@pytest.fixture
def session(db_path: Path):
    reset_engine()
    init_db(db_path)
    engine = get_engine(db_path)
    with Session(engine) as s:
        yield s
    reset_engine()


@pytest.fixture
def workstream(session: Session):
    return create_workstream(session, "Engineering", color="#3b82f6")
