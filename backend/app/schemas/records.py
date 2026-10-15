from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


def to_camel(value: str) -> str:
    first, *rest = value.split('_')
    return first + ''.join(part.capitalize() for part in rest)


class RecordPayload(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    id: int = Field(gt=0)


class HabitPayload(RecordPayload):
    name: str
    title: str
    description: str
    reason: str
    streak: int = 0
    completed: int = 0
    start_date: str
    streak_history: list[dict[str, str]] = Field(default_factory=list)
    color: str = 'from-emerald-500 to-teal-500'


class JournalPayload(RecordPayload):
    date: str
    mood: str
    note: str
    triggers: list[str] = Field(default_factory=list)
    habit_id: Optional[int] = None
    habit_name: Optional[str] = None


class UrgePayload(RecordPayload):
    time: str
    trigger: str
    intensity: int = Field(ge=1, le=10)
    coping: str
    habit_id: Optional[int] = None
    habit_name: Optional[str] = None


class LocalDataImportPayload(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    habits: list[HabitPayload] = Field(default_factory=list)
    journal_entries: list[JournalPayload] = Field(default_factory=list)
    urge_logs: list[UrgePayload] = Field(default_factory=list)
