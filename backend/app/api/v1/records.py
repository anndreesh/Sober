from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.records import HabitRecord, JournalRecord, UrgeRecord
from app.models.user import User
from app.schemas.records import HabitPayload, JournalPayload, LocalDataImportPayload, UrgePayload

router = APIRouter(tags=['user records'])

RECORD_FIELDS = {
    HabitRecord: ('name', 'title', 'description', 'reason', 'streak', 'completed', 'start_date', 'start_at', 'first_start_date', 'streak_history', 'color'),
    JournalRecord: ('date', 'mood', 'note', 'triggers', 'habit_id', 'habit_name'),
    UrgeRecord: ('time', 'trigger', 'intensity', 'coping', 'habit_id', 'habit_name'),
}


def save_record(db: Session, model, user: User, payload, fields: tuple[str, ...]):
    record = db.query(model).filter(model.user_id == user.id, model.record_id == payload.id).first()
    if record is None:
        record = model(user_id=user.id, record_id=payload.id)
        db.add(record)
    values = payload.model_dump(exclude={'id'})
    for field in fields:
        value = values[field]
        if model is HabitRecord and field == 'start_at':
            value = value or getattr(record, field, None) or f"{values['start_date']}T00:00:00"
        if model is HabitRecord and field == 'first_start_date':
            history = values.get('streak_history') or []
            value = getattr(record, field, None) or value or (history[0].get('startDate') if history else values['start_date'])
        setattr(record, field, value)
    db.commit()
    return record


def serialize(record, fields: tuple[str, ...]):
    result = {'id': record.record_id}
    for field in fields:
        first, *rest = field.split('_')
        result[first + ''.join(part.capitalize() for part in rest)] = getattr(record, field)
    if isinstance(record, HabitRecord) and not result.get('firstStartDate'):
        history = result.get('streakHistory') or []
        result['firstStartDate'] = history[0].get('startDate') if history else result.get('startDate')
    return result


@router.post('/migration/local')
def import_local_data(payload: LocalDataImportPayload, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.query(User).filter(User.id == user.id).with_for_update().first()

    collections = ((HabitRecord, payload.habits), (JournalRecord, payload.journal_entries), (UrgeRecord, payload.urge_logs))
    count = 0
    for model, records in collections:
        fields = RECORD_FIELDS[model]
        for item in records:
            if db.query(model.id).filter_by(user_id=user.id, record_id=item.id).first():
                continue
            record = model(user_id=user.id, record_id=item.id)
            values = item.model_dump(exclude={'id'})
            for field in fields:
                setattr(record, field, values[field])
            db.add(record)
            count += 1
    db.commit()
    return {'imported': count > 0, 'count': count}


@router.get('/habits')
def list_habits(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fields = ('name', 'title', 'description', 'reason', 'streak', 'completed', 'start_date', 'start_at', 'first_start_date', 'streak_history', 'color')
    return [serialize(item, fields) for item in db.query(HabitRecord).filter_by(user_id=user.id).order_by(HabitRecord.id.desc()).all()]


@router.put('/habits')
def put_habit(payload: HabitPayload, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fields = ('name', 'title', 'description', 'reason', 'streak', 'completed', 'start_date', 'start_at', 'first_start_date', 'streak_history', 'color')
    return serialize(save_record(db, HabitRecord, user, payload, fields), fields)


@router.delete('/habits/{record_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(record_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    record = db.query(HabitRecord).filter_by(user_id=user.id, record_id=record_id).first()
    if record:
        db.delete(record)
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get('/journal')
def list_journal(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fields = ('date', 'mood', 'note', 'triggers', 'habit_id', 'habit_name')
    return [serialize(item, fields) for item in db.query(JournalRecord).filter_by(user_id=user.id).order_by(JournalRecord.id.desc()).all()]


@router.put('/journal')
def put_journal(payload: JournalPayload, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fields = ('date', 'mood', 'note', 'triggers', 'habit_id', 'habit_name')
    return serialize(save_record(db, JournalRecord, user, payload, fields), fields)


@router.get('/urges')
def list_urges(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fields = ('time', 'trigger', 'intensity', 'coping', 'habit_id', 'habit_name')
    return [serialize(item, fields) for item in db.query(UrgeRecord).filter_by(user_id=user.id).order_by(UrgeRecord.id.desc()).all()]


@router.put('/urges')
def put_urge(payload: UrgePayload, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fields = ('time', 'trigger', 'intensity', 'coping', 'habit_id', 'habit_name')
    return serialize(save_record(db, UrgeRecord, user, payload, fields), fields)
