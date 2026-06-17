import json

from sqlmodel import Session

from domytasks.models import Setting
from domytasks.schemas import ViewPrefs, ViewPrefsUpdate

VIEW_PREFS_KEY = "view_prefs"

DEFAULT_VIEW_PREFS = ViewPrefs()


def get_view_prefs(session: Session) -> ViewPrefs:
    row = session.get(Setting, VIEW_PREFS_KEY)
    if not row:
        return DEFAULT_VIEW_PREFS.model_copy()
    data = json.loads(row.value)
    return ViewPrefs.model_validate(data)


def set_view_prefs(session: Session, prefs: ViewPrefsUpdate) -> ViewPrefs:
    current = get_view_prefs(session)
    updated = current.model_copy(
        update={k: v for k, v in prefs.model_dump(exclude_unset=True).items()}
    )
    row = session.get(Setting, VIEW_PREFS_KEY)
    if row:
        row.value = updated.model_dump_json()
        session.add(row)
    else:
        session.add(Setting(key=VIEW_PREFS_KEY, value=updated.model_dump_json()))
    session.commit()
    return updated
