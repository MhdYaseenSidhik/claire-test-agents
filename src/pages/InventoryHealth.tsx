import { useState, useMemo } from 'react'
import { ChevronRight, Package } from 'lucide-react'
import { Filters, Dims, InvSummary, Materials } from '../types'
import { fmtInr, fmtNum, cn } from '../lib/utils'
import { useData } from '../hooks/useData'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'

interface Props { filters: Filters; dims: Dims | null }

const STATUS_COLORS: Record<string, string> = {
  NORMAL: '#16A34A', EXCESS: '#D97706', NON_MOVING: '#94A3B8',
  SLOW_MOVING: '#F59E0B', OBSOLETE: '#EF4444', STOCKOUT: '#DC2626',
  UNDERSTOCK: '#F97316', CRITICAL_SHORTAGE: '#7C3AED',
}

const MOVE_COLORS: Record<string, string> = {
  ACTIVE: '#2563EB', SLOW_MOVING: '#F59E0B', NON_MOVING: '#94A3B8', OBSOLETE: '#EF4444',
}

const STATUS_LABELS: Record<string, string> = {
  NORMAL: 'Normal', EXCESS: 'Excess', NON_MOVING: 'Non-Moving',
  SLOW_MOVING: 'Slow Moving', OBSOLETE: 'Obsolete', STOCKOUT: 'Stockout',
  UNDERSTOCK: 'Understock', CRITICAL_SHORTAGE: 'Critical Shortage',
}
const MOVE_LABELS: Record<string, string> = {
  ACTIVE: 'Active', SLOW_MOVING: 'Slow Moving', NON_MOVING: 'Non-Moving', OBSOLETE: 'Obsolete',
}

const TYPE_COLORS: Record<string, string> = { ZSPR: '#2563EB', ZSPN: '#7C3AED' }

type DrillLevel = 'plant' | 'group' | 'material'

