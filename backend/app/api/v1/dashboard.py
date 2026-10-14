from fastapi import APIRouter

router = APIRouter(prefix='/dashboard', tags=['dashboard'])


@router.get('')
def get_dashboard():
    return {
        'userName': None,
        'streak': 0,
        'daysSinceStart': 0,
        'currentFocus': None,
        'commitmentsCompleted': 0,
        'journalEntries': 0,
        'urgeLogCount': 0,
        'weeklyProgress': [],
        'habitCompletion': [],
        'milestones': [],
    }
