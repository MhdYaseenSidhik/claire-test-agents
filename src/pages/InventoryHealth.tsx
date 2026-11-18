import { useState, useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
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

type DrillLevel = 'plant' | 'group' | 'material'

export default function InventoryHealth({ filters, dims }: Props) {
  const { plant, materialGroup, criticality } = filters
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
      (!materialGroup || r.materialGroup === materialGroup) &&
      (!criticality || r.criticality === criticality)
    )
  }, [summary, plant, materialGroup, criticality])

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
      (!criticality || r.criticality === criticality)
    ).sort((a, b) => b.valueInr - a.valueInr)
  }, [materials, drillPlant, drillGroup, materialGroup, criticality])

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status chart */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Value by Inventory Status</h3>
          {sumLoading ? <div className="skeleton h-48" /> : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byStatus} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => fmtInr(v)} />
                  <YAxis type="category" dataKey="status" tick={{ fontSize: 10 }} width={80} />
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
                  <YAxis type="category" dataKey="cls" tick={{ fontSize: 10 }} width={80} />
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
                    <td className="px-4 py-3 text-right font-mono">{fmtNum(p.materials)}</td>
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
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Material Groups — click to see materials</h3>
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
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{fmtNum(g.materials)}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{fmtInr(g.value)}</td>
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
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button className="btn-ghost px-2 py-1 text-xs" disabled={matPage === 0} onClick={() => setMatPage(p => p - 1)}>← Prev</button>
              <span>{matPage * MAT_PAGE_SIZE + 1}–{Math.min((matPage + 1) * MAT_PAGE_SIZE, matRows.length)} of {matRows.length}</span>
              <button className="btn-ghost px-2 py-1 text-xs" disabled={(matPage + 1) * MAT_PAGE_SIZE >= matRows.length} onClick={() => setMatPage(p => p + 1)}>Next →</button>
            </div>
          </div>
          {matLoading ? (
            <div className="p-8 text-center text-slate-400">
              <div className="skeleton h-4 w-48 mx-auto mb-2" />
              <div className="skeleton h-4 w-32 mx-auto" />
              <p className="text-xs mt-4">Loading 34,717 materials…</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark">
                    {['Material', 'Description', 'ABC', 'Status', 'Qty', 'Value', 'Days on Hand'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matRows.slice(matPage * MAT_PAGE_SIZE, (matPage + 1) * MAT_PAGE_SIZE).map((m, i) => (
                    <tr key={m.materialId + m.plantId}
                      className={cn('border-b border-border-light dark:border-border-dark',
                        i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20')}
                    >
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400">{m.materialId}</td>
                      <td className="px-3 py-2.5 max-w-[200px] truncate text-slate-900 dark:text-slate-100" title={m.description}>{m.description}</td>
                      <td className="px-3 py-2.5"><span className="badge badge-info">{m.abcClass}</span></td>
                      <td className="px-3 py-2.5">
                        <span className={cn('badge', m.inventoryStatus === 'NORMAL' ? 'badge-low' : m.inventoryStatus === 'EXCESS' || m.inventoryStatus === 'OBSOLETE' ? 'badge-high' : 'badge-medium')}>
                          {m.inventoryStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">{fmtNum(m.availableQty)}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-medium">{fmtInr(m.valueInr)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{fmtNum(m.daysOnHand, 0)}</td>
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