export default function InventoryHealth({ filters, dims }: Props) {
  const { plant, materialType, materialGroup, criticality } = filters
  const [drillPlant, setDrillPlant] = useState<string | null>(null)
  const [drillGroup, setDrillGroup] = useState<string | null>(null)
  const [level, setLevel] = useState<DrillLevel>('plant')
  const [matPage, setMatPage] = useState(0)
  const MAT_PAGE_SIZE = 50

  const { data: summary, loading: sumLoading } = useData<InvSummary>('/data/inventory_summary.json')
  const { data: materials, loading: matLoading } = useData<Materials>('/data/materials.json', level === 'material')

  const filteredSummary = useMemo(() => {
    if (!summary) return []
    return summary.rows.filter(r =>
      (plant === 'ALL_PLANTS' || r.plantId === plant) &&
      (!materialType || r.materialType === materialType) &&
      (!materialGroup || r.materialGroup === materialGroup) &&
      (!criticality || r.criticality === criticality)
    )
  }, [summary, plant, materialType, materialGroup, criticality])

  // Material type breakdown from materials.json
  const typeBreakdown = useMemo(() => {
    if (!materials) return []
    const filtered = materials.rows.filter(r =>
      (plant === 'ALL_PLANTS' || r.plantId === plant) &&
      (!materialGroup || r.materialGroup === materialGroup) &&
      (!criticality || r.criticality === criticality) &&
      (!materialType || r.materialType === materialType)
    )
    const map = new Map<string, { count: number; value: number }>()
    filtered.forEach(r => {
      const e = map.get(r.materialType) ?? { count: 0, value: 0 }
      e.count++; e.value += r.valueInr
      map.set(r.materialType, e)
    })
    return [...map.entries()].map(([type, d]) => ({ type, ...d })).sort((a, b) => b.value - a.value)
  }, [materials, plant, materialGroup, criticality, materialType])

  // Plant-level aggregation
  const byPlant = useMemo(() => {
    const map = new Map<string, { value: number; materials: number }>()
    filteredSummary.forEach(r => {
      const e = map.get(r.plantId) ?? { value: 0, materials: 0 }
      e.value += r.valueInr; e.materials += r.materials
      map.set(r.plantId, e)
    })
    return [...map.entries()].map(([plantId, d]) => ({
      plantId,
      name: dims?.plants.find(p => p.plantId === plantId)?.name ?? plantId,
      ...d
    })).sort((a, b) => b.value - a.value)
  }, [filteredSummary, dims])

  // Group-level aggregation for drilled plant
  const byGroup = useMemo(() => {
    if (!drillPlant) return []
    const map = new Map<string, { value: number; materials: number }>()
    filteredSummary.filter(r => r.plantId === drillPlant).forEach(r => {
      const e = map.get(r.materialGroup) ?? { value: 0, materials: 0 }
      e.value += r.valueInr; e.materials += r.materials
      map.set(r.materialGroup, e)
    })
    return [...map.entries()].map(([group, d]) => ({
      group,
      name: dims?.materialGroups.find(g => g.code === group)?.name ?? group,
      ...d
    })).sort((a, b) => b.value - a.value)
  }, [filteredSummary, drillPlant, dims])

  // Status breakdown for chart
  const byStatus = useMemo(() => {
    const rows = level === 'group' && drillPlant
      ? filteredSummary.filter(r => r.plantId === drillPlant && (!drillGroup || r.materialGroup === drillGroup))
      : filteredSummary
    const map = new Map<string, number>()
    rows.forEach(r => { map.set(r.inventoryStatus, (map.get(r.inventoryStatus) ?? 0) + r.valueInr) })
    return [...map.entries()].map(([status, value]) => ({ status, value })).sort((a, b) => b.value - a.value)
  }, [filteredSummary, level, drillPlant, drillGroup])

  // Movement class breakdown
  const byMove = useMemo(() => {
    const rows = level === 'group' && drillPlant
      ? filteredSummary.filter(r => r.plantId === drillPlant && (!drillGroup || r.materialGroup === drillGroup))
      : filteredSummary
    const map = new Map<string, number>()
    rows.forEach(r => { map.set(r.movementClass, (map.get(r.movementClass) ?? 0) + r.valueInr) })
    return [...map.entries()].map(([cls, value]) => ({ cls, value })).sort((a, b) => b.value - a.value)
  }, [filteredSummary, level, drillPlant, drillGroup])

  // Material list
  const matRows = useMemo(() => {
    if (!materials) return []
    return materials.rows.filter(r =>
      (!drillPlant || r.plantId === drillPlant) &&
      (!drillGroup || r.materialGroup === drillGroup) &&
      (!materialGroup || r.materialGroup === materialGroup) &&
      (!criticality || r.criticality === criticality) &&
      (!materialType || r.materialType === materialType)
    ).sort((a, b) => b.valueInr - a.valueInr)
  }, [materials, drillPlant, drillGroup, materialGroup, criticality, materialType])

  const totalValue = filteredSummary.reduce((s, r) => s + r.valueInr, 0)
  const totalMaterials = filteredSummary.reduce((s, r) => s + r.materials, 0)

  return (
    <div className="space-y-4">
      <div className="pb-4 border-b border-border-light dark:border-border-dark">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Inventory Health</h1>
      </div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm">
        <button
          className={cn('font-medium', level === 'plant' ? 'text-accent' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100')}
          onClick={() => { setLevel('plant'); setDrillPlant(null); setDrillGroup(null) }}
        >All Plants</button>
        {drillPlant && <>
          <ChevronRight size={14} className="text-slate-400" />
          <button
            className={cn('font-medium', level === 'group' ? 'text-accent' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100')}
            onClick={() => { setLevel('group'); setDrillGroup(null) }}
          >{dims?.plants.find(p => p.plantId === drillPlant)?.name ?? drillPlant}</button>
        </>}
        {drillGroup && <>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="text-accent font-medium">{dims?.materialGroups.find(g => g.code === drillGroup)?.name ?? drillGroup}</span>
        </>}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Value', value: fmtInr(totalValue) },
          { label: 'Materials', value: fmtNum(totalMaterials) },
          { label: 'Excess', value: fmtInr(filteredSummary.filter(r => r.inventoryStatus === 'EXCESS').reduce((s, r) => s + r.valueInr, 0)) },
          { label: 'Non-Moving', value: fmtInr(filteredSummary.filter(r => r.movementClass === 'NON_MOVING').reduce((s, r) => s + r.valueInr, 0)) },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{s.label}</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Material Type Breakdown */}
      {typeBreakdown.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Value by Material Type</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {typeBreakdown.map(t => {
              const total = typeBreakdown.reduce((s, x) => s + x.value, 0)
              const pct = total > 0 ? t.value / total * 100 : 0
              return (
                <div key={t.type} className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: TYPE_COLORS[t.type] ?? '#94A3B8' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.type}</span>
                      <span className="text-xs text-slate-500">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: TYPE_COLORS[t.type] ?? '#94A3B8' }} />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-500">{fmtNum(t.count)} materials</span>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{fmtInr(t.value)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status chart */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Value by Inventory Status</h3>
          {sumLoading ? <div className="skeleton h-48" /> : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byStatus} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => fmtInr(v)} />
                  <YAxis type="category" dataKey="status" tick={{ fontSize: 10 }} width={100} tickFormatter={(v: string) => STATUS_LABELS[v] ?? v} />
                  <Tooltip formatter={(v: number) => fmtInr(v)} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {byStatus.map(d => <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? '#94A3B8'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Movement chart */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Value by Movement Class</h3>
          {sumLoading ? <div className="skeleton h-48" /> : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMove} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => fmtInr(v)} />
                  <YAxis type="category" dataKey="cls" tick={{ fontSize: 10 }} width={100} tickFormatter={(v: string) => MOVE_LABELS[v] ?? v} />
                  <Tooltip formatter={(v: number) => fmtInr(v)} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {byMove.map(d => <Cell key={d.cls} fill={MOVE_COLORS[d.cls] ?? '#94A3B8'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Drill-down table */}
      {level === 'plant' && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-border-light dark:border-border-dark">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Plants — click to drill down</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plant</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Materials</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Value (INR)</th>
                </tr>
              </thead>
              <tbody>
                {byPlant.length === 0 && !sumLoading && (
                  <tr><td colSpan={3}>
                    <div className="p-12 text-center">
                      <Package size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-400 font-medium">No inventory data matches your filters.</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try clearing the material group or criticality filter.</p>
                    </div>
                  </td></tr>
                )}
                {byPlant.map((p, i) => (
                  <tr key={p.plantId}
                    tabIndex={0}
                    role="button"
                    aria-label={`Drill into ${p.name}`}
                    className={cn('border-b border-border-light dark:border-border-dark cursor-pointer hover:bg-accent/5 transition-colors',
                      i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20')}
                    onClick={() => { setDrillPlant(p.plantId); setLevel('group') }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDrillPlant(p.plantId); setLevel('group') } }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.plantId}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">{fmtNum(p.materials)}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-900 dark:text-slate-100">{fmtInr(p.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {level === 'group' && drillPlant && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-border-light dark:border-border-dark">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Material Groups — click to drill down</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Group</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Materials</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Value (INR)</th>
                </tr>
              </thead>
              <tbody>
                {byGroup.map((g, i) => (
                  <tr key={g.group}
                    tabIndex={0}
                    role="button"
                    aria-label={`Drill into ${g.name}`}
                    className={cn('border-b border-border-light dark:border-border-dark cursor-pointer hover:bg-accent/5 transition-colors',
                      i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20')}
                    onClick={() => { setDrillGroup(g.group); setLevel('material'); setMatPage(0) }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDrillGroup(g.group); setLevel('material'); setMatPage(0) } }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{g.name}</div>
                      <div className="text-xs text-slate-400">{g.group}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">{fmtNum(g.materials)}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-900 dark:text-slate-100">{fmtInr(g.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {level === 'material' && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-border-light dark:border-border-dark flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Materials ({fmtNum(matRows.length)})
            </h3>
            <div className="flex gap-2">
              <button className="btn-ghost px-2 py-1 text-xs" disabled={matPage === 0} onClick={() => setMatPage(p => p - 1)}>← Prev</button>
              <button className="btn-ghost px-2 py-1 text-xs" disabled={(matPage + 1) * MAT_PAGE_SIZE >= matRows.length} onClick={() => setMatPage(p => p + 1)}>Next →</button>
            </div>
          </div>
          {matLoading ? (
            <div className="p-8 text-center"><div className="skeleton h-4 w-48 mx-auto" /></div>
          ) : matRows.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No materials match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark">
                    {['Material', 'Type', 'Group', 'Criticality', 'ABC', 'Movement', 'Status', 'Value', 'Days on Hand'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matRows.slice(matPage * MAT_PAGE_SIZE, (matPage + 1) * MAT_PAGE_SIZE).map((r, i) => (
                    <tr key={`${r.materialId}-${r.plantId}`}
                      className={cn('border-b border-border-light dark:border-border-dark',
                        i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20')}>
                      <td className="px-3 py-2.5">
                        <div className="font-mono text-xs text-slate-700 dark:text-slate-300">{r.materialId}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[160px]" title={r.description}>{r.description}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded-sm" style={{ background: (TYPE_COLORS[r.materialType] ?? '#94A3B8') + '20', color: TYPE_COLORS[r.materialType] ?? '#94A3B8' }}>{r.materialType}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{r.materialGroup}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{r.criticality}</td>
                      <td className="px-3 py-2.5 text-xs font-mono text-slate-500">{r.abcClass}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{r.movementClass}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{r.inventoryStatus}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs font-medium text-slate-900 dark:text-slate-100">{fmtInr(r.valueInr)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-500">{r.daysOnHand > 0 ? fmtNum(r.daysOnHand, 0) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
