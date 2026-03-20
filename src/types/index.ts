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
}

export interface ItemInfo {
  id: number
  name: string
  icon: string
}

export interface SpellInfo {
  id: number
  name: string
  icon: string
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
    statShards: number[]
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
      getDDragonVersion: () => Promise<string>
      getAssetUrl: (type: string, key: string) => Promise<string>
    }
  }
}
