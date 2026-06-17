from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class TaskStatus(str, Enum):
    todo = "todo"
    doing = "doing"
    done = "done"


class Workstream(SQLModel, table=True):
    __tablename__ = "workstreams"

    id: str = Field(primary_key=True)
    name: str
    color: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: str = Field(primary_key=True)
    workstream_id: str = Field(foreign_key="workstreams.id")
    title: str
    context: str
    notes: Optional[str] = None
    status: TaskStatus = TaskStatus.todo
    priority: int = 0
    due_at: Optional[datetime] = None
    tags: Optional[str] = None  # JSON array stored as text
    sort_order: Optional[float] = None
    claimed_by: Optional[str] = None
    claimed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Setting(SQLModel, table=True):
    __tablename__ = "settings"

    key: str = Field(primary_key=True)
    value: str  # JSON stored as text
