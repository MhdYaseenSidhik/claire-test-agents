export interface Plant { plantId: string; name: string; type: string; region: string }
export interface MaterialGroup { code: string; name: string }
export interface CriticalityRef { code: string; name: string }
export interface MaterialType { code: string; name: string }
export interface Dims { plants: Plant[]; materialGroups: MaterialGroup[]; criticality: CriticalityRef[]; movementClasses: string[]; inventoryStatuses: string[]; materialTypes?: MaterialType[] }
export interface KpiCatalogEntry { code: string; label: string; uom: string; direction: string; definition: string }
export interface KpiRow { month: string; plantId: string; kpiCode: string; value: number; scenario: string }
export interface Kpis { catalog: KpiCatalogEntry[]; rows: KpiRow[] }
export interface InvSummaryRow { plantId: string; materialGroup: string; materialType: string; criticality: string; movementClass: string; inventoryStatus: string; abcClass: string; materials: number; availableQty: number; valueInr: number }
export interface InvSummary { asOf: string; rows: InvSummaryRow[] }
export interface MaterialRow { materialId: string; plantId: string; description: string; materialGroup: string; materialType: string; criticality: string; abcClass: string; xyzClass: string; movementClass: string; inventoryStatus: string; availableQty: number; valueInr: number; daysOnHand: number; daysSinceLastConsumption: number; safetyStockQty: number; reorderPointQty: number; maxStockQty: number; trailing12mDemandQty: number }
export interface Materials { asOf: string; rows: MaterialRow[] }
export interface ReorderRow { recommendationId: string; materialId: string; plantId: string; priority: string; recommendedPrDate: string; recommendedQty: number; estimatedValueInr: number; availableQty: number; openPrQty: number; openPoQty: number; safetyStockQty: number; reorderPointQty: number; reason: string; shutdownId: string | null; materialType?: string; materialGroup?: string; criticality?: string }
export interface Reorder { asOf: string; rows: ReorderRow[] }
export interface PlanVsActualRow { month: string; plantId: string; materialGroup: string; materialType: string; shutdownDriven: boolean; planValueInr: number; actualPoValueInr: number; actualGrValueInr: number; varianceInr: number; variancePct: number }
export interface PlanVsActual { rows: PlanVsActualRow[] }
export interface ForecastByPlantMonth { plantId: string; month: string; horizon: number; predicted: number }
export interface ForecastRow { seriesId: string; materialId: string; plantId: string; month: string; horizon: number; predicted: number; lower: number | null; upper: number | null }
export interface Forecast { available: boolean; reason: string | null; kind: string; experimentId: string; assetId: string; predictionLength: number; forecastFrom: string; forecastTo: string; horizons: number[]; note: string; byPlantMonth: ForecastByPlantMonth[]; rows: ForecastRow[] }
export interface HoldoutByPlantMonth { plantId: string; month: string; actual: number; predicted: number }
export interface ForecastHoldout { kind: string; note: string; experimentId: string; predictionLength: number; metric: { name: string; value: number }; error: { mae: number; wape: number }; leaderboard: { model: string; metric: number }[]; byPlantMonth: HoldoutByPlantMonth[]; series: any[] }
export interface Manifest { schemaVersion: number; generatedAt: string; asOf: string; disclaimer: string; backcastIncluded: boolean; files: any[]; forecast: { experimentId: string; experimentCreatedAt: string; bestModel: string; metric: { name: string; value: number }; backtestError: { mae: number; wape: number }; forecastAssetId: string; forecastFrom: string; forecastTo: string } }
export type Page = 'overview' | 'kpis' | 'inventory' | 'replenishment' | 'forecast' | 'plan'
export interface Filters { plant: string; materialType: string; materialGroup: string; criticality: string; monthFrom: string; monthTo: string }
