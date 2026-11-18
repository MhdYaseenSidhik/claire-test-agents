import { useMemo } from 'react'
import { TrendingUp, TrendingDown, DollarSign, RotateCcw, Clock, ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react'
import { Filters, Kpis, Dims, Manifest } from '../types'
import { fmtInr, fmtNum, fmtPct, fmtMonth, cn } from '../lib/utils'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

const HERO_KPIS = [
  { code: 'GROSS_INVENTORY_VALUE_INR', label: 'Gross Inventory', icon: DollarSign, fmt: fmtInr },
  { code: 'INVENTORY_TURNOVER_RATIO', label: 'Turnover Ratio', icon: RotateCcw, fmt: (v: number) => fmtNum(v, 2) },
  { code: 'CRITICAL_SPARE_AVAILABILITY_PCT', label: 'Critical Availability', icon: ShieldCheck, fmt: fmtPct },
  { code: 'DAYS_ON_HAND', label: 'Days on Hand', icon: Clock, fmt: (v: number) => `${fmtNum(v, 0)} d` },
  { code: 'STOCKOUT_MATERIAL_COUNT', label: 'Stockouts', icon: AlertCircle, fmt: fmtNum },
  { code: 'EXCESS_INVENTORY_VALUE_INR', label: 'Excess Inventory', icon: AlertTriangle, fmt: fmtInr },
]

interface Props { filters: Filters; kpis: Kpis | null; dims: Dims | null; manifest: Manifest | null }

export default function Overview({ filters, kpis, manifest }: Props) {
  const { plant, monthFrom, monthTo } = filters

  const latestMonth = useMemo(() => {
    if (!kpis) return ''
    const months = [...new Set(kpis.rows.map(r => r.month))].sort()
    const inRange = months.filter(m => m >= monthFrom && m <= monthTo)
    return inRange[inRange.length - 1] ?? months[months.length - 1]
  }, [kpis, monthFrom, monthTo])

  const prevMonth = useMemo(() => {
    if (!latestMonth) return ''
    const [y, m] = latestMonth.split('-').map(Number)
    return `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, '0')}`
  }, [latestMonth])

  const getVal = (code: string, month: string) =>
    kpis?.rows.find(r => r.kpiCode === code && r.plantId === plant && r.month === month)?.value ?? null

  const getSparkline = (code: string) =>
    (kpis?.rows ?? []).filter(r => r.kpiCode === code && r.plantId === plant && r.month >= monthFrom && r.month <= monthTo)
      .sort((a, b) => a.month.localeCompare(b.month)).map(r => ({ month: r.month, value: r.value }))

  const getCatalog = (code: string) => kpis?.catalog.find(c => c.code === code)

  if (!kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {HERO_KPIS.map(k => (
          <div key={k.code} className="card p-5">
            <div className="skeleton h-4 w-32 mb-3" /><div className="skeleton h-8 w-24 mb-2" /><div className="skeleton h-3 w-16" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border-light dark:border-border-dark">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Overview</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Latest: <span className="font-medium">{fmtMonth(latestMonth)}</span>
          {manifest?.disclaimer && <span className="ml-2 text-amber-600 dark:text-amber-400">· POC data</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {HERO_KPIS.map(({ code, label, icon: Icon, fmt }) => {
          const val = getVal(code, latestMonth)
          const prev = getVal(code, prevMonth)
          const cat = getCatalog(code)
          const sparkData = getSparkline(code)
          const delta = val != null && prev != null ? val - prev : null
          const pctDelta = delta != null && prev != null && prev !== 0 ? delta / Math.abs(prev) : null
          const dir = cat?.direction ?? 'neutral'
          const isGood = delta == null ? null : dir === 'higher_is_better' ? delta >= 0 : dir === 'lower_is_better' ? delta <= 0 : null

          return (
            <div key={code} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-sm bg-accent/10 dark:bg-accent/20 flex items-center justify-center">
                    <Icon size={15} className="text-accent" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
                </div>
                {pctDelta != null && (
                  <span className={cn('text-xs font-medium flex items-center gap-0.5', isGood === true ? 'text-success' : isGood === false ? 'text-danger' : 'text-slate-400')}>
                    {delta! > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(pctDelta * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {val != null ? fmt(val) : <span className="text-slate-400 text-base">No data</span>}
              </div>
              {sparkData.length > 1 && (
                <div className="h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkData}>
                      <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={1.5} dot={false} />
                      <Tooltip content={({ active, payload }) => active && payload?.[0] ? (
                        <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded px-2 py-1 text-xs shadow-md">
                          <div className="text-slate-500">{fmtMonth(payload[0].payload.month)}</div>
                          <div className="font-medium">{fmt(payload[0].value as number)}</div>
                        </div>
                      ) : null} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              {cat && <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">{cat.definition}</p>}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['POTENTIAL_INVENTORY_REDUCTION_INR', 'WORKING_CAPITAL_OPPORTUNITY_INR'].map(code => {
          const val = getVal(code, latestMonth)
          const cat = getCatalog(code)
          return (
            <div key={code} className="card p-5 border-l-4 border-l-accent">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{cat?.label ?? code}</div>
              <div className="text-xl font-bold text-accent">{val != null ? fmtInr(val) : '—'}</div>
              {cat && <p className="text-xs text-slate-400 mt-1">{cat.definition}</p>}
            </div>
          )
        })}
      </div>

      {manifest && (
        <div className="card p-4 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-400">{manifest.disclaimer}</p>
        </div>
      )}
    </div>
  )
}
