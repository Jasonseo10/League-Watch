export interface ChampionInfo {
  championId: number
  championName: string
  championSlug: string
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
      onBuildsReceived: (callback: (data: BuildsPayload) => void) => void
      onChampSelectEnded: (callback: () => void) => void
      onChampSelectError: (callback: (data: { message: string }) => void) => void
      onVisibilityChanged: (callback: (visible: boolean) => void) => void
      onInteractableChanged: (callback: (interactable: boolean) => void) => void
      setInteractable: (value: boolean) => void
      pushRunes: (runes: any) => Promise<{ success: boolean; error?: string }>
      pushItems: (items: any) => Promise<{ success: boolean; error?: string }>
      pushSpells: (spells: any) => Promise<{ success: boolean; error?: string }>
      getDDragonVersion: () => Promise<string>
      getAssetUrl: (type: string, key: string) => Promise<string>
    }
  }
}
