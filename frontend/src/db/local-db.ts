import Dexie, { type Table } from 'dexie'

export interface HabitRecord {
  id?: number
  userId?: number
  name: string
  title: string
  description: string
  reason: string
  streak: number
  completed: number
  startDate: string
  streakHistory?: { startDate: string; endDate: string }[]
  color: string
}

export interface CommitmentRecord {
  id?: number
  userId?: number
  title: string
  description: string
  completed: boolean
}

export interface JournalEntryRecord {
  id?: number
  userId?: number
  date: string
  mood: string
  note: string
  triggers: string[]
  habitId?: number
  habitName?: string
}

export interface UrgeLogRecord {
  id?: number
  userId?: number
  time: string
  trigger: string
  intensity: number
  coping: string
  habitId?: number
  habitName?: string
}

export interface MilestoneRecord {
  id?: number
  userId?: number
  title: string
  dueDate: string
  status: 'completed' | 'active' | 'locked'
}

class SoberFreeDB extends Dexie {
  habits!: Table<HabitRecord, number>
  commitments!: Table<CommitmentRecord, number>
  journalEntries!: Table<JournalEntryRecord, number>
  urgeLogs!: Table<UrgeLogRecord, number>
  milestones!: Table<MilestoneRecord, number>

  constructor() {
    super('sober-free-web')
    this.version(2).stores({
      habits: '++id, userId, name, startDate',
      commitments: '++id, userId, title, completed',
      journalEntries: '++id, userId, date, mood, habitId',
      urgeLogs: '++id, userId, time, intensity, habitId',
      milestones: '++id, userId, title, status',
    })
  }
}

export const db = new SoberFreeDB()

export async function clearLocalAppData() {
  await db.transaction('rw', db.habits, db.commitments, db.journalEntries, db.urgeLogs, db.milestones, async () => {
    await Promise.all([
      db.habits.clear(),
      db.commitments.clear(),
      db.journalEntries.clear(),
      db.urgeLogs.clear(),
      db.milestones.clear(),
    ])
  })
}
