import { useMemo, useState } from 'react'
import { Search, AlertTriangle } from 'lucide-react'
import { Filters, Dims, Reorder, Materials } from '../types'
import { fmtInr, fmtNum, cn, priorityColor } from '../lib/utils'
import { useData } from '../hooks/useData'

interface Props { filters: Filters; dims: Dims | null }

export default function Replenishment({ filters, dims: _dims }: Props) {
  const { plant, materialType } = filters
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('')
  const [localType, setLocalType] = useState('')
  const [groupBy, setGroupBy] = useState<'priority' | 'type'>('priority')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  const { data: reorder, loading } = useData<Reorder>('/data/reorder.json')
  const { data: materials } = useData<Materials>('/data/materials.json')

  // Build materialId → materialType lookup
  const matTypeMap = useMemo(() => {
    if (!materials) return new Map<string, string>()
    const m = new Map<string, string>()
    materials.rows.forEach(r => m.set(r.materialId, r.materialType))
    return m
  }, [materials])

  // Active type filter: global materialType OR local override
  const activeType = materialType || localType

  const rows = useMemo(() => {
    if (!reorder) return []
    return reorder.rows.filter(r => {
      const type = matTypeMap.get(r.materialId) ?? ''
      return (
        (plant === 'ALL_PLANTS' || r.plantId === plant) &&
        (!priority || r.priority === priority) &&
        (!activeType || type === activeType) &&
        (!search || r.materialId.toLowerCase().includes(search.toLowerCase()) || r.reason?.toLowerCase().includes(search.toLowerCase()))
      )
    }).sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      return (order[a.priority as keyof typeof order] ?? 9) - (order[b.priority as keyof typeof order] ?? 9)
    })
  }, [reorder, plant, priority, activeType, search, matTypeMap])

  const totalValue = rows.reduce((s, r) => s + (r.estimatedValueInr ?? 0), 0)
  const priorities = [...new Set(reorder?.rows.map(r => r.priority) ?? [])].sort()

  // Type totals
  const typeTotals = useMemo(() => {
    const map = new Map<string, { count: number; value: number }>()
    rows.forEach(r => {
      const type = matTypeMap.get(r.materialId) ?? 'UNKNOWN'
      const e = map.get(type) ?? { count: 0, value: 0 }
      e.count++; e.value += r.estimatedValueInr ?? 0
      map.set(type, e)
    })
    return [...map.entries()].map(([type, d]) => ({ type, ...d })).sort((a, b) => b.value - a.value)
  }, [rows, matTypeMap])

  // Grouped rows for "By Type" view
  const groupedByType = useMemo(() => {
    const map = new Map<string, typeof rows>()
    rows.forEach(r => {
      const type = matTypeMap.get(r.materialId) ?? 'UNKNOWN'
      const arr = map.get(type) ?? []
      arr.push(r)
      map.set(type, arr)
    })
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [rows, matTypeMap])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-border-light dark:border-border-dark">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Replenishment</h1>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {fmtNum(rows.length)} recommendations · {fmtInr(totalValue)}
        </div>
      </div>

      {/* Priority summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => {
          const count = rows.filter(r => r.priority === p).length
          const val = rows.filter(r => r.priority === p).reduce((s, r) => s + (r.estimatedValueInr ?? 0), 0)
          return (
            <div key={p} className={cn('card p-4 cursor-pointer transition-all', priority === p && 'ring-2 ring-accent')}
              onClick={() => setPriority(priority === p ? '' : p)}>
              <div className="flex items-center gap-2 mb-1">
                <span className={priorityColor(p)}>{p}</span>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{fmtNum(count)}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{fmtInr(val)}</div>
            </div>
          )
        })}
      </div>

      {/* Material Type totals */}
      {typeTotals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {typeTotals.map(t => (
            <div key={t.type} className={cn('card p-4 cursor-pointer transition-all border-l-4', activeType === t.type ? 'border-l-accent ring-2 ring-accent' : 'border-l-transparent')}
              onClick={() => setLocalType(localType === t.type ? '' : t.type)}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t.type}</span>
                <span className="text-xs text-slate-400">{t.type === 'ZSPR' ? 'Spare Parts' : 'Non-Stock'}</span>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{fmtNum(t.count)}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{fmtInr(t.value)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters + group-by */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="select-base pl-8" placeholder="Search material or reason…" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
        </div>
        <select className="select-base w-auto" value={priority} onChange={e => { setPriority(e.target.value); setPage(0) }}>
          <option value="">All Priorities</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="select-base w-auto" value={activeType} onChange={e => { setLocalType(e.target.value); setPage(0) }}>
          <option value="">All Types</option>
          <option value="ZSPR">ZSPR</option>
          <option value="ZSPN">ZSPN</option>
        </select>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-sm p-1">
          {(['priority', 'type'] as const).map(g => (
            <button key={g} onClick={() => setGroupBy(g)}
              className={cn('px-2.5 py-1 text-xs font-medium rounded-sm transition-colors',
                groupBy === g ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500'
              )}>
              By {g === 'priority' ? 'Priority' : 'Type'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {groupBy === 'priority' ? (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-border-light dark:border-border-dark flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, rows.length)} of {rows.length}
            </span>
            <div className="flex gap-2">
              <button className="btn-ghost px-2 py-1 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <button className="btn-ghost px-2 py-1 text-xs" disabled={(page + 1) * PAGE_SIZE >= rows.length} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="skeleton h-4 w-48 mx-auto mb-2" />
              <div className="skeleton h-4 w-32 mx-auto" />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <AlertTriangle size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No recommendations match your filters.</p>
              <button className="btn-ghost mt-3 text-sm" onClick={() => { setSearch(''); setPriority(''); setLocalType('') }}>Clear filters</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark">
                    {['Priority', 'Material', 'Type', 'Plant', 'Recommended Qty', 'Est. Value', 'PR Date', 'Available', 'Safety Stock', 'Reason'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((r, i) => {
                    const type = matTypeMap.get(r.materialId) ?? '—'
                    return (
                      <tr key={r.recommendationId}
                        className={cn('border-b border-border-light dark:border-border-dark',
                          i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20')}
                      >
                        <td className="px-3 py-2.5"><span className={priorityColor(r.priority)}>{r.priority}</span></td>
                        <td className="px-3 py-2.5 font-mono text-xs text-slate-700 dark:text-slate-300">{r.materialId}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded-sm bg-accent/10 text-accent">{type}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-500">{r.plantId}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{fmtNum(r.recommendedQty)}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-medium">{fmtInr(r.estimatedValueInr)}</td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap">{r.recommendedPrDate?.slice(0, 10) ?? '—'}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{fmtNum(r.availableQty)}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{fmtNum(r.safetyStockQty)}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-500 max-w-[200px] truncate" title={r.reason}>{r.reason}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Grouped by type */
        <div className="space-y-4">
          {groupedByType.length === 0 ? (
            <div className="card p-12 text-center">
              <AlertTriangle size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No recommendations match your filters.</p>
            </div>
          ) : groupedByType.map(([type, typeRows]) => {
            const typeTotal = typeRows.reduce((s, r) => s + (r.estimatedValueInr ?? 0), 0)
            return (
              <div key={type} className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{type}</span>
                    <span className="text-xs text-slate-500">{type === 'ZSPR' ? 'Spare Parts' : 'Non-Stock Spare Parts'}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {fmtNum(typeRows.length)} items · {fmtInr(typeTotal)}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-border-light dark:border-border-dark">
                        {['Priority', 'Material', 'Plant', 'Recommended Qty', 'Est. Value', 'PR Date', 'Reason'].map(h => (
                          <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {typeRows.slice(0, 20).map((r, i) => (
                        <tr key={r.recommendationId}
                          className={cn('border-b border-border-light dark:border-border-dark',
                            i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20')}>
                          <td className="px-3 py-2"><span className={priorityColor(r.priority)}>{r.priority}</span></td>
                          <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">{r.materialId}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">{r.plantId}</td>
                          <td className="px-3 py-2 text-right font-mono">{fmtNum(r.recommendedQty)}</td>
                          <td className="px-3 py-2 text-right font-mono font-medium">{fmtInr(r.estimatedValueInr)}</td>
                          <td className="px-3 py-2 text-xs whitespace-nowrap">{r.recommendedPrDate?.slice(0, 10) ?? '—'}</td>
                          <td className="px-3 py-2 text-xs text-slate-500 max-w-[200px] truncate" title={r.reason}>{r.reason}</td>
                        </tr>
                      ))}
                      {typeRows.length > 20 && (
                        <tr>
                          <td colSpan={7} className="px-3 py-2 text-xs text-slate-400 text-center">
                            … and {fmtNum(typeRows.length - 20)} more. Switch to "By Priority" view to see all.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-border-light dark:border-border-dark">
                        <td colSpan={4} className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">Total — {type}</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">{fmtInr(typeTotal)}</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
