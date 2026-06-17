import json
import logging
import re
from datetime import datetime

from sqlmodel import Session, select
from ulid import ULID

from domytasks.models import Workstream
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


def resolve_workstream(session: Session, id_or_name: str) -> Workstream:
    ws = session.get(Workstream, id_or_name)
    if ws:
        return ws

    for candidate in list_workstreams(session):
        if candidate.name.lower() == id_or_name.lower():
            return candidate

    raise NotFoundError("workstream", id_or_name)
