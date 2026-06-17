from fastapi import APIRouter, Depends
from sqlmodel import Session

from domytasks.api.deps import get_db
from domytasks.schemas import WorkstreamCreate, WorkstreamOut
from domytasks.service import workstreams as workstreams_service

router = APIRouter(prefix="/workstreams", tags=["workstreams"])


@router.get("", response_model=list[WorkstreamOut])
def list_workstreams(session: Session = Depends(get_db)):
    streams = workstreams_service.list_workstreams(session)
    return [
        WorkstreamOut(
            id=ws.id,
            name=ws.name,
            color=ws.color,
            created_at=ws.created_at,
        )
        for ws in streams
    ]


@router.post("", response_model=WorkstreamOut, status_code=201)
def create_workstream(
    body: WorkstreamCreate,
    session: Session = Depends(get_db),
):
    ws = workstreams_service.create_workstream(session, body.name, body.color)
    return WorkstreamOut(
        id=ws.id,
        name=ws.name,
        color=ws.color,
        created_at=ws.created_at,
    )
