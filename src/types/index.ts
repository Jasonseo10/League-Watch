export interface ChampionInfo {
  championId: number
  championName: string
  championSlug: string
  championDDragonId: string
  role: string
}

export interface RuneInfo {
  id: number
  name: string
  icon: string
  description: string
}

export interface ItemInfo {
  id: number
  name: string
  icon: string
  description: string
}

export interface SpellInfo {
  id: number
  name: string
  icon: string
  description: string
}

export interface AbilityData {
  key: string    // 'P', 'Q', 'W', 'E', 'R'
  name: string
  description: string
  icon: string
}

export interface ChampionAbilities {
  passive: AbilityData
  spells: AbilityData[]  // Q, W, E, R
}

export interface BuildData {
  name: string
  winRate: string
  pickRate: string
  games: string
  role: string

  runes: {
    primaryTree: string
    primaryTreeId: number
    subTree: string
    subTreeId: number
    keystone: RuneInfo
    primaryPerks: RuneInfo[]
    subPerks: RuneInfo[]
    statShards: RuneInfo[]
    allPerkIds: number[]
  }

  items: {
    starting: ItemInfo[]
    core: ItemInfo[]
    boots: ItemInfo | null
    fullBuild: ItemInfo[]
    fourthItemOptions: ItemInfo[]
    fifthItemOptions: ItemInfo[]
    sixthItemOptions: ItemInfo[]
  }

  skills: {
    order: string[]
    levelOrder: string[]
  }

  summonerSpells: SpellInfo[]
}

export interface BuildsPayload {
  champion: ChampionInfo
  builds: BuildData[]
}

export interface AllRoleBuildsPayload {
  champion: ChampionInfo
  buildsByRole: Record<string, BuildData[]>
  defaultRole: string
  availableRoles: string[]
  rank: string
}

export interface RankOption {
  label: string
  code: string
}

export interface QueueOption {
  label: string
  code: string
}

export interface RegionOption {
  label: string
  code: string
}

export interface CounterChamp {
  championKey: number
  championName: string
  championDDragonId: string
}

export interface TierEntry {
  tier: 'S' | 'A' | 'B' | 'C' | 'D'
  roleCode: string
  role: string
  championKey: number
  championName: string
  championDDragonId: string
  winRate: string
  winRateNum: number
  pickRate: string
  banRate: string
  games: number
  counters: CounterChamp[]
}

export interface LCUStatus {
  connected: boolean
  message: string
}

// Extend Window for the preload API
declare global {
  interface Window {
    leagueWatch: {
      onLCUStatus: (callback: (status: LCUStatus) => void) => void
      onChampionSelected: (callback: (data: ChampionInfo) => void) => void
      onBuildsReceived: (callback: (data: AllRoleBuildsPayload) => void) => void
      onChampSelectEnded: (callback: () => void) => void
      onChampSelectError: (callback: (data: { message: string }) => void) => void
      onVisibilityChanged: (callback: (visible: boolean) => void) => void
      pushRunes: (runes: any) => Promise<{ success: boolean; error?: string }>
      pushItems: (items: any) => Promise<{ success: boolean; error?: string }>
      pushSpells: (spells: any) => Promise<{ success: boolean; error?: string }>
      requestRankChange: (championSlug: string, rank: string) => Promise<void>
      getRankOptions: () => Promise<RankOption[]>
      getStatus: () => Promise<LCUStatus>
      getDDragonVersion: () => Promise<string>
      getAssetUrl: (type: string, key: string) => Promise<string>
      getChampionAbilities: (ddragonId: string) => Promise<ChampionAbilities | null>
      getTierList: (rank: string, queue: string, region: string) => Promise<TierEntry[]>
      getCounters: (champKey: number, roleCode: string, rank: string, queue: string, region: string) => Promise<CounterChamp[]>
      getQueueOptions: () => Promise<QueueOption[]>
      getRegionOptions: () => Promise<RegionOption[]>
      setWindowWidth: (width: number) => Promise<void>
    }
  }
}
