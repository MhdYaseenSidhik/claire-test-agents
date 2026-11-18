# Dashboard Plan — HZL Inventory Dashboard (v2, schemaVersion 3)

## Global Filters (URL query string)

| Filter | Source | Applies to |
|--------|--------|-----------|
| plant | dims.plants + ALL_PLANTS | All screens |
| materialType | dims.materialTypes (ZSPR/ZSPN) | All screens where meaningful |
| materialGroup | dims.materialGroups | Inventory, Replenishment, Plan vs Actual, Forecast |
| criticality | dims.criticality | Inventory, KPI (label only) |
| monthFrom / monthTo | 2023-01 → 2026-12 | All screens |

**KPI rule:** When materialType, materialGroup or criticality filter is active, KPI tiles and scorecard keep plant-level values and display a "Plant-level data · not filtered by material" label.

---

## Screen 1 — Overview (Module A)

**Purpose:** Single-glance portfolio health with KPI tiles, material type breakdown, and top alerts.

### Tiles (from kpis.json, plant filter only)
- Gross Inventory Value (INR) — sparkline, MoM delta
- Inventory Turnover Ratio — sparkline, MoM delta
- Critical Spare Availability (%) — sparkline, MoM delta
- Days on Hand — sparkline, MoM delta
- Stockout Material Count — sparkline, MoM delta
- Excess Inventory Value (INR) — sparkline, MoM delta
- Potential Inventory Reduction (INR) — accent card
- Working Capital Opportunity (INR) — accent card

**Plant-level label:** shown on all tiles when materialType/materialGroup/criticality filter is active.

### Material Type Breakdown (NEW — from materials.json)
- Two cards side by side: ZSPR and ZSPN
- Each shows: material count, total value (INR), % of portfolio
- Filtered by plant filter

### Loading: skeleton cards | Empty: "No data for selected plant/period" | Error: inline message

---

## Screen 2 — KPI Scorecard

**Purpose:** Full catalog of 25 KPIs with trend, MoM and YoY change.

### Elements
- Search box
- Plant-level label banner when any material filter is active (materialType/materialGroup/criticality)
- Table: KPI name, definition, latest value, prev month, Δ%, UOM — coloured by direction
- Click row → expand trend chart (12-month line)

**Binding:** kpis.json, filtered by plant only. Material filters show label, do not recompute.

---

## Screen 3 — Inventory Health & Drill-down

**Purpose:** Value and count by classification dimensions; drill plant → group → material.

### Summary cards
- Total Value, Materials count, Excess Value, Non-Moving Value

### Material Type Breakdown (NEW — from materials.json)
- Bar chart: value by material type (ZSPR vs ZSPN)
- Count by material type

### Charts
- Value by Inventory Status (horizontal bar, STATUS_COLORS)
- Value by Movement Class (horizontal bar, MOVE_COLORS)

### Drill-down table
- Level 1 (plant): plant name, materials count, value — click to drill
- Level 2 (group): material group, materials count, value — click to drill
- Level 3 (material): material list with type, criticality, ABC, movement, status, value, days on hand

**Filters applied:** plant, materialType (NEW), materialGroup, criticality

---

## Screen 4 — Replenishment

**Purpose:** Reorder recommendations by priority with material type column and grouping.

### Summary cards (by priority)
- CRITICAL / HIGH / MEDIUM / LOW — count + value

### Material Type Totals (NEW)
- Two summary cards: ZSPR total value + count, ZSPN total value + count
- Joined from materials.json on materialId

### Filters
- Search (materialId / reason)
- Priority selector
- **Material Type selector (NEW)** — ZSPR / ZSPN / All

### Table columns
- Priority, Material, **Type (NEW)**, Plant, Recommended Qty, Est. Value, PR Date, Available, Safety Stock, Reason, Shutdown flag

### Grouping toggle (NEW)
- By Priority (default) | By Material Type — shows subtotals per group

---

## Screen 5 — Demand Forecast (Module B)

**Purpose:** Future forecast (2026-01 → 2026-12) and backtest panel.

### Model info card
- Best model, WQL, MAE, WAPE, series count, horizon, experiment ID

### Forecast tab
- **Horizon selector:** 3M / 6M / 12M (only horizons in forecast.json.horizons)
- **Months covered label:** "Forecast: {forecastFrom} → {forecastTo}" (from manifest.json)
- **Multi-plant notice (NEW):** when plant = ALL_PLANTS, show "Showing HZL_DEMO_01 — only plant-level aggregates available for All Plants view"
- Chart: net consumption forecast by month for selected plant, with 10–90% band from rows (lower/upper)
- **Material type totals (NEW):** table showing ZSPR vs ZSPN predicted total for each month (joined from materials.json)
- **Material group totals (NEW):** bar chart of predicted total by material group (joined from materials.json)
- Material-level table: top 20 materials by predicted total, with lower/upper band

### Backtest tab (always labelled as backtest)
- Header: "Backtest — Held-out Months (Actual vs Predicted) — NOT a forecast"
- Chart: actual vs predicted line chart
- **Material type totals (NEW):** ZSPR vs ZSPN actual and predicted per month
- **Material group totals (NEW):** bar chart of actual vs predicted by group
- Error metrics: MAE, WAPE

**Binding:** forecast.json (rows + byPlantMonth), forecast_holdout.json (series + byPlantMonth), joined to materials.json for type/group.

---

## Screen 6 — Plan vs Actual

**Purpose:** Plan, PO and GR value and variance by month, plant, material group and material type.

### Summary cards
- Plan Value, Actual PO, Actual GR, Variance

### Material Type Totals (NEW)
- Two cards: ZSPR and ZSPN — plan, PO, GR, variance each

### Group-by toggle
- By Month | By Material Group | **By Material Type (NEW)**

### Chart
- Grouped bar: Plan / Actual PO / Actual GR by selected grouping

### Table
- Columns: Label, Plan, Actual PO, Actual GR, Variance, Var%
- When grouped by type: shows ZSPR and ZSPN rows with totals

**Filters applied:** plant, materialType (NEW), materialGroup, monthFrom/monthTo

---

## GAPS

1. **inventory_summary.json lacks materialType** — type breakdown on Inventory Health uses materials.json value sums, not the pre-aggregated summary. Status/movement charts cannot be broken down by type without a full join.
2. **reorder.json lacks materialType** — joined at runtime from materials.json; materialType filter works but requires in-memory lookup.
3. **forecast.json rows lack materialGroup/materialType** — joined at runtime from materials.json for type/group breakdowns.
4. **byPlantMonth has only 12 rows** — plant-level forecast chart uses material-level rows aggregated by plant+month+horizon.
5. **manifest.json schemaVersion 2** — dims.json updated to v3 contract; dashboard handles gracefully.
6. **No YoY comparison on KPI scorecard** — kpis.json has data from 2023-01; YoY delta is computable but not yet implemented.
