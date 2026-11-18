import { useMemo, useState } from 'react'
import { Filters, Dims, PlanVsActual as PVAType } from '../types'
import { fmtInr, fmtNum, fmtMonth, cn } from '../lib/utils'
import { useData } from '../hooks/useData'
import { useChartColors } from '../hooks/useChartColors'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

interface Props { filters: Filters; dims: Dims | null }

export default function PlanVsActual({ filters, dims }: Props) {
  const { plant, materialGroup, monthFrom, monthTo } = filters
  const [groupBy, setGroupBy] = useState<'month' | 'group'>('month')

  const { data: pva, loading } = useData<PVAType>('/data/plan_vs_actual.json')
  const { grid } = useChartColors()

  const filtered = useMemo(() => {
    if (!pva) return []
    return pva.rows.filter(r =>
      (plant === 'ALL_PLANTS' || r.plantId === plant) &&
      (!materialGroup || r.materialGroup === materialGroup) &&
      r.month >= monthFrom && r.month <= monthTo
    )
  }, [pva, plant, materialGroup, monthFrom, monthTo])

  const chartData = useMemo(() => {
    if (groupBy === 'month') {
      const map = new Map<string, { plan: number; po: number; gr: number; variance: number }>()
      filtered.forEach(r => {
        const e = map.get(r.month) ?? { plan: 0, po: 0, gr: 0, variance: 0 }
        e.plan += r.planValueInr; e.po += r.actualPoValueInr; e.gr += r.actualGrValueInr; e.variance += r.varianceInr
        map.set(r.month, e)
      })
      return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([month, d]) => ({ label: fmtMonth(month), ...d }))
    } else {
      const map = new Map<string, { plan: number; po: number; gr: number; variance: number }>()
      filtered.forEach(r => {
        const e = map.get(r.materialGroup) ?? { plan: 0, po: 0, gr: 0, variance: 0 }
        e.plan += r.planValueInr; e.po += r.actualPoValueInr; e.gr += r.actualGrValueInr; e.variance += r.varianceInr
        map.set(r.materialGroup, e)
      })
      return [...map.entries()].sort((a, b) => b[1].plan - a[1].plan).map(([group, d]) => ({
        label: dims?.materialGroups.find(g => g.code === group)?.name ?? group, ...d
      }))
    }
  }, [filtered, groupBy, dims])

  const totals = useMemo(() => ({
    plan: filtered.reduce((s, r) => s + r.planValueInr, 0),
    po: filtered.reduce((s, r) => s + r.actualPoValueInr, 0),
    gr: filtered.reduce((s, r) => s + r.actualGrValueInr, 0),
    variance: filtered.reduce((s, r) => s + r.varianceInr, 0),
  }), [filtered])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-border-light dark:border-border-dark">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Plan vs Actual</h1>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-sm p-1">
          {(['month', 'group'] as const).map(g => (
            <button key={g} onClick={() => setGroupBy(g)}
              className={cn('px-3 py-1.5 text-sm font-medium rounded-sm transition-colors',
                groupBy === g ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500'
              )}>
              By {g === 'month' ? 'Month' : 'Group'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Plan Value', value: fmtInr(totals.plan), color: 'text-slate-900 dark:text-slate-100' },
          { label: 'Actual PO', value: fmtInr(totals.po), color: 'text-accent' },
          { label: 'Actual GR', value: fmtInr(totals.gr), color: 'text-success' },
          { label: 'Variance', value: fmtInr(totals.variance), color: totals.variance < 0 ? 'text-danger' : 'text-success' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{s.label}</div>
            <div className={cn('text-lg font-bold', s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Plan vs PO vs GR — {groupBy === 'month' ? 'Monthly' : 'By Material Group'}
        </h3>
        {loading ? (
          <div className="skeleton h-64" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={groupBy === 'month' ? -30 : 0} textAnchor={groupBy === 'month' ? 'end' : 'middle'} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmtInr(v)} width={70} />
                <Tooltip formatter={(v: number) => fmtInr(v)} />
                <Legend />
                <Bar dataKey="plan" name="Plan" fill="#94A3B8" radius={[2, 2, 0, 0]} />
                <Bar dataKey="po" name="Actual PO" fill="#2563EB" radius={[2, 2, 0, 0]} />
                <Bar dataKey="gr" name="Actual GR" fill="#16A34A" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark">
                {[groupBy === 'month' ? 'Month' : 'Group', 'Plan', 'Actual PO', 'Actual GR', 'Variance', 'Var %'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.slice(0, 50).map((d, i) => {
                const varPct = d.plan !== 0 ? d.variance / Math.abs(d.plan) : 0
                return (
                  <tr key={d.label} className={cn('border-b border-border-light dark:border-border-dark',
                    i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20')}>
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">{d.label}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{fmtInr(d.plan)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-accent">{fmtInr(d.po)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-success">{fmtInr(d.gr)}</td>
                    <td className={cn('px-4 py-2.5 text-right font-mono', d.variance < 0 ? 'text-danger' : 'text-success')}>{fmtInr(d.variance)}</td>
                    <td className={cn('px-4 py-2.5 text-right font-mono', varPct < 0 ? 'text-danger' : 'text-success')}>{(varPct * 100).toFixed(1)}%</td>
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
