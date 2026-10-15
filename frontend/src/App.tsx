import { lazy, Suspense, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { es } from 'date-fns/locale'
import {
  BookOpenText,
  Flame,
  Home,
  MoonStar,
  Plus,
  Quote,
  RefreshCw,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { addDays, differenceInCalendarDays, format, isValid, parseISO, startOfDay, subDays, subMonths, subYears } from 'date-fns'
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import { quotes } from './data/quotes'
import { db } from './db/local-db'
import { apiFetch, clearSession, getStoredSession, saveSession, type SessionData } from './lib/api-client'
import { cn } from './lib/utils'

type Habit = {
  id: number
  name: string
  title: string
  description: string
  reason: string
  streak: number
  completed: number
  startDate: string
  streakHistory: { startDate: string; endDate: string }[]
  color: string
}

type JournalEntry = {
  id: number
  date: string
  mood: string
  note: string
  triggers: string[]
  habitId?: number
  habitName?: string
}

type UrgeLog = {
  id: number
  time: string
  trigger: string
  intensity: number
  coping: string
  habitId?: number
  habitName?: string
}

type NewRecordMode = 'habit' | 'journal' | 'urge'

type HabitForm = {
  title: string
  description: string
  reason: string
  startDate: string
}

type HabitChartRange = 'week' | 'month' | 'year' | 'all'

const WeeklyActivityChart = lazy(() => import('./components/Charts').then((charts) => ({ default: charts.WeeklyActivityChart })))
const HabitProgressChart = lazy(() => import('./components/Charts').then((charts) => ({ default: charts.HabitProgressChart })))
const WeeklyJournalChart = lazy(() => import('./components/Charts').then((charts) => ({ default: charts.WeeklyJournalChart })))
const HabitStreakChart = lazy(() => import('./components/Charts').then((charts) => ({ default: charts.HabitStreakChart })))

function getStreakDays(startDate: string, today = new Date()) {
  const start = parseISO(startDate)
  if (!isValid(start)) return 0

  const elapsedDays = differenceInCalendarDays(startOfDay(today), startOfDay(start))
  return elapsedDays < 0 ? 0 : elapsedDays + 1
}

function getArchivedStreaks(habit: Habit, today = new Date()) {
  const start = parseISO(habit.startDate)
  if (!isValid(start) || startOfDay(start) > startOfDay(today)) return habit.streakHistory

  const endDate = format(
    startOfDay(start) >= startOfDay(today) ? startOfDay(today) : subDays(startOfDay(today), 1),
    'yyyy-MM-dd',
  )
  return [...habit.streakHistory, { startDate: habit.startDate, endDate }]
}

function AuthScreen({ onAuth }: { onAuth: (session: SessionData) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const payload = mode === 'login'
        ? { username: form.username, email: form.email || undefined, password: form.password }
        : { name: form.name, username: form.username, email: form.email, password: form.password }

      const data = await apiFetch<{ token: string; user: SessionData['user'] }>(`/api/v1${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const session = { token: data.token, user: data.user }
      saveSession(session)
      onAuth(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la autenticación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-screen min-h-screen px-5 py-6 sm:px-8 lg:px-12">
      <div className="auth-layout mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(390px,.8fr)] lg:gap-20">
        <section className="auth-story relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[2rem] p-7 text-white sm:p-10 lg:min-h-[680px] lg:p-14">
          <div className="auth-story-lines" aria-hidden="true" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="brand-mark flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-semibold text-white">S</div>
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#c8d6c9]">Sober</p>
              <p className="mt-0.5 text-sm text-white/70">Un día a la vez</p>
            </div>
          </div>

          <div className="relative z-10 my-10 max-w-2xl lg:my-auto lg:py-16">
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d8b77e]"><span className="h-px w-8 bg-[#d8b77e]" /> Un espacio para volver a ti</p>
            <h1 className="auth-display max-w-2xl text-[2.8rem] font-medium leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-[5.2rem]">Tu proceso merece <em>un lugar seguro.</em></h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[#e0e8df]/75 sm:text-lg">Un registro privado para reconocer lo que sientes, cuidar tus hábitos y celebrar cada día que eliges seguir.</p>
          </div>

          <div className="auth-story-footer relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-5 text-xs text-[#e0e8df]/65 sm:text-sm">
            <span>Sin prisa. Sin juicio. A tu ritmo.</span>
            <span className="auth-private"><span aria-hidden="true">✳</span> Tu espacio personal</span>
          </div>
        </section>

        <section className="auth-panel mx-auto w-full max-w-[460px] py-2 lg:py-10" aria-labelledby="auth-title">
          <div className="mb-8 lg:mb-10">
            <p className="eyebrow mb-2 text-xs font-semibold uppercase tracking-[0.18em]">{mode === 'login' ? 'Qué bueno verte' : 'Empieza con calma'}</p>
            <h2 id="auth-title" className="auth-heading text-[2.3rem] font-medium leading-tight tracking-[-0.04em] text-[#17291f]">{mode === 'login' ? 'Volvamos a empezar.' : 'Un paso para ti.'}</h2>
            <p className="mt-2 text-sm leading-6 text-[#647067]">{mode === 'login' ? 'Entra a tu espacio y continúa desde donde estás.' : 'Crea tu espacio privado. Puedes avanzar a tu propio ritmo.'}</p>
          </div>

          <div className="auth-mode mb-6 flex rounded-2xl p-1">
            <button type="button" onClick={() => setMode('login')} aria-pressed={mode === 'login'} className={cn('flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition', mode === 'login' ? 'active' : '')}>
              Iniciar sesión
            </button>
            <button type="button" onClick={() => setMode('signup')} aria-pressed={mode === 'signup'} className={cn('flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition', mode === 'signup' ? 'active' : '')}>
              Crear cuenta
            </button>
          </div>

          <form className="auth-form space-y-4" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <label className="auth-field block text-sm font-medium">
                Nombre
                <input autoComplete="name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition" placeholder="Tu nombre" required />
              </label>
            )}

            <label className="auth-field block text-sm font-medium">
              Usuario
              <input autoComplete="username" value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition" placeholder="Tu usuario" required />
            </label>

            {mode === 'signup' && (
              <label className="auth-field block text-sm font-medium">
                Email
                <input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition" placeholder="tu@email.com" required />
              </label>
            )}

            <label className="auth-field block text-sm font-medium">
              Contraseña
              <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition" placeholder="Mínimo 8 caracteres" minLength={8} required />
            </label>

            {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

            <Button type="submit" className="auth-submit mt-2 w-full" disabled={loading}>
              {loading ? 'Un momento…' : mode === 'login' ? 'Entrar a mi espacio' : 'Crear mi espacio'}
            </Button>
          </form>

          <p className="auth-footnote mt-6 text-center text-xs leading-5 text-[#7a857d]">Un lugar privado para acompañar tu proceso, un día a la vez.</p>
        </section>
      </div>
    </main>
  )
}

function Layout({ children, currentUser, onLogout, darkMode, onToggleDark, onOpenNewRecord }: { children: ReactNode; currentUser?: SessionData['user']; onLogout: () => void; darkMode: boolean; onToggleDark: () => void; onOpenNewRecord: () => void }) {
  const navigation = [
    { to: '/dashboard', label: 'Inicio', icon: Home },
    { to: '/habits', label: 'Hábitos', icon: Sparkles },
    { to: '/journal', label: 'Diario', icon: BookOpenText },
    { to: '/urges', label: 'Impulsos', icon: Zap },
    { to: '/statistics', label: 'Progreso', icon: TrendingUp },
    { to: '/settings', label: 'Ajustes', icon: Settings },
  ]

  return (
    <div className={cn('app-shell min-h-screen transition-colors', darkMode ? 'dark-shell text-slate-100' : 'text-slate-800')}>
      <div className="app-frame mx-auto flex max-w-[1500px] gap-6 px-4 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-7">
        <aside className={cn('app-sidebar hidden w-64 shrink-0 rounded-[28px] border p-4 shadow-sm backdrop-blur-md lg:block', darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200/80 bg-white/85')}>
          <div className="flex items-center gap-3 px-3 pb-5 pt-2">
            <div className="brand-mark flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-semibold text-white shadow-sm">S</div>
            <div>
              <p className="eyebrow text-xs uppercase tracking-[0.2em]">Sober</p>
              <h1 className={cn('text-lg font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>A tu ritmo</h1>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => cn('app-nav-link flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition', isActive ? (darkMode ? 'bg-slate-200 text-slate-900' : 'bg-slate-900 text-white') : darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}>
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-note mt-8 rounded-3xl p-4">
            <Sparkles className="mb-3 h-5 w-5" />
            <p className="text-sm font-semibold">Ve paso a paso.</p>
            <p className="mt-1 text-xs leading-5 opacity-75">Un momento difícil no borra todo lo que has avanzado.</p>
          </div>
        </aside>

        <main className="app-main min-w-0 flex-1">
          <header className={cn('app-topbar mb-5 flex items-center justify-between rounded-[26px] border px-4 py-3 shadow-sm backdrop-blur-md sm:mb-7 sm:px-6', darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200/80 bg-white/85')}>
            <div>
              <p className="eyebrow text-[0.68rem] font-semibold uppercase tracking-[0.18em]">{format(new Date(), 'EEEE, d MMMM', { locale: es })}</p>
              <h2 className={cn('text-lg font-semibold sm:text-xl', darkMode ? 'text-white' : 'text-slate-900')}>Hola, {currentUser?.name?.split(' ')[0] ?? 'hola'}</h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="secondary" size="sm" icon={<MoonStar className="h-4 w-4" />} aria-label="Cambiar modo de color" className={darkMode ? 'border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700' : 'topbar-theme'} onClick={onToggleDark}><span className="hidden sm:inline">Apariencia</span></Button>
              <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={onOpenNewRecord}><span className="hidden sm:inline">Nuevo registro</span><span className="sm:hidden">Nuevo</span></Button>
              <Button variant="ghost" size="sm" onClick={onLogout} className="hidden sm:inline-flex">Salir</Button>
            </div>
          </header>
          <nav className="mobile-nav" aria-label="Navegación principal">
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} aria-label={label} className={({ isActive }) => cn('mobile-nav-link', isActive && 'active')}>
                <Icon className="h-[18px] w-[18px]" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          {children}
        </main>
      </div>
    </div>
  )
}

function DashboardPage({ habits, journalEntries, urgeLogs, darkMode, onOpenNewRecord }: { habits: Habit[]; journalEntries: JournalEntry[]; urgeLogs: UrgeLog[]; darkMode: boolean; onOpenNewRecord: () => void }) {
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * quotes.length))
  const longestStreakHabit = habits.reduce<Habit | undefined>(
    (longest, habit) => !longest || getStreakDays(habit.startDate) > getStreakDays(longest.startDate) ? habit : longest,
    undefined,
  )
  const currentStreak = longestStreakHabit ? getStreakDays(longestStreakHabit.startDate) : 0
  const allStreaks = habits.flatMap((habit) => {
    const currentStart = parseISO(habit.startDate)
    const current = {
      key: `${habit.id}-current`,
      habitName: habit.name,
      label: 'Racha actual',
      days: getStreakDays(habit.startDate),
      startDate: habit.startDate,
      endDate: undefined as string | undefined,
      isCurrent: true,
    }
    const previous = (habit.streakHistory ?? []).flatMap((period, index) => {
      const start = parseISO(period.startDate)
      const end = parseISO(period.endDate)
      if (!isValid(start) || !isValid(end) || end < start) return []
      return [{
        key: `${habit.id}-previous-${index}`,
        habitName: habit.name,
        label: `Racha anterior ${index + 1}`,
        days: differenceInCalendarDays(end, start) + 1,
        startDate: period.startDate,
        endDate: period.endDate,
        isCurrent: false,
      }]
    })
    return isValid(currentStart) ? [current, ...previous] : previous
  })
  const longestStreakDays = Math.max(0, ...allStreaks.map((streak) => streak.days))
  const nextQuote = () => setQuoteIndex((current) => {
    if (quotes.length < 2) return current
    const next = Math.floor(Math.random() * (quotes.length - 1))
    return next >= current ? next + 1 : next
  })
  const weekActivity = Array.from({ length: 7 }, (_, index) => {
    const date = subDays(startOfDay(new Date()), 6 - index)
    const dateKey = format(date, 'yyyy-MM-dd')
    return {
      date: format(date, 'EEE', { locale: es }),
      journal: journalEntries.filter((entry) => entry.date === dateKey).length,
      urges: urgeLogs.filter((entry) => {
        const urgeDate = parseISO(entry.time)
        return isValid(urgeDate) && format(urgeDate, 'yyyy-MM-dd') === dateKey
      }).length,
    }
  })
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const todayJournalCount = journalEntries.filter((entry) => entry.date === todayKey).length
  const lastWeekUrges = urgeLogs.filter((entry) => {
    const urgeDate = parseISO(entry.time)
    const age = isValid(urgeDate) ? differenceInCalendarDays(startOfDay(new Date()), startOfDay(urgeDate)) : 8
    return age >= 0 && age < 7
  }).length
  const hasWeeklyRecords = journalEntries.length > 0 || urgeLogs.length > 0

  return (
    <div className="dashboard-page space-y-6 sm:space-y-7">
      <section className="dashboard-intro flex flex-col gap-5 overflow-hidden rounded-[30px] p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-9">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d9bd8a]"><Sparkles className="h-4 w-4" /> Tu proceso, a tu ritmo</p>
          <h1 className="auth-display max-w-xl text-3xl font-medium leading-tight tracking-tight sm:text-[3.3rem]">Hoy también cuenta.</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#e8eee8]/75">No hace falta tener todo resuelto. Solo estar aquí, presente, ya es avanzar.</p>
        </div>
        <Button className="intro-button relative z-10 shrink-0" icon={<Plus className="h-4 w-4" />} onClick={onOpenNewRecord}>Registrar cómo voy</Button>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Racha más larga', value: `${longestStreakDays} días`, accent: 'emerald', icon: Flame },
          { label: 'Hábitos', value: `${habits.length}`, accent: 'amber', icon: Target },
          { label: 'Notas de hoy', value: `${todayJournalCount}`, accent: 'violet', icon: BookOpenText },
          { label: 'Impulsos · 7 días', value: `${lastWeekUrges}`, accent: 'sky', icon: Zap },
        ].map(({ label, value, accent, icon: Icon }) => (
          <Card key={label} className={cn('metric-card relative overflow-hidden', darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/85')}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className={cn('text-xs font-medium uppercase tracking-[0.1em]', darkMode ? 'text-slate-400' : 'text-slate-500')}>{label}</p>
                <p className={cn('mt-3 text-3xl font-semibold tracking-tight', darkMode ? 'text-white' : 'text-slate-900')}>{value}</p>
              </div>
              <div className={cn('metric-icon rounded-2xl p-3', `metric-${accent}`, darkMode ? 'text-slate-100' : '')}><Icon className="h-5 w-5" /></div>
            </div>
          </Card>
        ))}
      </section>

      <section className="w-full">
        <Card className={cn('overflow-hidden p-6', darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80')}>
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow text-xs font-semibold uppercase tracking-[0.14em]">Un vistazo a tu semana</p>
              <h3 className={cn('mt-1 text-xl font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>Tus registros recientes</h3>
            </div>
          </div>

          <div className="streak-card mb-5 flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-600"><Flame className="h-4 w-4 text-amber-500" /> <span>Racha actual</span></div>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">{currentStreak} <span className="text-lg font-medium text-slate-500">días</span></p>
              <p className="mt-1 text-sm text-slate-600">{longestStreakHabit ? longestStreakHabit.title : 'Crea un hábito para comenzar a registrar tu proceso.'}</p>
            </div>
            <div className="streak-orbit" aria-hidden="true"><Flame className="h-7 w-7" /><span>{currentStreak}</span></div>
          </div>

          <div className="mb-5">
            <div className="mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-500" />
              <h4 className={cn('text-sm font-semibold', darkMode ? 'text-white' : 'text-slate-800')}>Todas tus rachas</h4>
              <span className={cn('rounded-full px-2 py-0.5 text-xs', darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500')}>{allStreaks.length}</span>
            </div>
            {allStreaks.length ? (
              <div className="grid gap-3">
                {allStreaks.map((streak) => (
                  <div key={streak.key} className={cn('streak-entry-card flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-colors', darkMode ? 'hover:border-emerald-700' : 'hover:border-emerald-300')}>
                    <div className="min-w-0">
                      <p className={cn('truncate text-sm font-medium', darkMode ? 'text-white' : 'text-slate-800')}>{streak.habitName}</p>
                      <p className={cn('mt-0.5 text-xs', darkMode ? 'text-slate-400' : 'text-slate-500')}>
                        {streak.label} · {isValid(parseISO(streak.startDate)) ? format(parseISO(streak.startDate), 'd MMM yyyy', { locale: es }) : 'Sin fecha'}
                        {streak.endDate && isValid(parseISO(streak.endDate)) ? ` – ${format(parseISO(streak.endDate), 'd MMM yyyy', { locale: es })}` : ''}
                      </p>
                    </div>
                    <span className={cn('shrink-0 rounded-xl px-3 py-2 text-sm font-semibold', streak.isCurrent ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200' : 'bg-white/70 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100')}>
                      {streak.days} {streak.days === 1 ? 'día' : 'días'}
                    </span>
                  </div>
                ))}
              </div>
            ) : <div className="list-empty list-empty-compact"><Target className="h-5 w-5" /><p>Aún no tienes rachas. Agrega un hábito para empezar.</p></div>}
          </div>

          <div className={cn('w-full', hasWeeklyRecords ? 'h-56' : 'h-36')}>
            {hasWeeklyRecords ? (
              <Suspense fallback={<div className="chart-loading">Preparando tu semana…</div>}>
                <WeeklyActivityChart data={weekActivity} darkMode={darkMode} />
              </Suspense>
            ) : <div className="chart-empty h-full"><span className="chart-empty-mark"><TrendingUp className="h-5 w-5" /></span><p>Tu semana todavía está por escribirse.</p><button type="button" onClick={onOpenNewRecord}>Añade tu primer registro <span aria-hidden="true">→</span></button></div>}
          </div>
        </Card>

      </section>

      <section className="w-full">
        <Card className={cn('quote-card w-full overflow-hidden p-6', darkMode ? 'border-emerald-900/70 bg-slate-900/80' : 'border-emerald-100 bg-white/85')}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-xs font-semibold uppercase tracking-[0.14em]">Un momento para ti</p>
              <h3 className={cn('mt-1 text-xl font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>Frases</h3>
            </div>
            <span className="quote-mark" aria-hidden="true"><Quote className="h-5 w-5" /></span>
          </div>
          <blockquote key={quoteIndex} className={cn('quote-text', darkMode ? 'text-slate-100' : 'text-slate-800')}>
            “{quotes[quoteIndex][0]}”
          </blockquote>
          <p className={cn('mt-4 text-sm font-medium', darkMode ? 'text-emerald-200' : 'text-emerald-800')}>— {quotes[quoteIndex][1]}</p>
          <Button variant="secondary" size="sm" icon={<RefreshCw className="h-4 w-4" />} className={cn('mt-5', darkMode && 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700')} onClick={nextQuote}>
            Otra frase
          </Button>
        </Card>
      </section>

    </div>
  )
}

function HabitDetailPage({ habits, darkMode }: { habits: Habit[]; darkMode: boolean }) {
  const navigate = useNavigate()
  const { habitId } = useParams()
  const [chartRange, setChartRange] = useState<HabitChartRange>('week')
  const [today, setToday] = useState(() => startOfDay(new Date()))

  useEffect(() => {
    setToday(startOfDay(new Date()))
    setChartRange('week')
  }, [habitId])

  const habit = habits.find((entry) => entry.id === Number(habitId))

  if (!habit) {
    return <Card className={cn('p-10 text-center', darkMode ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900')}>No se encontró el hábito.</Card>
  }

  const habitStart = startOfDay(parseISO(habit.startDate))
  const streakPeriods = [
    ...(habit.streakHistory ?? []).map((period, index) => ({
      start: startOfDay(parseISO(period.startDate)),
      end: startOfDay(parseISO(period.endDate)),
      status: `Racha anterior ${index + 1}`,
    })),
    { start: habitStart, end: today, status: 'Racha actual' },
  ].filter((period) => isValid(period.start) && isValid(period.end) && period.start <= today && period.end >= period.start)
  const earliestStart = streakPeriods.reduce(
    (earliest, period) => period.start < earliest ? period.start : earliest,
    habitStart,
  )
  const rangeStart = chartRange === 'week'
    ? subDays(today, 6)
    : chartRange === 'month'
      ? subMonths(today, 1)
      : chartRange === 'year'
        ? subYears(today, 1)
        : earliestStart
  const chartStart = earliestStart > rangeStart ? earliestStart : rangeStart
  const chartDays = isValid(habitStart) ? differenceInCalendarDays(today, chartStart) + 1 : 0
  const chartStep = chartRange === 'year' || chartRange === 'all'
    ? Math.max(1, Math.ceil(chartDays / 180))
    : 1
  const sampledDays = new Set<number>()
  for (let dayIndex = 0; dayIndex < chartDays; dayIndex += chartStep) sampledDays.add(dayIndex)
  if (chartDays > 0) sampledDays.add(chartDays - 1)

  streakPeriods.forEach((period) => {
    const startIndex = differenceInCalendarDays(period.start, chartStart)
    const endIndex = differenceInCalendarDays(period.end, chartStart)
    if (startIndex >= 0 && startIndex < chartDays) sampledDays.add(startIndex)
    if (endIndex >= 0 && endIndex < chartDays) sampledDays.add(endIndex)
  })

  const chartData: { date: string; value: number; status: string }[] = chartDays > 0
    ? [...sampledDays].sort((left, right) => left - right).map((dayIndex) => {
      const date = addDays(chartStart, dayIndex)
      const period = streakPeriods.find(({ start, end }) => date >= start && date <= end)
      return {
        date: format(date, 'dd MMM yyyy'),
        value: period ? 100 : 0,
        status: period
          ? period.start.getTime() === date.getTime()
            ? `${period.status} · inicio`
            : period.status
          : 'Sin racha',
      }
    })
    : []
  const xAxisInterval = chartDays > 365 ? Math.max(0, Math.ceil(chartData.length / 8) - 1) : 'preserveStartEnd'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => navigate('/habits')}>Volver</Button>
      </div>

      <Card className={cn('p-6', darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80')}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br text-2xl font-semibold text-white', habit.color)}>{habit.name.slice(0, 1)}</div>
            <div>
              <p className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Hábito</p>
              <h3 className={cn('text-3xl font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>{habit.title}</h3>
            </div>
          </div>

          <div className={cn('rounded-2xl px-4 py-3 text-center', darkMode ? 'bg-slate-800 text-white' : 'bg-emerald-50 text-emerald-800')}>
            <p className="text-xs uppercase tracking-[0.2em]">Racha</p>
            <p className="text-3xl font-semibold">{getStreakDays(habit.startDate)}</p>
            <p className="text-xs">días</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className={cn('rounded-2xl p-4', darkMode ? 'bg-slate-800' : 'bg-slate-50')}>
          <p className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Fecha de inicio</p>
          <p className={cn('mt-2 text-2xl font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>{habit.startDate ? format(parseISO(habit.startDate), 'dd/MM/yyyy') : 'Sin fecha'}</p>
        </div>
        <div className={cn('rounded-2xl p-4', darkMode ? 'bg-slate-800' : 'bg-slate-50')}>
          <p className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Racha</p>
          <p className={cn('mt-2 text-2xl font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>{getStreakDays(habit.startDate)} días</p>
        </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className={cn('rounded-2xl p-4', darkMode ? 'bg-slate-800' : 'bg-slate-50')}>
          <p className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Descripción</p>
          <p className={cn('mt-2 text-base leading-7', darkMode ? 'text-slate-200' : 'text-slate-700')}>{habit.description}</p>
        </div>
        <div className={cn('rounded-2xl p-4', darkMode ? 'bg-slate-800' : 'bg-slate-50')}>
          <p className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Por qué lo llevo</p>
          <p className={cn('mt-2 text-base leading-7', darkMode ? 'text-slate-200' : 'text-slate-700')}>{habit.reason}</p>
        </div>
        </div>
      </Card>

      <Card className={cn('p-6', darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80')}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Progreso de racha</p>
            <h3 className={cn('text-xl font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>
              {chartRange === 'all' ? 'Desde el inicio' : chartRange === 'week' ? 'Últimos 7 días' : chartRange === 'month' ? 'Último mes' : 'Último año'}
            </h3>
            <p className={cn('mt-1 text-xs', darkMode ? 'text-slate-400' : 'text-slate-500')}>
              {habit.streakHistory?.length ?? 0} rachas anteriores guardadas
            </p>
          </div>
          <div className={cn('flex flex-wrap gap-2 rounded-2xl p-1', darkMode ? 'bg-slate-800' : 'bg-slate-100')}>
            {([
              ['week', '7 días'],
              ['month', '1 mes'],
              ['year', '1 año'],
              ['all', 'Desde inicio'],
            ] as const).map(([range, label]) => (
              <button
                key={range}
                type="button"
                onClick={() => setChartRange(range)}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm font-medium transition',
                  chartRange === range
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : darkMode
                      ? 'text-slate-300 hover:bg-slate-700'
                      : 'text-slate-600 hover:bg-white',
                )}
                aria-pressed={chartRange === range}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64 w-full">
          {chartData.length ? (
            <Suspense fallback={<div className="chart-loading">Preparando tu progreso…</div>}>
              <HabitProgressChart data={chartData} darkMode={darkMode} interval={xAxisInterval} />
            </Suspense>
          ) : (
            <div className={cn('flex h-full items-center justify-center text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>
              Aún no hay días de racha en este periodo.
            </div>
          )}
        </div>
      </Card>

    </div>
  )
}

function HabitsPage({ habits, setHabits, darkMode }: { habits: Habit[]; setHabits: React.Dispatch<React.SetStateAction<Habit[]>>; darkMode: boolean }) {
  const [form, setForm] = useState<HabitForm>({ title: '', description: '', reason: '', startDate: format(new Date(), 'yyyy-MM-dd') })
  const [editingId, setEditingId] = useState<number | null>(null)

  const saveHabit = async () => {
    const name = form.title.trim() || 'Nuevo hábito'
    const payload: Habit = {
      id: editingId ?? Date.now(),
      name,
      title: name,
      description: form.description.trim() || 'Sin descripción',
      reason: form.reason.trim() || 'Porque me ayuda a cuidar de mí.',
      streak: getStreakDays(form.startDate),
      completed: editingId ? habits.find((habit) => habit.id === editingId)?.completed ?? 0 : 0,
      startDate: form.startDate || format(new Date(), 'yyyy-MM-dd'),
      streakHistory: editingId ? habits.find((habit) => habit.id === editingId)?.streakHistory ?? [] : [],
      color: editingId ? habits.find((habit) => habit.id === editingId)?.color ?? 'from-emerald-500 to-teal-500' : 'from-emerald-500 to-teal-500',
    }

    try {
      await apiFetch('/api/v1/habits', { method: 'PUT', body: JSON.stringify(payload) })
      setHabits((current) => editingId !== null ? current.map((habit) => (habit.id === editingId ? payload : habit)) : [payload, ...current])
    } catch (error) {
      window.alert(error instanceof Error ? `No se pudo guardar el hábito: ${error.message}` : 'No se pudo guardar el hábito')
      return
    }

    setForm({ title: '', description: '', reason: '', startDate: format(new Date(), 'yyyy-MM-dd') })
    setEditingId(null)
  }

  const resetHabit = async (id: number) => {
    const updated = habits.find((habit) => habit.id === id)
    if (!updated) return
    const payload = {
      ...updated,
      streak: 1,
      completed: 0,
      streakHistory: getArchivedStreaks(updated),
      startDate: format(new Date(), 'yyyy-MM-dd'),
    }
    try {
      await apiFetch('/api/v1/habits', { method: 'PUT', body: JSON.stringify(payload) })
      setHabits((current) => current.map((habit) => habit.id === id ? payload : habit))
    } catch (error) {
      window.alert(error instanceof Error ? `No se pudo reiniciar la racha: ${error.message}` : 'No se pudo reiniciar la racha')
    }
  }

  const deleteHabit = async (id: number) => {
    try {
      await apiFetch(`/api/v1/habits/${id}`, { method: 'DELETE' })
      setHabits((current) => current.filter((habit) => habit.id !== id))
    } catch (error) {
      window.alert(error instanceof Error ? `No se pudo eliminar el hábito: ${error.message}` : 'No se pudo eliminar el hábito')
    }
  }

  const startEdit = (habit: Habit) => {
    setEditingId(habit.id)
    setForm({
      title: habit.title,
      description: habit.description,
      reason: habit.reason,
      startDate: habit.startDate || format(new Date(), 'yyyy-MM-dd'),
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <Card className={cn('p-6', darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80')}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Hábitos</p>
            <h3 className={cn('text-xl font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>Rutina de apoyo</h3>
          </div>
        </div>
        <div className="space-y-4">
          {habits.map((habit) => (
            <div key={habit.id} className={cn('rounded-2xl border p-4', darkMode ? 'border-slate-700 bg-slate-800/80' : 'border-slate-200 bg-slate-50')}>
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => window.location.assign(`/habits/${habit.id}`)} className="flex flex-1 items-center gap-3 text-left">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-semibold text-white', habit.color)}>{habit.name.slice(0, 1)}</div>
                  <div>
                    <p className={cn('font-medium', darkMode ? 'text-white' : 'text-slate-900')}>{habit.title}</p>
                    <p className={cn('text-sm', darkMode ? 'text-slate-300' : 'text-slate-500')}>Inicio: {habit.startDate ? format(parseISO(habit.startDate), 'dd/MM/yyyy') : 'Sin fecha'}</p>
                  </div>
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => startEdit(habit)} className={cn('rounded-full px-2.5 py-1 text-xs font-medium', darkMode ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-700 ring-1 ring-slate-200')}>Editar</button>
                  <button type="button" onClick={() => resetHabit(habit.id)} className={cn('rounded-full px-2.5 py-1 text-xs font-medium', darkMode ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700')}>Reiniciar</button>
                  <button type="button" onClick={() => deleteHabit(habit.id)} className={cn('rounded-full px-2.5 py-1 text-xs font-medium', darkMode ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700')}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className={cn('p-6', darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80')}>
        <h3 className={cn('text-xl font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>{editingId ? 'Editar hábito' : 'Añadir hábito'}</h3>
        <div className="mt-5 space-y-4">
          <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className={cn('w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} placeholder="Título del hábito" />
          <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className={cn('min-h-24 w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} placeholder="Descripción del hábito" />
          <textarea value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} className={cn('min-h-20 w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} placeholder="¿Por qué te lo llevas?" />
          <label className={cn('block text-sm', darkMode ? 'text-slate-300' : 'text-slate-600')}>
            Fecha de inicio
            <input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className={cn('mt-1 w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} />
          </label>
          <Button className="w-full" onClick={saveHabit}>{editingId ? 'Guardar cambios' : 'Guardar hábito'}</Button>
        </div>
      </Card>
    </div>
  )
}

function JournalPage({ habits, journalEntries, setJournalEntries, darkMode }: { habits: Habit[]; journalEntries: JournalEntry[]; setJournalEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>; darkMode: boolean }) {
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), mood: 'calma', note: '', triggers: 'estrés, cansancio', habitId: habits[0]?.id ?? 1 })

  const addEntry = async () => {
    if (!form.note.trim()) return
    const selectedHabit = habits.find((habit) => habit.id === Number(form.habitId))
    const newEntry: JournalEntry = {
      id: Date.now(),
      date: form.date,
      mood: form.mood,
      note: form.note.trim(),
      triggers: form.triggers.split(',').map((item) => item.trim()).filter(Boolean),
      habitId: selectedHabit?.id,
      habitName: selectedHabit?.name,
    }
    try {
      await apiFetch('/api/v1/journal', { method: 'PUT', body: JSON.stringify(newEntry) })
      setJournalEntries((current) => [newEntry, ...current])
    } catch (error) {
      window.alert(error instanceof Error ? `No se pudo guardar la entrada: ${error.message}` : 'No se pudo guardar la entrada')
      return
    }
    setForm({ date: format(new Date(), 'yyyy-MM-dd'), mood: 'calma', note: '', triggers: 'estrés, cansancio', habitId: habits[0]?.id ?? 1 })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <Card className={cn('p-6', darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80')}>
        <div className="mb-5">
          <p className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Diario</p>
          <h3 className={cn('text-xl font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>Reflexiones</h3>
        </div>
        <div className="space-y-4">
          {journalEntries.map((entry) => (
            <div key={entry.id} className={cn('rounded-2xl border p-4', darkMode ? 'border-slate-700 bg-slate-800/80' : 'border-slate-200 bg-slate-50')}>
              <div className="mb-2 flex items-center justify-between">
                <span className={cn('font-medium', darkMode ? 'text-white' : 'text-slate-900')}>{entry.date}</span>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">{entry.mood}</span>
              </div>
              {entry.habitName && <p className={cn('mb-2 text-xs uppercase tracking-[0.16em]', darkMode ? 'text-slate-400' : 'text-slate-500')}>{entry.habitName}</p>}
              <p className={cn('text-sm leading-6', darkMode ? 'text-slate-300' : 'text-slate-600')}>{entry.note}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.triggers.map((trigger) => <span key={`${entry.id}-${trigger}`} className={cn('rounded-full px-2 py-1 text-xs', darkMode ? 'bg-slate-700 text-slate-200' : 'bg-white text-slate-600 ring-1 ring-slate-200')}>{trigger}</span>)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className={cn('p-6', darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80')}>
        <h3 className={cn('text-xl font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>Nueva entrada</h3>
        <div className="mt-5 space-y-4">
          <select value={form.habitId} onChange={(event) => setForm((current) => ({ ...current, habitId: Number(event.target.value) }))} className={cn('w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')}>
            {habits.map((habit) => <option key={habit.id} value={habit.id}>{habit.name}</option>)}
          </select>
          <input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className={cn('w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} />
          <select value={form.mood} onChange={(event) => setForm((current) => ({ ...current, mood: event.target.value }))} className={cn('w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')}>
            <option value="calma">Calma</option>
            <option value="ansiedad">Ansiedad</option>
            <option value="reflexivo">Reflexivo</option>
            <option value="alegría">Alegría</option>
          </select>
          <textarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className={cn('min-h-32 w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} placeholder="Describe lo que sentiste hoy..." />
          <input value={form.triggers} onChange={(event) => setForm((current) => ({ ...current, triggers: event.target.value }))} className={cn('w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} placeholder="Gatillos separados por coma" />
          <Button className="w-full" onClick={addEntry}>Guardar entrada</Button>
        </div>
      </Card>
    </div>
  )
}

function UrgesPage({ habits, urgeLogs, setUrgeLogs, darkMode }: { habits: Habit[]; urgeLogs: UrgeLog[]; setUrgeLogs: React.Dispatch<React.SetStateAction<UrgeLog[]>>; darkMode: boolean }) {
  const [form, setForm] = useState({ habitId: habits[0]?.id ?? 1, trigger: '', intensity: '6', coping: 'Respiración 4-6' })

  const addUrge = async () => {
    if (!form.trigger.trim()) return
    const selectedHabit = habits.find((habit) => habit.id === Number(form.habitId))
    const newEntry: UrgeLog = {
      id: Date.now(),
      time: new Date().toISOString(),
      trigger: form.trigger.trim(),
      intensity: Number(form.intensity),
      coping: form.coping.trim(),
      habitId: selectedHabit?.id,
      habitName: selectedHabit?.name,
    }
    try {
      await apiFetch('/api/v1/urges', { method: 'PUT', body: JSON.stringify(newEntry) })
      setUrgeLogs((current) => [newEntry, ...current])
    } catch (error) {
      window.alert(error instanceof Error ? `No se pudo guardar el impulso: ${error.message}` : 'No se pudo guardar el impulso')
      return
    }
    setForm({ habitId: habits[0]?.id ?? 1, trigger: '', intensity: '6', coping: 'Respiración 4-6' })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <Card className={cn('p-6', darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80')}>
        <div className="mb-5">
          <p className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Impulsos</p>
          <h3 className={cn('text-xl font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>Momentos que atravesaste</h3>
        </div>
        <div className="space-y-4">
          {urgeLogs.map((urge) => (
            <div key={urge.id} className={cn('rounded-2xl border p-4', darkMode ? 'border-slate-700 bg-slate-800/80' : 'border-slate-200 bg-slate-50')}>
              <div className="flex items-center justify-between">
                <span className={cn('font-medium', darkMode ? 'text-white' : 'text-slate-900')}>{urge.trigger}</span>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">Intensidad {urge.intensity}/10</span>
              </div>
              {urge.habitName && <p className={cn('mt-1 text-xs uppercase tracking-[0.16em]', darkMode ? 'text-slate-400' : 'text-slate-500')}>{urge.habitName}</p>}
              <p className={cn('mt-2 text-sm', darkMode ? 'text-slate-300' : 'text-slate-500')}>Estrategia: {urge.coping}</p>
              <p className={cn('mt-1 text-xs', darkMode ? 'text-slate-400' : 'text-slate-400')}>{new Date(urge.time).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className={cn('p-6', darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80')}>
        <h3 className={cn('text-xl font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>Registrar impulso</h3>
        <div className="mt-5 space-y-4">
          <select value={form.habitId} onChange={(event) => setForm((current) => ({ ...current, habitId: Number(event.target.value) }))} className={cn('w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')}>
            {habits.map((habit) => <option key={habit.id} value={habit.id}>{habit.name}</option>)}
          </select>
          <input value={form.trigger} onChange={(event) => setForm((current) => ({ ...current, trigger: event.target.value }))} className={cn('w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} placeholder="Descripción del momento" />
          <input type="range" min="1" max="10" value={form.intensity} onChange={(event) => setForm((current) => ({ ...current, intensity: event.target.value }))} className="w-full accent-amber-500" />
          <div className={cn('text-sm', darkMode ? 'text-slate-300' : 'text-slate-600')}>Intensidad actual: {form.intensity}/10</div>
          <input value={form.coping} onChange={(event) => setForm((current) => ({ ...current, coping: event.target.value }))} className={cn('w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} placeholder="Qué acción te ayudó" />
          <Button className="w-full" onClick={addUrge}>Guardar impulso</Button>
        </div>
      </Card>
    </div>
  )
}

function StatisticsPage({ darkMode, habits, journalEntries, urgeLogs }: { darkMode: boolean; habits: Habit[]; journalEntries: JournalEntry[]; urgeLogs: UrgeLog[] }) {
  const weekly = Array.from({ length: 7 }, (_, index) => {
    const date = subDays(startOfDay(new Date()), 6 - index)
    const dateKey = format(date, 'yyyy-MM-dd')
    const journalCount = journalEntries.filter((entry) => entry.date === dateKey).length
    const urgeCount = urgeLogs.filter((urge) => {
      const urgeDate = parseISO(urge.time)
      return isValid(urgeDate) && format(urgeDate, 'yyyy-MM-dd') === dateKey
    }).length

    return { day: format(date, 'dd MMM'), journalCount, urgeCount }
  })

  const habitStreaks = habits.map((habit) => ({
    name: habit.title,
    days: getStreakDays(habit.startDate),
  }))
  const hasWeeklyActivity = weekly.some((day) => day.journalCount > 0 || day.urgeCount > 0)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className={cn('p-6', darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80')}>
        <p className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Actividad</p>
        <h3 className={cn('text-xl font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>Diario e impulsos · últimos 7 días</h3>
        <div className="mt-5 h-64 w-full">
          {hasWeeklyActivity ? (
            <Suspense fallback={<div className="chart-loading">Preparando tu actividad…</div>}>
              <WeeklyJournalChart data={weekly} darkMode={darkMode} />
            </Suspense>
          ) : (
            <div className={cn('flex h-full items-center justify-center text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>
              No hay registros de diario ni impulsos en los últimos 7 días.
            </div>
          )}
        </div>
      </Card>

      <Card className={cn('p-6', darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80')}>
        <p className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Hábitos</p>
        <h3 className={cn('text-xl font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>Días de racha por hábito</h3>
        <div className="mt-5 h-64 w-full">
          {habitStreaks.length ? (
            <Suspense fallback={<div className="chart-loading">Preparando tus rachas…</div>}>
              <HabitStreakChart data={habitStreaks} darkMode={darkMode} />
            </Suspense>
          ) : (
            <div className={cn('flex h-full items-center justify-center text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>
              Crea un hábito para ver aquí su racha.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function SettingsPage({ user, onLogout, darkMode }: { user?: SessionData['user']; onLogout: () => void; darkMode: boolean }) {
  return (
    <Card className={cn('p-6', darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80')}>
      <div className="mb-5">
        <p className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Ajustes</p>
        <h3 className={cn('text-xl font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>Cuenta y preferencias</h3>
      </div>

      <div className={cn('space-y-4 rounded-3xl p-5', darkMode ? 'bg-slate-800' : 'bg-slate-50')}>
        <div>
          <p className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Nombre</p>
          <p className={cn('text-lg font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>{user?.name ?? '—'}</p>
        </div>
        <div>
          <p className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Usuario</p>
          <p className={cn('text-lg font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>{user?.username ?? '—'}</p>
        </div>
        <div>
          <p className={cn('text-sm', darkMode ? 'text-slate-400' : 'text-slate-500')}>Email</p>
          <p className={cn('text-lg font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>{user?.email ?? '—'}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="secondary">Sincronizar</Button>
        <Button variant="ghost" onClick={onLogout}>Cerrar sesión</Button>
      </div>
    </Card>
  )
}

function NewRecordModal({ habits, onClose, onCreateHabit, onCreateJournal, onCreateUrge, darkMode }: { habits: Habit[]; onClose: () => void; onCreateHabit: (form: HabitForm) => Promise<void>; onCreateJournal: (payload: { date: string; mood: string; note: string; triggers: string; habitId: number }) => Promise<void>; onCreateUrge: (payload: { habitId: number; trigger: string; intensity: string; coping: string }) => Promise<void>; darkMode: boolean }) {
  const [tab, setTab] = useState<NewRecordMode>('habit')
  const [habitForm, setHabitForm] = useState<HabitForm>({ title: '', description: '', reason: '', startDate: format(new Date(), 'yyyy-MM-dd') })
  const [journalForm, setJournalForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), mood: 'calma', note: '', triggers: 'estrés, cansancio', habitId: habits[0]?.id ?? 1 })
  const [urgeForm, setUrgeForm] = useState({ habitId: habits[0]?.id ?? 1, trigger: '', intensity: '6', coping: 'Respiración 4-6' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className={cn('w-full max-w-2xl rounded-[28px] border p-5 shadow-2xl', darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className={cn('text-2xl font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>Nuevo registro</h3>
          <button type="button" onClick={onClose} className={cn('rounded-full px-2 py-1 text-sm', darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700')}>Cerrar</button>
        </div>

        <div className="mb-5 flex rounded-full bg-slate-100 p-1">
          {(['habit', 'journal', 'urge'] as NewRecordMode[]).map((option) => (
            <button key={option} type="button" onClick={() => setTab(option)} className={cn('flex-1 rounded-full px-3 py-2 text-sm font-medium', tab === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>
              {option === 'habit' ? 'Hábito' : option === 'journal' ? 'Diario' : 'Impulso'}
            </button>
          ))}
        </div>

        {tab === 'habit' && (
          <div className="space-y-4">
            <input value={habitForm.title} onChange={(event) => setHabitForm((current) => ({ ...current, title: event.target.value }))} className={cn('w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} placeholder="Título del hábito" />
            <textarea value={habitForm.description} onChange={(event) => setHabitForm((current) => ({ ...current, description: event.target.value }))} className={cn('min-h-24 w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} placeholder="Descripción" />
            <textarea value={habitForm.reason} onChange={(event) => setHabitForm((current) => ({ ...current, reason: event.target.value }))} className={cn('min-h-20 w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} placeholder="¿Por qué te lo llevas?" />
            <label className={cn('block text-sm', darkMode ? 'text-slate-300' : 'text-slate-600')}>
              Fecha de inicio
              <input type="date" value={habitForm.startDate} onChange={(event) => setHabitForm((current) => ({ ...current, startDate: event.target.value }))} className={cn('mt-1 w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} />
            </label>
            <Button className="w-full" onClick={async () => { try { await onCreateHabit(habitForm); onClose() } catch (error) { window.alert(error instanceof Error ? `No se pudo guardar el hábito: ${error.message}` : 'No se pudo guardar el hábito') } }}>Guardar hábito</Button>
          </div>
        )}

        {tab === 'journal' && (
          <div className="space-y-4">
            <select value={journalForm.habitId} onChange={(event) => setJournalForm((current) => ({ ...current, habitId: Number(event.target.value) }))} className={cn('w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')}>
              {habits.map((habit) => <option key={habit.id} value={habit.id}>{habit.name}</option>)}
            </select>
            <input type="date" value={journalForm.date} onChange={(event) => setJournalForm((current) => ({ ...current, date: event.target.value }))} className={cn('w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} />
            <select value={journalForm.mood} onChange={(event) => setJournalForm((current) => ({ ...current, mood: event.target.value }))} className={cn('w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')}>
              <option value="calma">Calma</option>
              <option value="ansiedad">Ansiedad</option>
              <option value="reflexivo">Reflexivo</option>
              <option value="alegría">Alegría</option>
            </select>
            <textarea value={journalForm.note} onChange={(event) => setJournalForm((current) => ({ ...current, note: event.target.value }))} className={cn('min-h-28 w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} placeholder="Qué sentiste hoy" />
            <input value={journalForm.triggers} onChange={(event) => setJournalForm((current) => ({ ...current, triggers: event.target.value }))} className={cn('w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} placeholder="Gatillos" />
            <Button className="w-full" onClick={async () => { try { await onCreateJournal(journalForm); onClose() } catch (error) { window.alert(error instanceof Error ? `No se pudo guardar la entrada: ${error.message}` : 'No se pudo guardar la entrada') } }}>Guardar entrada</Button>
          </div>
        )}

        {tab === 'urge' && (
          <div className="space-y-4">
            <select value={urgeForm.habitId} onChange={(event) => setUrgeForm((current) => ({ ...current, habitId: Number(event.target.value) }))} className={cn('w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')}>
              {habits.map((habit) => <option key={habit.id} value={habit.id}>{habit.name}</option>)}
            </select>
            <input value={urgeForm.trigger} onChange={(event) => setUrgeForm((current) => ({ ...current, trigger: event.target.value }))} className={cn('w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} placeholder="Qué ocurrió" />
            <input type="range" min="1" max="10" value={urgeForm.intensity} onChange={(event) => setUrgeForm((current) => ({ ...current, intensity: event.target.value }))} className="w-full accent-amber-500" />
            <div className={cn('text-sm', darkMode ? 'text-slate-300' : 'text-slate-600')}>Intensidad: {urgeForm.intensity}/10</div>
            <input value={urgeForm.coping} onChange={(event) => setUrgeForm((current) => ({ ...current, coping: event.target.value }))} className={cn('w-full rounded-2xl border px-3 py-2.5 outline-none focus:border-emerald-400', darkMode ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900')} placeholder="Qué te ayudó" />
            <Button className="w-full" onClick={async () => { try { await onCreateUrge(urgeForm); onClose() } catch (error) { window.alert(error instanceof Error ? `No se pudo guardar el impulso: ${error.message}` : 'No se pudo guardar el impulso') } }}>Guardar impulso</Button>
          </div>
        )}
      </div>
    </div>
  )
}

function App() {
  const [session, setSession] = useState<SessionData | null>(() => getStoredSession())
  const [darkMode, setDarkMode] = useState(false)
  const [showNewRecord, setShowNewRecord] = useState(false)
  const [habits, setHabits] = useState<Habit[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [urgeLogs, setUrgeLogs] = useState<UrgeLog[]>([])
  const location = useLocation()

  useEffect(() => {
    async function loadUserData() {
      if (!session?.user.id) {
        setHabits([])
        setJournalEntries([])
        setUrgeLogs([])
        return
      }

      try {
        const [localHabits, localJournalEntries, localUrgeLogs] = await Promise.all([
          db.habits.where('userId').equals(session.user.id).toArray(),
          db.journalEntries.where('userId').equals(session.user.id).toArray(),
          db.urgeLogs.where('userId').equals(session.user.id).toArray(),
        ])
        if (localHabits.length || localJournalEntries.length || localUrgeLogs.length) {
          await apiFetch('/api/v1/migration/local', {
            method: 'POST',
            body: JSON.stringify({
              habits: localHabits.filter((item) => item.id !== undefined),
              journalEntries: localJournalEntries.filter((item) => item.id !== undefined),
              urgeLogs: localUrgeLogs.filter((item) => item.id !== undefined),
            }),
          })
          await Promise.all([
            db.habits.bulkDelete(localHabits.flatMap((item) => item.id === undefined ? [] : [item.id])),
            db.journalEntries.bulkDelete(localJournalEntries.flatMap((item) => item.id === undefined ? [] : [item.id])),
            db.urgeLogs.bulkDelete(localUrgeLogs.flatMap((item) => item.id === undefined ? [] : [item.id])),
          ])
        }
        const [remoteHabits, remoteJournalEntries, remoteUrgeLogs] = await Promise.all([
          apiFetch<Habit[]>('/api/v1/habits'),
          apiFetch<JournalEntry[]>('/api/v1/journal'),
          apiFetch<UrgeLog[]>('/api/v1/urges'),
        ])
        setHabits(remoteHabits.map((habit) => ({
          ...habit,
          streak: getStreakDays(habit.startDate),
          streakHistory: habit.streakHistory ?? [],
        })))
        setJournalEntries(remoteJournalEntries.map((entry) => ({ ...entry, triggers: entry.triggers ?? [] })))
        setUrgeLogs(remoteUrgeLogs)
      } catch (error) {
        window.alert(error instanceof Error ? `No se pudieron cargar tus datos: ${error.message}` : 'No se pudieron cargar tus datos')
      }
    }

    void loadUserData()
  }, [session?.user.id])

  const onLogout = () => {
    clearSession()
    setSession(null)
  }

  const handleCreateHabit = async (form: HabitForm) => {
    const title = form.title.trim() || 'Nuevo hábito'
    const newHabit: Habit = {
      id: Date.now(),
      name: title,
      title,
      description: form.description.trim() || 'Sin descripción',
      reason: form.reason.trim() || 'Porque me ayuda a cuidarme.',
      streak: getStreakDays(form.startDate),
      completed: 0,
      startDate: form.startDate || format(new Date(), 'yyyy-MM-dd'),
      streakHistory: [],
      color: 'from-emerald-500 to-teal-500',
    }

    await apiFetch('/api/v1/habits', { method: 'PUT', body: JSON.stringify(newHabit) })
    setHabits((current) => [newHabit, ...current])
  }

  const handleCreateJournal = async ({ date, mood, note, triggers, habitId }: { date: string; mood: string; note: string; triggers: string; habitId: number }) => {
    const selectedHabit = habits.find((habit) => habit.id === Number(habitId))
    const newEntry: JournalEntry = {
      id: Date.now(),
      date,
      mood,
      note: note.trim() || 'Nueva reflexión',
      triggers: triggers.split(',').map((item) => item.trim()).filter(Boolean),
      habitId: selectedHabit?.id,
      habitName: selectedHabit?.name,
    }
    await apiFetch('/api/v1/journal', { method: 'PUT', body: JSON.stringify(newEntry) })
    setJournalEntries((current) => [newEntry, ...current])
  }

  const handleCreateUrge = async ({ habitId, trigger, intensity, coping }: { habitId: number; trigger: string; intensity: string; coping: string }) => {
    const selectedHabit = habits.find((habit) => habit.id === Number(habitId))
    const newUrge: UrgeLog = {
      id: Date.now(),
      time: new Date().toISOString(),
      trigger: trigger.trim() || 'Impulso sin detalle',
      intensity: Number(intensity) || 5,
      coping: coping.trim() || 'Respiración 4-6',
      habitId: selectedHabit?.id,
      habitName: selectedHabit?.name,
    }
    await apiFetch('/api/v1/urges', { method: 'PUT', body: JSON.stringify(newUrge) })
    setUrgeLogs((current) => [newUrge, ...current])
  }

  const renderPage = () => {
    if (location.pathname.startsWith('/habits/')) {
      return <HabitDetailPage habits={habits} darkMode={darkMode} />
    }

    switch (location.pathname) {
      case '/onboarding':
        return <div className={cn('rounded-[30px] border p-8 shadow-sm', darkMode ? 'border-slate-800 bg-slate-900 text-white' : 'border-slate-200 bg-white/80')}>Onboarding con estructura preparada.</div>
      case '/habits':
        return <HabitsPage habits={habits} setHabits={setHabits} darkMode={darkMode} />
      case '/journal':
        return <JournalPage habits={habits} journalEntries={journalEntries} setJournalEntries={setJournalEntries} darkMode={darkMode} />
      case '/urges':
        return <UrgesPage habits={habits} urgeLogs={urgeLogs} setUrgeLogs={setUrgeLogs} darkMode={darkMode} />
      case '/statistics':
        return <StatisticsPage darkMode={darkMode} habits={habits} journalEntries={journalEntries} urgeLogs={urgeLogs} />
      case '/settings':
        return <SettingsPage user={session?.user} onLogout={onLogout} darkMode={darkMode} />
      case '/dashboard':
      case '/':
      default:
        return <DashboardPage habits={habits} journalEntries={journalEntries} urgeLogs={urgeLogs} darkMode={darkMode} onOpenNewRecord={() => setShowNewRecord(true)} />
    }
  }

  if (!session) {
    return <AuthScreen onAuth={setSession} />
  }

  return (
    <>
      <Layout currentUser={session.user} onLogout={onLogout} darkMode={darkMode} onToggleDark={() => setDarkMode((current) => !current)} onOpenNewRecord={() => setShowNewRecord(true)}>
        {renderPage()}
      </Layout>
      {showNewRecord && <NewRecordModal habits={habits} onClose={() => setShowNewRecord(false)} onCreateHabit={handleCreateHabit} onCreateJournal={handleCreateJournal} onCreateUrge={handleCreateUrge} darkMode={darkMode} />}
    </>
  )
}

export default App
