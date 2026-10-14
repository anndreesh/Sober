from fastapi import APIRouter

router = APIRouter(prefix='/commitments', tags=['commitments'])

COMMITMENTS = []


@router.get('')
def list_commitments():
    return COMMITMENTS
