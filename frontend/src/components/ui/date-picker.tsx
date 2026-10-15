import { useEffect, useRef, useState } from 'react'
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import { cn } from '../../lib/utils'

type DatePickerProps = {
  value: string
  onChange: (value: string) => void
  darkMode?: boolean
  label?: string
}

export function DatePicker({ value, onChange, darkMode = false, label = 'Seleccionar fecha' }: DatePickerProps) {
  const selectedDate = value ? parseISO(`${value}T00:00:00`) : new Date()
  const [open, setOpen] = useState(false)
  const [openAbove, setOpenAbove] = useState(false)
  const [month, setMonth] = useState(startOfMonth(selectedDate))
  const rootRef = useRef<HTMLDivElement>(null)
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  })

  useEffect(() => {
    if (!open) return
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const changeDate = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'))
    setOpen(false)
  }

  const toggleCalendar = () => {
    if (!open && rootRef.current) {
      const bounds = rootRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - bounds.bottom
      setOpenAbove(spaceBelow < 300 && bounds.top > spaceBelow)
    }
    setMonth(startOfMonth(selectedDate))
    setOpen((current) => !current)
  }

  return (
    <div ref={rootRef} className="relative mt-1">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={toggleCalendar}
        className={cn(
          'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left shadow-sm transition focus:outline-none focus:ring-4 focus:ring-emerald-500/10',
          darkMode ? 'border-slate-700 bg-slate-800 text-white hover:border-slate-600' : 'border-slate-200 bg-white text-slate-900 hover:border-emerald-300',
        )}
      >
        <span>
          <span className={cn('block text-[11px] font-semibold uppercase tracking-[0.16em]', darkMode ? 'text-slate-400' : 'text-slate-500')}>Fecha</span>
          <span className="mt-0.5 block font-medium">{value ? format(selectedDate, 'd MMMM yyyy', { locale: es }) : 'Elige una fecha'}</span>
        </span>
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', darkMode ? 'bg-slate-700 text-emerald-300' : 'bg-emerald-50 text-emerald-700')}><CalendarDays className="h-5 w-5" /></span>
      </button>

      {open && (
        <div className={cn('absolute left-0 z-50 w-[min(18rem,calc(100vw-2rem))] rounded-3xl border p-3 shadow-2xl', openAbove ? 'bottom-full mb-2' : 'top-full mt-2', darkMode ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900')}>
          <div className="mb-2 flex items-center justify-between">
            <button type="button" aria-label="Mes anterior" onClick={() => setMonth((current) => addMonths(current, -1))} className={cn('flex h-9 w-9 items-center justify-center rounded-xl transition', darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}><ChevronLeft className="h-4 w-4" /></button>
            <p className="font-semibold capitalize">{format(month, 'MMMM yyyy', { locale: es })}</p>
            <button type="button" aria-label="Mes siguiente" onClick={() => setMonth((current) => addMonths(current, 1))} className={cn('flex h-9 w-9 items-center justify-center rounded-xl transition', darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100')}><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => <span key={`${day}-${index}`} className={cn('pb-1 text-[10px] font-semibold uppercase', darkMode ? 'text-slate-500' : 'text-slate-400')}>{day}</span>)}
            {days.map((day) => {
              const selected = value && isSameDay(day, selectedDate)
              return <button key={day.toISOString()} type="button" onClick={() => changeDate(day)} className={cn('h-8 rounded-xl text-sm transition', !isSameMonth(day, month) && (darkMode ? 'text-slate-600' : 'text-slate-300'), selected ? 'bg-emerald-600 font-semibold text-white shadow-sm' : darkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800', isToday(day) && !selected && 'ring-1 ring-emerald-500')}>{format(day, 'd')}</button>
            })}
          </div>
          <button type="button" onClick={() => changeDate(new Date())} className={cn('mt-2 w-full rounded-xl py-1.5 text-sm font-medium transition', darkMode ? 'bg-slate-800 text-emerald-300 hover:bg-slate-700' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100')}>Hoy</button>
        </div>
      )}
    </div>
  )
}

type TimePickerProps = {
  value: string
  onChange: (value: string) => void
  darkMode?: boolean
  label?: string
}

export function TimePicker({ value, onChange, darkMode = false, label = 'Hora de inicio' }: TimePickerProps) {
  const [openPart, setOpenPart] = useState<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)
  const selectedOptionRef = useRef<HTMLButtonElement>(null)
  const [hour = '00', minute = '00', second = '00'] = value.split(':')
  const parts = [
    { value: hour, label: 'Hora', options: 24 },
    { value: minute, label: 'Minutos', options: 60 },
    { value: second, label: 'Segundos', options: 60 },
  ]
  const changePart = (index: number, nextValue: string) => {
    const next = [hour, minute, second]
    next[index] = nextValue
    onChange(next.join(':'))
    setOpenPart(null)
  }

  useEffect(() => {
    if (openPart === null) return
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenPart(null)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenPart(null)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    if (optionsRef.current && selectedOptionRef.current) {
      optionsRef.current.scrollTop = Math.max(0, selectedOptionRef.current.offsetTop - optionsRef.current.offsetTop - optionsRef.current.clientHeight / 2)
    }
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [openPart])

  return (
    <div ref={rootRef} className={cn('relative mt-3 rounded-2xl border p-3 shadow-sm', darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white')}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className={cn('text-[11px] font-semibold uppercase tracking-[0.16em]', darkMode ? 'text-slate-400' : 'text-slate-500')}>{label}</p>
          <p className={cn('mt-0.5 text-xs', darkMode ? 'text-slate-500' : 'text-slate-400')}>Hora local exacta</p>
        </div>
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', darkMode ? 'bg-slate-700 text-emerald-300' : 'bg-emerald-50 text-emerald-700')}><Clock3 className="h-5 w-5" /></span>
      </div>
      <div className="flex items-center gap-2">
        {parts.map((part, index) => <div key={part.label} className="relative min-w-0 flex-1">
          <span className={cn('mb-1 block text-center text-[10px] font-medium uppercase tracking-wide', darkMode ? 'text-slate-500' : 'text-slate-400')}>{part.label}</span>
          <button type="button" aria-label={`${label}: ${part.label}`} aria-haspopup="listbox" aria-expanded={openPart === index} onClick={() => setOpenPart((current) => current === index ? null : index)} className={cn('flex w-full items-center justify-center gap-1 rounded-xl border px-2 py-2 text-lg font-semibold tabular-nums outline-none transition focus:ring-4 focus:ring-emerald-500/10', darkMode ? 'border-slate-700 bg-slate-900 text-white hover:border-slate-600' : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-emerald-300')}>
            {part.value}<ChevronRight className={cn('h-3.5 w-3.5 rotate-90 transition-transform', openPart === index && '-rotate-90')} />
          </button>
          {openPart === index && <div ref={optionsRef} role="listbox" aria-label={part.label} className={cn('absolute left-0 right-0 top-full z-50 mt-1 max-h-32 overflow-y-auto overscroll-contain rounded-xl border p-1 shadow-xl', darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white')}>
            {Array.from({ length: part.options }, (_, option) => {
              const optionValue = String(option).padStart(2, '0')
              const selected = part.value === optionValue
              return <button key={option} ref={selected ? selectedOptionRef : undefined} type="button" role="option" aria-selected={selected} onClick={() => changePart(index, optionValue)} className={cn('block w-full rounded-lg px-2 py-1 text-center text-sm tabular-nums transition', selected ? 'bg-emerald-600 font-semibold text-white' : darkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-emerald-50')}>{optionValue}</button>
            })}
          </div>}
        </div>)}
      </div>
    </div>
  )
}
