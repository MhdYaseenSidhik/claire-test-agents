# Dashboard Plan — HZL Inventory Control

## Pages

### 1. Overview
- Hero KPI cards: Gross Inventory, Turnover Ratio, Critical Availability, Days on Hand, Stockouts, Excess Inventory
- Sparkline trend per KPI
- Opportunity cards: Potential Reduction, Working Capital Opportunity
- Disclaimer banner

### 2. KPI Scorecard
- Searchable table of all 25 KPI codes
- Latest value, previous month, % delta with direction indicator
- Click row to expand trend chart (line chart over selected month range)

### 3. Inventory Health (Drill-down)
- Breadcrumb: All Plants → Plant → Material Group → Materials
- Status breakdown bar chart (by INR value)
- Movement class breakdown bar chart
- Drill-down table at each level
- Material list with pagination (50 per page), lazy-loaded

### 4. Replenishment
- Priority summary cards (CRITICAL / HIGH / MEDIUM / LOW)
- Searchable, filterable table of 3,916 recommendations
- Columns: Priority, Material, Plant, Qty, Est. Value, PR Date, Available, Safety Stock, Reason

### 5. Demand Forecast
- Tabs: Future Forecast | Backtest
- Horizon selector: 3M / 6M / 12M
- Model info card: WeightedEnsemble, WQL 0.887, MAE 4.49, WAPE 104.8%
- Leaderboard (top 5 models)
- Future: line chart of byPlantMonth predicted (2026-01 to 2026-12)
- Backtest: actual vs predicted line chart (held-out months)

### 6. Plan vs Actual
- Summary: Plan, Actual PO, Actual GR, Variance
- Toggle: By Month | By Material Group
- Grouped bar chart
- Variance table

## Global Filters
- Plant (single select, ALL_PLANTS for KPIs)
- Material Group
- Criticality
- Month range (from/to)

## GAPS
1. **Forecast confidence bands not shown in byPlantMonth chart** — quantiles cannot be summed across series; only mean is available at plant level. Material-level bands available in forecast.json rows but not surfaced in the UI.
2. **No cross-plant comparison** — the forecast covers only HZL_DEMO_01 (training scope); other plants show no forecast data.
3. **WAPE > 100%** — intermittent demand (many zero months) makes WAPE unreliable; MAE is the more meaningful metric for this dataset.
4. **materials.json load time** — 14.6 MB file takes 2–5 seconds on first load; no server-side pagination available (static JSON).
5. **No real-time data** — all data is a static snapshot as of 2025-12-31; no live SAP connection in the dashboard.
6. **2023 backcast** — the 2023 data is fabricated; trend charts that include 2023 may show artificial patterns.
7. **No material search across all plants** — the material drill-down requires selecting a plant first.
8. **No export** — no CSV/Excel download from the dashboard tables.
