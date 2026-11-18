# Data Profile — HZL Inventory Dashboard

Generated: 2026-11-18 | Schema version: 3 (dims.json updated) / 2 (manifest.json)  
Data as of: 2025-12-31 | Backcast included: 2023-01 → 2025-12

---

## manifest.json

| Field | Value |
|-------|-------|
| schemaVersion | 2 (dims.json updated to v3 with materialTypes) |
| generatedAt | 2026-11-18T10:39:44.331Z |
| asOf | 2025-12-31 |
| backcastIncluded | true |
| forecastFrom | 2026-01 |
| forecastTo | 2026-12 |
| bestModel | WeightedEnsemble |
| backtestError.mae | 4.4888 |
| backtestError.wape | 1.048 (104.8%) |

---

## dims.json

| Dimension | Count |
|-----------|-------|
| plants | 6 (HZL_DEMO_01 … HZL_DEMO_06) |
| materialGroups | 12 |
| criticality | 3 (DESIRABLE, ESSENTIAL, VITAL) |
| movementClasses | 4 |
| inventoryStatuses | 8 |
| **materialTypes** | **2 (ZSPN, ZSPR)** |

### Material Types
| Code | Name |
|------|------|
| ZSPN | Spare Parts Non-Stock (ZSPN) |
| ZSPR | Spare Parts (ZSPR) |

---

## kpis.json — 5,075 rows

| Field | Value |
|-------|-------|
| Rows | 5,075 |
| Catalog entries | 25 KPIs |
| Month range | 2023-01 → 2025-12 (36 months) |
| Plants | ALL_PLANTS + 6 real plants = 7 |
| Scenarios | Actual |

**Note:** ALL_PLANTS rows are portfolio-level values; never sum plant rows for a KPI.

---

## inventory_summary.json — 2,674 rows

| Field | Value |
|-------|-------|
| Rows | 2,674 |
| Dimensions | plant × materialGroup × criticality × movementClass × inventoryStatus × abcClass |
| Plants | 6 (no ALL_PLANTS) |
| materialType present | ❌ (not in this file; join via materials.json) |

---

## materials.json — 34,717 rows

| Field | Value |
|-------|-------|
| Rows | 34,717 |
| Plants | 6 |
| materialType present | ✅ |

### Material type distribution
| Type | Count | Groups |
|------|-------|--------|
| ZSPR | 21,585 | 12 |
| ZSPN | 13,132 | 12 |

### Material group distribution (top 5)
| Group | Count |
|-------|-------|
| BEARING_COMPONENTS | 9,805 |
| MECHANICAL | 8,950 |
| CONVEYOR_COMPONENTS | 4,325 |
| SAFETY | 2,946 |
| PUMP_COMPONENTS | 2,007 |

---

## reorder.json — 3,916 rows

| Field | Value |
|-------|-------|
| Rows | 3,916 |
| Plants | 6 |
| materialType present | ❌ (join via materials.json on materialId) |
| Priorities | CRITICAL, HIGH, MEDIUM, LOW |

---

## plan_vs_actual.json — 5,843 rows

| Field | Value |
|-------|-------|
| Rows | 5,843 |
| Plants | 6 |
| materialType present | ✅ (ZSPN: 2,853 / ZSPR: 2,990) |
| Month range | 2024-01 → 2025-12 |

---

## forecast.json — 71,520 rows

| Field | Value |
|-------|-------|
| Rows | 71,520 (material × month × horizon) |
| byPlantMonth rows | 12 (6 plants × 2 months per horizon) |
| available | true |
| horizons | 3, 6, 12 |
| forecastFrom | 2026-01 |
| forecastTo | 2026-12 |
| materialGroup present | ❌ (join via materials.json on materialId) |
| materialType present | ❌ (join via materials.json on materialId) |
| Band | lower / upper (10–90%) per row |

---

## forecast_holdout.json — 71,520 series rows

| Field | Value |
|-------|-------|
| Series rows | 71,520 |
| byPlantMonth rows | 12 |
| Month range | 2025-02 → 2026-01 (held-out months) |
| materialGroup present | ❌ (join via materials.json) |
| Kind | backtest (held-out months — NOT a forecast) |
| MAE | 4.4888 |
| WAPE | 1.048 |

---

## GAPS

1. **inventory_summary.json lacks materialType** — cannot break down inventory status/movement charts by material type without a join to materials.json. The dashboard joins via materialId where possible, but inventory_summary is pre-aggregated without materialType. Workaround: show type breakdown from materials.json value sums.
2. **reorder.json lacks materialType** — joined at runtime from materials.json (materialId lookup). This is an in-memory join; performance is acceptable for 3,916 rows.
3. **forecast.json rows lack materialGroup/materialType** — joined at runtime from materials.json. byPlantMonth has no band (band only on material-level rows).
4. **forecast_holdout.json series lack materialGroup/materialType** — same join approach.
5. **manifest.json schemaVersion is 2** — dims.json has been updated to include materialTypes (schemaVersion 3 contract) but manifest.json still reports version 2. Dashboard handles this gracefully.
6. **byPlantMonth forecast has only 12 rows** (6 plants × 2 months) — insufficient for a full 12-month plant-level chart. Dashboard uses material-level rows aggregated by plant for the forecast chart.
