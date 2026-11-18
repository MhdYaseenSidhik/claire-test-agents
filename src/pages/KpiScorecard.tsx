import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Search } from 'lucide-react'
import { Filters, Kpis } from '../types'
import { fmtInr, fmtNum, fmtPct, fmtMonth, cn } from '../lib/utils'
import { useChartColors } from '../hooks/useChartColors'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

interface Props { filters: Filters; kpis: Kpis | null }

function fmtVal(v: number, uom: string): string {
  if (uom === 'INR') return fmtInr(v)
  if (uom === 'PCT' || uom === '%') return fmtPct(v)
  return fmtNum(v, 2)
}

export default function KpiScorecard({ filters, kpis }: Props) {
  const { plant, monthFrom, monthTo } = filters
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const { grid } = useChartColors()

  const months = useMemo(() => {
    if (!kpis) return []
    return [...new Set(kpis.rows.map(r => r.month))]
      .filter(m => m >= monthFrom && m <= monthTo)
      .sort()
  }, [kpis, monthFrom, monthTo])

  const latestMonth = months[months.length - 1] ?? ''
  const prevMonth = useMemo(() => {
    if (!latestMonth) return ''
    const [y, m] = latestMonth.split('-').map(Number)
    return `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, '0')}`
  }, [latestMonth])

  const catalog = useMemo(() => {
    if (!kpis) return []
    return kpis.catalog.filter(c => c.code.toLowerCase().includes(search.toLowerCase()) || c.label.toLowerCase().includes(search.toLowerCase()))
  }, [kpis, search])

  const getVal = (code: string, month: string) =>
    kpis?.rows.find(r => r.kpiCode === code && r.plantId === plant && r.month === month)?.value ?? null

  const getTrend = (code: string) =>
    months.map(m => ({ month: m, value: getVal(code, m) })).filter(d => d.value != null)

  if (!kpis) {
    return <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="card p-4 skeleton h-16" />)}</div>
  }

  const selectedCat = kpis.catalog.find(c => c.code === selected)
  const trendData = selected ? getTrend(selected) : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-border-light dark:border-border-dark">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">KPI Scorecard</h1>
        <span className="text-sm text-slate-500 dark:text-slate-400">{fmtMonth(latestMonth)}</span>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="select-base pl-8"
          placeholder="Search KPIs…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {selected && selectedCat && (
        <div className="card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{selectedCat.label}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedCat.definition}</p>
            </div>
            <button className="btn-ghost text-xs px-2 py-1" onClick={() => setSelected(null)}>Close</button>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={fmtMonth} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmtVal(v, selectedCat.uom)} width={70} />
                <Tooltip
                  content={({ active, payload }) => active && payload?.[0] ? (
                    <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded px-3 py-2 text-xs shadow-md">
                      <div className="text-slate-500 mb-1">{fmtMonth(payload[0].payload.month)}</div>
                      <div className="font-semibold">{fmtVal(payload[0].value as number, selectedCat.uom)}</div>
                    </div>
                  ) : null}
                />
                <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">KPI</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Latest</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Prev</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Δ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">UOM</th>
              </tr>
            </thead>
            <tbody>
              {catalog.map((cat, i) => {
                const val = getVal(cat.code, latestMonth)
                const prev = getVal(cat.code, prevMonth)
                const delta = val != null && prev != null ? val - prev : null
                const pctDelta = delta != null && prev != null && prev !== 0 ? delta / Math.abs(prev) : null
                const isGood = delta == null ? null :
                  cat.direction === 'higher_is_better' ? delta >= 0 :
                  cat.direction === 'lower_is_better' ? delta <= 0 : null

                return (
                  <tr
                    key={cat.code}
                    tabIndex={0}
                    role="button"
                    aria-pressed={selected === cat.code}
                    aria-label={`${cat.label} — click to view trend`}
                    className={cn(
                      'border-b border-border-light dark:border-border-dark cursor-pointer transition-colors',
                      i % 2 === 0 ? 'bg-white dark:bg-card-dark' : 'bg-slate-50/50 dark:bg-slate-800/20',
                      'hover:bg-accent/5 dark:hover:bg-accent/10',
                      selected === cat.code && 'bg-accent/10 dark:bg-accent/20'
                    )}
                    onClick={() => setSelected(selected === cat.code ? null : cat.code)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(selected === cat.code ? null : cat.code) } }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{cat.label}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[260px]">{cat.definition ?? cat.code}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                      {val != null ? fmtVal(val, cat.uom) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500 dark:text-slate-400">
                      {prev != null ? fmtVal(prev, cat.uom) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {pctDelta != null && (
                        <span className={cn('flex items-center justify-end gap-0.5 text-xs font-medium',
                          isGood === true ? 'text-success' : isGood === false ? 'text-danger' : 'text-slate-400'
                        )}>
                          {delta! > 0 ? <TrendingUp size={11} /> : delta! < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
                          {Math.abs(pctDelta * 100).toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">{cat.uom}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
