from fastapi import APIRouter

router = APIRouter(prefix='/community', tags=['community'])

COMMUNITY = []


@router.get('')
def list_posts():
    return COMMUNITY
