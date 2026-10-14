from fastapi import APIRouter

router = APIRouter(prefix='/statistics', tags=['statistics'])


@router.get('')
def get_statistics():
    return {
        'consistency': 0,
        'averageUrgeIntensity': 0,
        'weeklyTrend': [],
        'daysWithToolsUsed': 0,
        'report': {
            'bestDay': None,
            'mostCommonTrigger': None,
            'streak': 0,
        },
    }
