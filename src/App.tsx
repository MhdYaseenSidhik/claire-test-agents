import { useState, useEffect } from 'react'
import { LayoutDashboard, BarChart3, Package, ShoppingCart, TrendingUp, FileBarChart, Moon, Sun, Menu } from 'lucide-react'
import { cn } from './lib/utils'
import { Page, Filters } from './types'
import { useData } from './hooks/useData'
import { Dims, Kpis, Manifest } from './types'
import Overview from './pages/Overview'
import KpiScorecard from './pages/KpiScorecard'
import InventoryHealth from './pages/InventoryHealth'
import Replenishment from './pages/Replenishment'
import ForecastPage from './pages/ForecastPage'
import PlanVsActual from './pages/PlanVsActual'

const NAV = [
  { id: 'overview' as Page, label: 'Overview', icon: LayoutDashboard },
  { id: 'kpis' as Page, label: 'KPI Scorecard', icon: BarChart3 },
  { id: 'inventory' as Page, label: 'Inventory Health', icon: Package },
  { id: 'replenishment' as Page, label: 'Replenishment', icon: ShoppingCart },
  { id: 'forecast' as Page, label: 'Demand Forecast', icon: TrendingUp },
  { id: 'plan' as Page, label: 'Plan vs Actual', icon: FileBarChart },
]

export default function App() {
  const [page, setPage] = useState<Page>('overview')
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>({ plant: 'ALL_PLANTS', materialGroup: '', criticality: '', monthFrom: '2023-01', monthTo: '2025-12' })

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const { data: dims } = useData<Dims>('/data/dims.json')
  const { data: manifest } = useData<Manifest>('/data/manifest.json')
  const { data: kpis } = useData<Kpis>('/data/kpis.json')

  const plants = dims?.plants ?? []
  const materialGroups = dims?.materialGroups ?? []
  const criticalities = dims?.criticality ?? []

  return (
    <div className="flex h-screen overflow-hidden bg-surface-light dark:bg-surface-dark">
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={cn('fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col bg-card-light dark:bg-card-dark border-r border-border-light dark:border-border-dark transition-transform duration-200', sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border-light dark:border-border-dark">
          <div className="w-8 h-8 rounded-sm bg-accent flex items-center justify-center"><Package size={16} className="text-white" /></div>
          <div><div className="text-sm font-semibold text-slate-900 dark:text-slate-100">HZL Inventory</div><div className="text-xs text-slate-500 dark:text-slate-400">Control Dashboard</div></div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setPage(id); setSidebarOpen(false) }}
              className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors mb-0.5',
                page === id ? 'bg-accent/10 text-accent dark:bg-accent/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100')}>
              <Icon size={16} />{label}
            </button>
          ))}
        </nav>
        {manifest && (
          <div className="px-4 py-3 border-t border-border-light dark:border-border-dark">
            <div className="text-xs text-slate-400">Data as of <span className="font-medium text-slate-600 dark:text-slate-300">{manifest.asOf}</span></div>
            {manifest.backcastIncluded && <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">2023 backcast included</div>}
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 bg-card-light dark:bg-card-dark border-b border-border-light dark:border-border-dark flex-shrink-0">
          <button className="lg:hidden btn-ghost p-2 -ml-2" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
          <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
            <select className="select-base w-auto min-w-[140px]" value={filters.plant} onChange={e => setFilters(f => ({ ...f, plant: e.target.value }))} aria-label="Plant">
              <option value="ALL_PLANTS">All Plants</option>
              {plants.map(p => <option key={p.plantId} value={p.plantId}>{p.name}</option>)}
            </select>
            <select className="select-base w-auto min-w-[140px]" value={filters.materialGroup} onChange={e => setFilters(f => ({ ...f, materialGroup: e.target.value }))} aria-label="Material Group">
              <option value="">All Groups</option>
              {materialGroups.map(g => <option key={g.code} value={g.code}>{g.name}</option>)}
            </select>
            <select className="select-base w-auto min-w-[120px]" value={filters.criticality} onChange={e => setFilters(f => ({ ...f, criticality: e.target.value }))} aria-label="Criticality">
              <option value="">All Criticality</option>
              {criticalities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            <div className="flex items-center gap-1.5">
              <input type="month" className="select-base w-auto" value={filters.monthFrom} min="2023-01" max={filters.monthTo} onChange={e => setFilters(f => ({ ...f, monthFrom: e.target.value }))} aria-label="From month" />
              <span className="text-slate-400 text-xs">–</span>
              <input type="month" className="select-base w-auto" value={filters.monthTo} min={filters.monthFrom} max="2026-12" onChange={e => setFilters(f => ({ ...f, monthTo: e.target.value }))} aria-label="To month" />
            </div>
          </div>
          <button onClick={() => setDark(d => !d)} className="btn-ghost p-2 rounded-sm flex-shrink-0" aria-label="Toggle dark mode">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {page === 'overview' && <Overview filters={filters} kpis={kpis} dims={dims} manifest={manifest} />}
          {page === 'kpis' && <KpiScorecard filters={filters} kpis={kpis} />}
          {page === 'inventory' && <InventoryHealth filters={filters} dims={dims} />}
          {page === 'replenishment' && <Replenishment filters={filters} dims={dims} />}
          {page === 'forecast' && <ForecastPage filters={filters} />}
          {page === 'plan' && <PlanVsActual filters={filters} dims={dims} />}
        </main>
      </div>
    </div>
  )
}
