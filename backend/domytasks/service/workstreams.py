import json
import logging
import re
from datetime import datetime

from sqlmodel import Session, select
from ulid import ULID

from domytasks.models import Task, Workstream
from domytasks.service.exceptions import NotFoundError

logger = logging.getLogger(__name__)


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or str(ULID())


def create_workstream(session: Session, name: str, color: str | None = None) -> Workstream:
    base_id = _slugify(name)
    workstream_id = base_id
    counter = 1
    while session.get(Workstream, workstream_id):
        workstream_id = f"{base_id}-{counter}"
        counter += 1

    ws = Workstream(id=workstream_id, name=name, color=color)
    session.add(ws)
    session.commit()
    session.refresh(ws)
    logger.info("workstream created id=%s name=%s", ws.id, ws.name)
    return ws


def list_workstreams(session: Session) -> list[Workstream]:
    return list(session.exec(select(Workstream).order_by(Workstream.name)).all())


def delete_workstream(session: Session, workstream_id: str) -> None:
    ws = session.get(Workstream, workstream_id)
    if not ws:
        raise NotFoundError("workstream", workstream_id)

    _tasks = session.exec(select(Task).where(Task.workstream_id == ws.id)).all()
    for t in _tasks:
        session.delete(t)

    session.delete(ws)
    session.commit()
    logger.info("workstream deleted id=%s name=%s (tasks=%d)", ws.id, ws.name, len(_tasks))


def resolve_workstream(session: Session, id_or_name: str) -> Workstream:
    ws = session.get(Workstream, id_or_name)
    if ws:
        return ws

    for candidate in list_workstreams(session):
        if candidate.name.lower() == id_or_name.lower():
            return candidate

    raise NotFoundError("workstream", id_or_name)
