import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm', className)}>{children}</div>
}
