from fastapi import APIRouter

router = APIRouter(prefix='/journal', tags=['journal'])

JOURNAL = []


@router.get('')
def list_entries():
    return JOURNAL


@router.post('')
def create_entry(payload: dict):
    entry = {'id': f"entry-{len(JOURNAL) + 1}", **payload}
    JOURNAL.append(entry)
    return entry
