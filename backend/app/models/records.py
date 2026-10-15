from sqlalchemy import BigInteger, Column, ForeignKey, Integer, JSON, String, UniqueConstraint

from app.db.session import Base


class HabitRecord(Base):
    __tablename__ = 'habits'
    __table_args__ = (UniqueConstraint('user_id', 'record_id', name='uq_habit_user_record'),)

    id = Column(Integer, primary_key=True)
    record_id = Column(BigInteger, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(160), nullable=False)
    title = Column(String(160), nullable=False)
    description = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    streak = Column(Integer, nullable=False, default=0)
    completed = Column(Integer, nullable=False, default=0)
    start_date = Column(String(10), nullable=False)
    first_start_date = Column(String(10), nullable=True)
    streak_history = Column(JSON, nullable=False, default=list)
    color = Column(String(80), nullable=False, default='from-emerald-500 to-teal-500')


class JournalRecord(Base):
    __tablename__ = 'journal_entries'
    __table_args__ = (UniqueConstraint('user_id', 'record_id', name='uq_journal_user_record'),)

    id = Column(Integer, primary_key=True)
    record_id = Column(BigInteger, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    date = Column(String(10), nullable=False)
    mood = Column(String(80), nullable=False)
    note = Column(String, nullable=False)
    triggers = Column(JSON, nullable=False, default=list)
    habit_id = Column(BigInteger)
    habit_name = Column(String(160))


class UrgeRecord(Base):
    __tablename__ = 'urge_logs'
    __table_args__ = (UniqueConstraint('user_id', 'record_id', name='uq_urge_user_record'),)

    id = Column(Integer, primary_key=True)
    record_id = Column(BigInteger, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    time = Column(String(40), nullable=False)
    trigger = Column(String, nullable=False)
    intensity = Column(Integer, nullable=False)
    coping = Column(String, nullable=False)
    habit_id = Column(BigInteger)
    habit_name = Column(String(160))
