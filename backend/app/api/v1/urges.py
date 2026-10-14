from fastapi import APIRouter

router = APIRouter(prefix='/urges', tags=['urges'])

URGES = []


@router.get('')
def list_urges():
    return URGES
