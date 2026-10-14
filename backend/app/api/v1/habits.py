from fastapi import APIRouter

router = APIRouter(prefix='/habits', tags=['habits'])

HABITS = []


@router.get('')
def list_habits():
    return HABITS


@router.post('')
def create_habit(payload: dict):
    habit = {'id': f"habit-{len(HABITS) + 1}", **payload}
    HABITS.append(habit)
    return habit
