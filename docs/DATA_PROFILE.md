# Data Profile — HZL Inventory Dashboard

Generated: 2026-11-18 | asOf: 2025-12-31 | schemaVersion: 2 | backcastIncluded: true

## Files

| File | Rows | Size | Source |
|------|------|------|--------|
| dims.json | 6 plants + dims | 1 KB | DIM_PLANT, REF_MATERIAL_GROUP, REF_CRITICALITY, INVENTORY_CLASSIFICATION |
| kpis.json | 5,075 | 613 KB | INVENTORY_KPI_MONTHLY |
| inventory_summary.json | 2,674 | 542 KB | INVENTORY_CLASSIFICATION × DIM_MATERIAL |
| materials.json | 34,717 | 14.6 MB | INVENTORY_CLASSIFICATION × DIM_MATERIAL |
| reorder.json | 3,916 | 2.2 MB | REORDER_RECOMMENDATION |
| plan_vs_actual.json | 5,843 | 1.4 MB | BUSINESS_PLAN_VS_ACTUAL |
| forecast_holdout.json | 71,520 | 11.4 MB | Experiment 6afd7b3f18e99c2f5d00cece backtest |
| forecast.json | 71,520 | 11.9 MB | Forecast asset 6afd807018e99c2f5d00cf0e |
| manifest.json | — | 4 KB | Generated |

## Key Dimensions
- **Plants**: HZL_DEMO_01 (MINE), HZL_DEMO_02 (SMELTER), HZL_DEMO_03 (MINE), HZL_DEMO_04 (CONCENTRATOR), HZL_DEMO_05 (SMELTER), HZL_DEMO_06 (CAPTIVE_POWER_PLANT)
- **Material Types**: ZSPR (Spare Parts), ZSPN (Spare Parts Non-Stock)
- **KPI Codes**: 25 codes including GROSS_INVENTORY_VALUE_INR, INVENTORY_TURNOVER_RATIO, CRITICAL_SPARE_AVAILABILITY_PCT, DAYS_ON_HAND, STOCKOUT_MATERIAL_COUNT, EXCESS_INVENTORY_VALUE_INR, POTENTIAL_INVENTORY_REDUCTION_INR, WORKING_CAPITAL_OPPORTUNITY_INR
- **Date Range**: 2023-01 to 2025-12 (history); 2026-01 to 2026-12 (forecast)
- **Backcast**: 2023 is a fabricated backcast year (IS_BACKCAST_PERIOD = 'Y')

## Forecast Model
- **Experiment**: 6afd7b3f18e99c2f5d00cece
- **Created**: 2026-11-18T10:17:35.225Z
- **Best Model**: WeightedEnsemble (WQL 0.887)
- **Leaderboard**: WeightedEnsemble 0.887 | DirectTabular 0.908 | ETS 1.069
- **Backtest MAE**: 4.49 | **WAPE**: 104.8%
- **Series**: 5,960 (material × plant)
- **Forecast Asset**: 6afd807018e99c2f5d00cf0e

## Data Quality Notes
- ALL_PLANTS aggregate row present in kpis.json (intentional per contract)
- materials.json is 14.6 MB — loaded lazily on Inventory Health page
- forecast.json is 11.9 MB — byPlantMonth used for charts (12 rows), full rows for material drill-down
- WAPE > 100% indicates high intermittent demand (many zero-consumption months)
