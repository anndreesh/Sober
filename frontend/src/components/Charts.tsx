import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ThemeProps = { darkMode: boolean }

type ActivityDatum = { date: string; journal: number; urges: number }
type HabitDatum = { date: string; value: number; status: string }
type WeeklyDatum = { day: string; journalCount: number; urgeCount: number }
type StreakDatum = { name: string; days: number }

const axisStyle = (darkMode: boolean) => ({ fontSize: 12, fill: darkMode ? '#cbd5e1' : '#64748b' })

export function WeeklyActivityChart({ data, darkMode }: ThemeProps & { data: ActivityDatum[] }) {
  const stroke = darkMode ? '#526b5b' : '#e5e4da'
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs><linearGradient id="activityFill" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#42694b" stopOpacity={0.28} /><stop offset="95%" stopColor="#42694b" stopOpacity={0.02} /></linearGradient></defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={stroke} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={axisStyle(darkMode)} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={axisStyle(darkMode)} />
        <Tooltip contentStyle={{ borderRadius: 12, borderColor: stroke, backgroundColor: darkMode ? '#19251e' : '#fbfaf6' }} />
        <Area type="monotone" dataKey="journal" name="Diario" stroke="#42694b" strokeWidth={2.5} fill="url(#activityFill)" />
        <Area type="monotone" dataKey="urges" name="Impulsos" stroke="#b47f43" strokeWidth={2.5} fill="transparent" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function HabitProgressChart({ data, darkMode, interval }: ThemeProps & { data: HabitDatum[]; interval: number | 'preserveStartEnd' }) {
  const stroke = darkMode ? '#526b5b' : '#e5e4da'
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs><linearGradient id="habitProgressFill" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#587b5d" stopOpacity={0.3} /><stop offset="95%" stopColor="#587b5d" stopOpacity={0.02} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke={stroke} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} interval={interval} tick={axisStyle(darkMode)} />
        <YAxis tickLine={false} axisLine={false} tick={axisStyle(darkMode)} domain={[0, 100]} ticks={[0, 100]} />
        <Tooltip
          labelFormatter={(label, payload) => `${label} · ${payload[0]?.payload?.status ?? 'Racha'}`}
          contentStyle={{ borderRadius: 12, borderColor: stroke, backgroundColor: darkMode ? '#19251e' : '#fbfaf6' }}
        />
        <Area type="stepAfter" dataKey="value" name="Racha" stroke="#42694b" strokeWidth={3} fill="url(#habitProgressFill)" activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function WeeklyJournalChart({ data, darkMode }: ThemeProps & { data: WeeklyDatum[] }) {
  const stroke = darkMode ? '#526b5b' : '#e5e4da'
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="journalActivityFill" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#42694b" stopOpacity={0.26} /><stop offset="95%" stopColor="#42694b" stopOpacity={0.02} /></linearGradient>
          <linearGradient id="urgeActivityFill" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#b47f43" stopOpacity={0.22} /><stop offset="95%" stopColor="#b47f43" stopOpacity={0.02} /></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={stroke} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={axisStyle(darkMode)} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisStyle(darkMode)} />
        <Tooltip contentStyle={{ borderRadius: 12, borderColor: stroke, backgroundColor: darkMode ? '#19251e' : '#fbfaf6' }} />
        <Area type="monotone" dataKey="journalCount" name="Diario" stroke="#42694b" strokeWidth={3} fill="url(#journalActivityFill)" />
        <Area type="monotone" dataKey="urgeCount" name="Impulsos" stroke="#b47f43" strokeWidth={3} fill="url(#urgeActivityFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function HabitStreakChart({ data, darkMode }: ThemeProps & { data: StreakDatum[] }) {
  const stroke = darkMode ? '#526b5b' : '#e5e4da'
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={stroke} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} tick={{ ...axisStyle(darkMode), fontSize: 11 }} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ ...axisStyle(darkMode), fontSize: 11 }} />
        <Tooltip formatter={(value) => [`${value} días`, 'Racha']} contentStyle={{ borderRadius: 12, borderColor: stroke, backgroundColor: darkMode ? '#19251e' : '#fbfaf6' }} />
        <Bar dataKey="days" name="Racha" radius={[8, 8, 0, 0]} fill="#607b58" />
      </BarChart>
    </ResponsiveContainer>
  )
}
