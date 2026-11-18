import { useState, useMemo } from 'react'
import { Brain, TrendingUp, BarChart2, Info } from 'lucide-react'
import { Filters, Forecast, ForecastHoldout } from '../types'
import { fmtNum, fmtMonth, cn } from '../lib/utils'
import { useData } from '../hooks/useData'
import { useChartColors } from '../hooks/useChartColors'
import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from 'recharts'

interface Props { filters: Filters }

const HORIZON_LABELS: Record<number, string> = {
  3: '3-Month',
  6: '6-Month',
  12: '12-Month',
}

export default function ForecastPage({ filters }: Props) {
  const { plant } = filters
  const [horizon, setHorizon] = useState<3 | 6 | 12>(12)
  const [tab, setTab] = useState<'forecast' | 'backtest'>('forecast')

  const { data: forecast, loading: fcLoading } = useData<Forecast>('/data/forecast.json')
  const { data: holdout, loading: hoLoading } = useData<ForecastHoldout>('/data/forecast_holdout.json')

  // Forecast chart data: byPlantMonth filtered by plant and horizon, with aggregated band
  const forecastChartData = useMemo(() => {
    if (!forecast) return []
    const plantId = plant === 'ALL_PLANTS' ? 'HZL_DEMO_01' : plant

    // Plant-month aggregated predictions up to the selected horizon
    const plantMonthMap = new Map<string, number>()
    forecast.byPlantMonth
      .filter(r => r.plantId === plantId && r.horizon <= horizon)
      .forEach(r => { plantMonthMap.set(r.month, r.predicted) })

    // Aggregate lower/upper bands from rows for this plant up to horizon
    const bandMap = new Map<string, { lower: number; upper: number }>()
    forecast.rows
      .filter(r => r.plantId === plantId && r.horizon <= horizon && r.lower != null && r.upper != null)
      .forEach(r => {
        const e = bandMap.get(r.month) ?? { lower: 0, upper: 0 }
        e.lower += r.lower!
        e.upper += r.upper!
        bandMap.set(r.month, e)
      })

    return [...plantMonthMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, predicted]) => {
        const band = bandMap.get(month)
        return {
          month,
          predicted,
          lower: band?.lower ?? predicted,
          upper: band?.upper ?? predicted,
          // Recharts Area needs [lower, upper] as a range
          band: band ? [band.lower, band.upper] as [number, number] : [predicted, predicted] as [number, number],
        }
      })
  }, [forecast, plant, horizon])

  // Backtest chart data: byPlantMonth
  const backtestChartData = useMemo(() => {
    if (!holdout) return []
    const plantId = plant === 'ALL_PLANTS' ? 'HZL_DEMO_01' : plant
    return holdout.byPlantMonth
      .filter(r => r.plantId === plantId)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(r => ({ month: r.month, actual: r.actual, predicted: r.predicted }))
  }, [holdout, plant])

  const displayPlant = plant === 'ALL_PLANTS' ? 'HZL_DEMO_01' : plant
  const { grid } = useChartColors()

  // Months covered by the selected horizon
  const horizonMonths = useMemo(() => {
    if (!forecast) return ''
    const months = forecastChartData.map(r => r.month)
    if (months.length === 0) return ''
    return `${fmtMonth(months[0])} – ${fmtMonth(months[months.length - 1])}`
  }, [forecast, forecastChartData])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-border-light dark:border-border-dark">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Demand Forecast</h1>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-sm p-1">
          {(['forecast', 'backtest'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-3 py-1.5 text-sm font-medium rounded-sm transition-colors',
                tab === t ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              )}>
              {t === 'forecast' ? 'Future Forecast' : '⚗ Backtest (held-out)'}
            </button>
          ))}
        </div>
      </div>

      {/* Model info card */}
      {holdout && (
        <div className="card p-4 flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-accent/10 flex items-center justify-center">
              <Brain size={18} className="text-accent" />
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Best Model</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">WeightedEnsemble</div>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">WQL Score</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">{holdout.metric.value.toFixed(3)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Backtest MAE</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">{holdout.error.mae.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Backtest WAPE</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">{(holdout.error.wape * 100).toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Series</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">5,960</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Forecast Horizon</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">12 months</div>
          </div>
          {forecast && (
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Covers</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">{forecast.forecastFrom} → {forecast.forecastTo}</div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {holdout && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <BarChart2 size={14} /> Model Leaderboard (WQL — lower is better)
          </h3>
          <div className="space-y-2">
            {holdout.leaderboard.slice(0, 5).map((m, i) => (
              <div key={m.model} className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 w-4">{i + 1}</span>
                <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{m.model}</span>
                <div className="flex-1 max-w-[200px] bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div className="bg-accent h-2 rounded-full" style={{ width: `${Math.min(100, (1 / m.metric) * 80)}%` }} />
                </div>
                <span className="text-xs font-mono text-slate-500 w-16 text-right">{m.metric.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'forecast' && (
        <div className="card p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Net Consumption Forecast — {displayPlant}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {horizonMonths} · {HORIZON_LABELS[horizon]} horizon · Aggregated across all materials · Shaded band = 10–90% prediction interval
              </p>
            </div>
            {/* Horizon selector with descriptive labels */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-sm p-1" role="group" aria-label="Forecast horizon">
              {([3, 6, 12] as const).map(h => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  aria-pressed={horizon === h}
                  title={`Show ${HORIZON_LABELS[h]} forecast (${h} months ahead)`}
                  className={cn('px-3 py-1.5 text-xs font-medium rounded-sm transition-colors',
                    horizon === h
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  )}>
                  {HORIZON_LABELS[h]}
                </button>
              ))}
            </div>
          </div>

          {fcLoading ? (
            <div className="skeleton h-72" />
          ) : forecastChartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No forecast data for {displayPlant}</p>
              </div>
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={fmtMonth} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmtNum(v, 0)} />
                  <Tooltip
                    content={({ active, payload }) => active && payload?.length ? (
                      <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded px-3 py-2 text-xs shadow-md">
                        <div className="text-slate-500 mb-1 font-medium">{fmtMonth(payload[0].payload.month)}</div>
                        <div className="flex items-center gap-2">
                          <span style={{ color: '#2563EB' }}>●</span>
                          <span>Forecast: <strong>{fmtNum(payload[0].payload.predicted, 1)}</strong></span>
                        </div>
                        {payload[0].payload.lower !== payload[0].payload.predicted && (
                          <div className="text-slate-400 mt-1">
                            Band: {fmtNum(payload[0].payload.lower, 1)} – {fmtNum(payload[0].payload.upper, 1)}
                          </div>
                        )}
                      </div>
                    ) : null}
                  />
                  {/* 10–90% prediction band */}
                  <Area
                    type="monotone"
                    dataKey="band"
                    fill="#2563EB"
                    fillOpacity={0.12}
                    stroke="none"
                    name="10–90% band"
                    legendType="none"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#2563EB' }}
                    name="Forecast"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {forecast && (
            <div className="mt-3 flex items-start gap-2 text-xs text-slate-400 dark:text-slate-500">
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              <p className="leading-relaxed">{forecast.note}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'backtest' && (
        <div className="card p-4">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                ⚗ Backtest — Held-out Months (Actual vs Predicted)
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Not a forecast
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Model predictions on the last 12 months held out from training — used to measure accuracy only. This is <strong>not</strong> a forecast of future demand.
            </p>
          </div>

          {hoLoading ? (
            <div className="skeleton h-72" />
          ) : backtestChartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-slate-400">
              <p className="text-sm">No backtest data for {displayPlant}</p>
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={backtestChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={fmtMonth} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmtNum(v, 0)} />
                  <Tooltip
                    content={({ active, payload }) => active && payload ? (
                      <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded px-3 py-2 text-xs shadow-md">
                        <div className="text-slate-500 mb-1 font-medium">{fmtMonth(payload[0]?.payload.month)}</div>
                        {payload.map(p => (
                          <div key={p.name} className="flex items-center gap-2">
                            <span style={{ color: p.color }}>●</span>
                            <span>{p.name}: <strong>{fmtNum(p.value as number, 1)}</strong></span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} name="Actual" />
                  <Line type="monotone" dataKey="predicted" stroke="#2563EB" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Predicted (backtest)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {holdout && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-sm">
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{holdout.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
