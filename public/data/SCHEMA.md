# DATA CONTRACT (schemaVersion 2)

## manifest.json
`{schemaVersion: 2, generatedAt: ISO timestamp, asOf: YYYY-MM-DD, disclaimer: string, backcastIncluded: boolean, files: [{name, rows, generatedAt, source: {integrationId, syncId, assetId, sql}}], forecast: null | {experimentId, experimentCreatedAt, problemType, predictionLength, seriesCount, bestModel, metric: {name, value}, backtestError: {mae, wape}, verdict, verdictReasons: [string], forecastAssetId, forecastFrom: YYYY-MM, forecastTo: YYYY-MM}}`

## dims.json
`{plants: [{plantId, name, type, region}], materialGroups: [{code, name}], criticality: [{code, name}], movementClasses: [string], inventoryStatuses: [string]}`
Sources: DIM_PLANT, REF_MATERIAL_GROUP, REF_CRITICALITY, INVENTORY_CLASSIFICATION distinct values.

## kpis.json
`{catalog: [{code, label, uom, direction, definition}], rows: [{month, plantId, kpiCode, value, scenario}]}`
Source: INVENTORY_KPI_MONTHLY. ALL_PLANTS rows are kept for portfolio view.
direction: lower_is_better | higher_is_better | neutral

## inventory_summary.json
`{asOf, rows: [{plantId, materialGroup, criticality, movementClass, inventoryStatus, abcClass, materials, availableQty, valueInr}]}`
Source: INVENTORY_CLASSIFICATION joined to DIM_MATERIAL, grouped. Real plants only.

## materials.json
`{asOf, rows: [{materialId, plantId, description, materialGroup, materialType, criticality, abcClass, xyzClass, movementClass, inventoryStatus, availableQty, valueInr, daysOnHand, daysSinceLastConsumption, safetyStockQty, reorderPointQty, maxStockQty, trailing12mDemandQty}]}`
Source: INVENTORY_CLASSIFICATION joined to DIM_MATERIAL. Real plants only.

## reorder.json
`{asOf, rows: [{recommendationId, materialId, plantId, priority, recommendedPrDate, recommendedQty, estimatedValueInr, availableQty, openPrQty, openPoQty, safetyStockQty, reorderPointQty, reason, shutdownId}]}`
Source: REORDER_RECOMMENDATION. Real plants only.

## plan_vs_actual.json
`{rows: [{month, plantId, materialGroup, materialType, shutdownDriven, planValueInr, actualPoValueInr, actualGrValueInr, varianceInr, variancePct}]}`
Source: BUSINESS_PLAN_VS_ACTUAL. Real plants only.

## forecast_holdout.json
`{kind: "backtest", note, experimentId, predictionLength, metric: {name, value}, error: {mae, wape}, leaderboard: [{model, metric}], byPlantMonth: [{plantId, month, actual, predicted}], series: [{seriesId, materialId, plantId, month, actual, predicted, lower, upper}]}`
Predictions for held-out months the model did not see; NOT a forecast of future months.

## forecast.json
`{available: boolean, reason: string|null, kind: "forecast", experimentId, assetId, predictionLength, forecastFrom: YYYY-MM, forecastTo: YYYY-MM, horizons: [3,6,12], note, byPlantMonth: [{plantId, month, horizon, predicted}], rows: [{seriesId, materialId, plantId, month, horizon, predicted, lower, upper}]}`
horizon = step after last history month (1..predictionLength). lower/upper = 0.1/0.9 quantiles.
