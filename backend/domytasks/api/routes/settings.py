from fastapi import APIRouter, Depends
from sqlmodel import Session

from domytasks.api.deps import get_db
from domytasks.schemas import ViewPrefs, ViewPrefsUpdate
from domytasks.service import settings as settings_service

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/view", response_model=ViewPrefs)
def get_view_prefs(session: Session = Depends(get_db)):
    return settings_service.get_view_prefs(session)


@router.patch("/view", response_model=ViewPrefs)
def set_view_prefs(
    body: ViewPrefsUpdate,
    session: Session = Depends(get_db),
):
    return settings_service.set_view_prefs(session, body)
