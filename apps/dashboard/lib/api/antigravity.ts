// Antigravity API stub — typed surface area for the dashboard.
// Real backend wiring lands in a separate phase; this file gives tsc
// enough types so consumers compile.

export interface AgencyDNA {
  archetype: string
  positioning: string
  signature_traits: string[]
}

export interface ClientMagnetStats {
  leads_24h: number
  qualified_24h: number
  conversion_rate: number
}

export interface RevenueEngineStats {
  arr: number
  mrr: number
  net_revenue_retention: number
  active_subscriptions: number
}

export interface ContentFactoryStats {
  pieces_published_30d: number
  avg_engagement: number
  top_channel: string
}

export interface FranchiseStats {
  active_locations: number
  pipeline_locations: number
  avg_revenue_per_location: number
}

export interface VCMetrics {
  fund_size_usd: number
  deployed_usd: number
  irr: number
}

export interface DataMoatStats {
  proprietary_records: number
  unique_signals: number
  external_apis_blocked: number
}

export interface AllModules {
  dna: AgencyDNA | null
  leads: ClientMagnetStats | null
  revenue: RevenueEngineStats | null
  content: ContentFactoryStats | null
  franchise: FranchiseStats | null
  vc: VCMetrics | null
  moat: DataMoatStats | null
}

async function notImplemented<T>(): Promise<T> {
  throw new Error('antigravityAPI not yet wired to a backend')
}

export const antigravityAPI = {
  getAllModules: () => notImplemented<AllModules>(),
  getAgencyDNA: () => notImplemented<AgencyDNA>(),
  getClientMagnetStats: () => notImplemented<ClientMagnetStats>(),
  getRevenueEngineStats: () => notImplemented<RevenueEngineStats>(),
  getContentFactoryStats: () => notImplemented<ContentFactoryStats>(),
  getFranchiseStats: () => notImplemented<FranchiseStats>(),
  getVCMetrics: () => notImplemented<VCMetrics>(),
  getDataMoatStats: () => notImplemented<DataMoatStats>(),
  resetDemoData: () => notImplemented<void>(),
}
