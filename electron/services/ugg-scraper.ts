import axios from 'axios'
import { DataDragonService } from './ddragon'

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

export interface AllRoleBuilds {
  buildsByRole: Record<string, BuildData[]>
  defaultRole: string
  availableRoles: string[]
  rank: string
}

// u.gg role codes used in their API
const UGG_ROLE_CODES: Record<string, string> = {
  'jungle':  '1',
  'support': '2',
  'adc':     '3',
  'top':     '4',
  'mid':     '5',
}

// Region: World (12) covers all regions — most data
const DEFAULT_REGION = '12'

// Rank fallback order when requested rank has no data
const RANK_FALLBACK = ['10', '8', '17', '11', '14', '13', '16', '4', '5', '6', '7', '12', '15']

// Rank options exposed to the UI
export const RANK_OPTIONS = [
  { label: 'Emerald+',     code: '17' },
  { label: 'Platinum+',    code: '10' },
  { label: 'Diamond+',     code: '11' },
  { label: 'Master+',      code: '12' },
  { label: 'All Ranks',    code: '8'  },
  { label: 'Gold',         code: '4'  },
  { label: 'Platinum',     code: '5'  },
  { label: 'Emerald',      code: '16' },
  { label: 'Diamond',      code: '6'  },
  { label: 'Master',       code: '7'  },
  { label: 'Grandmaster',  code: '13' },
  { label: 'Challenger',   code: '14' },
] as const

const DEFAULT_RANK = '17' // Emerald+

export class UGGScraper {
  private ddragon: DataDragonService
  private rawCache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly cacheTTL = 10 * 60 * 1000 // 10 minutes

  // Metadata fetched once per session
  private currentPatch: string | null = null
  private apiVersion: string | null = null

  constructor(ddragon: DataDragonService) {
    this.ddragon = ddragon
  }

  /**
   * Fetch and cache the current u.gg patch and API version.
   */
  private async fetchMeta(): Promise<void> {
    if (this.currentPatch && this.apiVersion) return

    try {
      const [patchesRes, versionsRes] = await Promise.all([
        axios.get('https://static.bigbrain.gg/assets/lol/riot_patch_update/prod/ugg/patches.json', { timeout: 8000 }),
        axios.get('https://static.bigbrain.gg/assets/lol/riot_patch_update/prod/ugg/ugg-api-versions.json', { timeout: 8000 }),
      ])

      this.currentPatch = patchesRes.data[0] as string
      const versions = versionsRes.data
      this.apiVersion = versions[this.currentPatch]?.overview || '1.5.0'

      console.log(`[Scraper] u.gg meta: patch=${this.currentPatch}, apiVersion=${this.apiVersion}`)
    } catch (err: any) {
      console.error('[Scraper] Failed to fetch u.gg meta, using derived defaults:', err.message)
      const ddragonVersion = this.ddragon.getCurrentVersion()
      this.currentPatch = ddragonVersion.replace(/\.\d+$/, '').replace('.', '_')
      this.apiVersion = '1.5.0'
      console.log(`[Scraper] Fallback: patch=${this.currentPatch}, apiVersion=${this.apiVersion}`)
    }
  }

  /**
   * Fetch the raw API response for a champion, with caching.
   */
  private async fetchRawData(championSlug: string): Promise<{ data: any; champName: string } | null> {
    const cached = this.rawCache.get(championSlug)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`[Scraper] Raw cache hit: ${championSlug}`)
      const champion = this.ddragon.getChampionBySlug(championSlug)
      return { data: cached.data, champName: champion?.name ?? championSlug }
    }

    await this.fetchMeta()

    const champion = this.ddragon.getChampionBySlug(championSlug)
    if (!champion) {
      console.error(`[Scraper] Unknown champion slug: ${championSlug}`)
      return null
    }

    const url = `https://stats2.u.gg/lol/1.5/overview/${this.currentPatch}/ranked_solo_5x5/${champion.key}/${this.apiVersion}.json`
    console.log(`[Scraper] Fetching: ${url}`)

    try {
      const response = await axios.get(url, { timeout: 10000 })
      this.rawCache.set(championSlug, { data: response.data, timestamp: Date.now() })
      return { data: response.data, champName: champion.name }
    } catch (err: any) {
      console.error(`[Scraper] API request failed: ${err.message}`)
      return null
    }
  }

  /**
   * Get builds for ALL roles for a champion at a given rank.
   * Returns builds keyed by role, plus the most popular role.
   */
  async getAllRoleBuilds(championSlug: string, rank: string = DEFAULT_RANK): Promise<AllRoleBuilds> {
    const result = await this.fetchRawData(championSlug)
    if (!result) {
      return {
        buildsByRole: { mid: this.getFallbackBuild('mid') },
        defaultRole: 'mid',
        availableRoles: ['mid'],
        rank,
      }
    }

    const { data: rawData, champName } = result
    const buildsByRole: Record<string, BuildData[]> = {}
    const roleCounts: Record<string, number> = {}

    for (const [roleName, roleCode] of Object.entries(UGG_ROLE_CODES)) {
      // Try the requested rank first
      let buildArray = this.findBuildArrayForRank(rawData, roleCode, rank)

      // Fall back through other ranks if no data at requested rank
      if (!buildArray) {
        for (const fallbackRank of RANK_FALLBACK) {
          if (fallbackRank === rank) continue
          buildArray = this.findBuildArrayForRank(rawData, roleCode, fallbackRank)
          if (buildArray) break
        }
      }

      if (buildArray) {
        const build = this.parseBuildArray(buildArray, roleName)
        buildsByRole[roleName] = [build]
        // Use raw match count for popularity ranking
        const overallRaw = buildArray[6] || []
        roleCounts[roleName] = overallRaw[1] ?? 0
      }
    }

    // Default role = highest game count
    const defaultRole = Object.entries(roleCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'mid'

    const availableRoles = Object.keys(buildsByRole)

    console.log(`[Scraper] ${champName}: roles=[${availableRoles.join(', ')}], default=${defaultRole}, counts=${JSON.stringify(roleCounts)}`)

    return { buildsByRole, defaultRole, availableRoles, rank }
  }

  /**
   * Legacy single-role getter (kept for backward compat).
   */
  async getBuilds(championSlug: string, role: string): Promise<BuildData[]> {
    const allBuilds = await this.getAllRoleBuilds(championSlug, DEFAULT_RANK)
    return allBuilds.buildsByRole[role] || allBuilds.buildsByRole[allBuilds.defaultRole] || this.getFallbackBuild(role)
  }

  /**
   * Find build data for a specific role at a specific rank.
   */
  private findBuildArrayForRank(data: any, roleCode: string, rank: string): any[] | null {
    for (const region of [DEFAULT_REGION, '1', '2', '3']) {
      if (!data[region]) continue
      const roleEntry = data[region]?.[rank]?.[roleCode]
      if (!roleEntry) continue
      const buildDataArray = Array.isArray(roleEntry) ? roleEntry[0] : null
      if (buildDataArray && Array.isArray(buildDataArray) && buildDataArray.length > 6) {
        return buildDataArray
      }
    }
    return null
  }

  /**
   * Parse the 13-element buildDataArray from u.gg into our BuildData shape.
   *
   * Index map:
   *   [0] runes:          [wins, matches, primaryStyleId, subStyleId, [runeId×6]]
   *   [1] summonerSpells: [wins, matches, [spellId, spellId]]
   *   [2] startingItems:  [wins, matches, [itemId, ...]]
   *   [3] coreItems:      [wins, matches, [itemId, itemId, itemId]]
   *   [4] abilities:      [wins, matches, [levelOrder×18], "QWE"]
   *   [5] lateItems:      [[slot4 options], [slot5 options], [slot6 options], ...]
   *   [6] overall:        [wins, totalMatches]
   *   [8] statShards:     [wins, matches, ["5005","5008","5011"]]
   */
  private parseBuildArray(entry: any[], role: string): BuildData {
    const runesRaw   = entry[0] || []
    const spellsRaw  = entry[1] || []
    const startRaw   = entry[2] || []
    const coreRaw    = entry[3] || []
    const abilitiesRaw = entry[4] || []
    const lateRaw    = entry[5] || []
    const overallRaw = entry[6] || []
    const shardsRaw  = entry[8] || []


    // Win rate
    const wins = overallRaw[0] ?? 0
    const total = overallRaw[1] ?? 0
    const winRate = total > 0 ? `${((wins / total) * 100).toFixed(1)}%` : 'N/A'
    const games   = total > 0 ? total.toLocaleString() : 'N/A'

    // Runes
    const primaryStyleId: number = runesRaw[2] ?? 0
    const subStyleId: number     = runesRaw[3] ?? 0
    const runeIds: number[]      = runesRaw[4] ?? []

    const primaryTreeInfo = this.ddragon.getRuneById(primaryStyleId)
    const subTreeInfo     = this.ddragon.getRuneById(subStyleId)

    const trees = this.ddragon.getRuneTrees()
    const primaryTreeDef = trees.find(t => t.id === primaryStyleId)

    const keystoneIds = new Set<number>(
      (primaryTreeDef?.slots[0]?.runes ?? []).map((r: any) => r.id)
    )

    const keystoneId = runeIds.find(id => keystoneIds.has(id)) ?? runeIds[0]

    const runeSlotIndex = new Map<number, number>()
    for (const tree of trees) {
      if (!tree.slots) continue
      for (let slotIdx = 0; slotIdx < tree.slots.length; slotIdx++) {
        for (const rune of tree.slots[slotIdx].runes) {
          runeSlotIndex.set(rune.id, slotIdx)
        }
      }
    }

    const primaryPerks = runeIds
      .filter(id => id !== keystoneId && this.ddragon.getRuneById(id)?.treeName === primaryTreeInfo?.name)
      .sort((a, b) => (runeSlotIndex.get(a) ?? 99) - (runeSlotIndex.get(b) ?? 99))

    const subPerks = runeIds
      .filter(id => this.ddragon.getRuneById(id)?.treeName === subTreeInfo?.name)
      .sort((a, b) => (runeSlotIndex.get(a) ?? 99) - (runeSlotIndex.get(b) ?? 99))

    const shardIds: number[] = (shardsRaw[2] ?? []).map((s: string | number) => parseInt(String(s), 10))

    const allPerkIds = [keystoneId, ...primaryPerks, ...subPerks, ...shardIds]

    const statShards = shardIds.map(id => {
      const shard = this.ddragon.getStatShard(id)
      return { id, name: shard?.name ?? `Shard ${id}`, icon: shard?.icon ?? '', description: shard?.description ?? '' }
    })

    const runes: BuildData['runes'] = {
      primaryTree:   primaryTreeInfo?.name ?? '',
      primaryTreeId: primaryStyleId,
      subTree:       subTreeInfo?.name ?? '',
      subTreeId:     subStyleId,
      keystone:      this.runeIdToInfo(keystoneId),
      primaryPerks:  primaryPerks.map(id => this.runeIdToInfo(id)),
      subPerks:      subPerks.map(id => this.runeIdToInfo(id)),
      statShards,
      allPerkIds,
    }

    // Items
    const startingIds: number[] = startRaw[2] ?? []
    const coreIds: number[]     = coreRaw[2] ?? []

    let boots: ItemInfo | null = null
    const starting = startingIds.map(id => this.itemIdToInfo(id)).filter(Boolean) as ItemInfo[]
    const coreAll  = coreIds.map(id => this.itemIdToInfo(id)).filter(Boolean) as ItemInfo[]

    const core = coreAll.filter(item => {
      if (this.ddragon.getItem(item.id)?.name.toLowerCase().includes('boots')) {
        boots = item
        return false
      }
      return true
    })

    // Late items — entry[5] contains options for slots 4, 5, 6 (+ consumables at [3])
    // Each slot: [[itemId, wins, matches], [itemId, wins, matches], ...]
    const parseLateSlot = (slotData: any[]): ItemInfo[] => {
      if (!Array.isArray(slotData)) return []
      return slotData
        .filter((opt: any) => Array.isArray(opt) && opt.length >= 3)
        .sort((a: any[], b: any[]) => (b[2] ?? 0) - (a[2] ?? 0)) // sort by matches (popularity)
        .map((opt: any[]) => this.itemIdToInfo(opt[0]))
        .filter(Boolean) as ItemInfo[]
    }

    const fourthItemOptions = parseLateSlot(lateRaw[0])
    const fifthItemOptions  = parseLateSlot(lateRaw[1])
    const sixthItemOptions  = parseLateSlot(lateRaw[2])

    // Full build = core items + top pick from each late slot
    const fullBuild = [
      ...coreAll,
      ...(fourthItemOptions[0] ? [fourthItemOptions[0]] : []),
      ...(fifthItemOptions[0] ? [fifthItemOptions[0]] : []),
      ...(sixthItemOptions[0] ? [sixthItemOptions[0]] : []),
    ]

    const items: BuildData['items'] = {
      starting,
      core,
      boots,
      fullBuild,
      fourthItemOptions,
      fifthItemOptions,
      sixthItemOptions,
    }

    // Skills
    const levelOrder: string[] = abilitiesRaw[2] ?? []
    const maxOrderStr: string  = abilitiesRaw[3] ?? ''
    const skillOrder = maxOrderStr ? maxOrderStr.split('') : []

    const skills: BuildData['skills'] = {
      order: skillOrder,
      levelOrder,
    }

    // Summoner spells
    const spellIds: number[] = spellsRaw[2] ?? []
    const summonerSpells: SpellInfo[] = spellIds
      .map(id => {
        const spell = this.ddragon.getSummonerSpell(id)
        return spell ? {
          id,
          name: spell.name,
          icon: this.ddragon.getAssetUrl('spell', spell.image.full),
          description: spell.description || '',
        } : null
      })
      .filter(Boolean) as SpellInfo[]

    return {
      name: 'Most Popular',
      winRate,
      pickRate: 'N/A',
      games,
      role,
      runes,
      items,
      skills,
      summonerSpells,
    }
  }

  // === Helpers ===

  private runeIdToInfo(id: number): RuneInfo {
    const rune = this.ddragon.getRuneById(id)
    return {
      id,
      name:  rune?.name ?? 'Unknown',
      icon:  rune ? this.ddragon.getAssetUrl('rune', rune.icon) : '',
      description: rune?.description ?? '',
    }
  }

  private itemIdToInfo(id: number): ItemInfo | null {
    const item = this.ddragon.getItem(id)
    if (!item) return null
    return {
      id,
      name: item.name,
      icon: this.ddragon.getAssetUrl('item', `${id}`),
      description: item.plaintext || item.description || '',
    }
  }

  private getFallbackBuild(role: string): BuildData[] {
    console.warn('[Scraper] Returning empty fallback build (API unavailable)')
    return [{
      name:     'Unavailable',
      winRate:  'N/A',
      pickRate: 'N/A',
      games:    'N/A',
      role,
      runes: {
        primaryTree:   '',
        primaryTreeId: 0,
        subTree:       '',
        subTreeId:     0,
        keystone:    { id: 0, name: 'N/A', icon: '', description: '' },
        primaryPerks:  [],
        subPerks:      [],
        statShards:    [],
        allPerkIds:    [],
      },
      items: {
        starting:  [],
        core:      [],
        boots:     null,
        fullBuild: [],
        fourthItemOptions: [],
        fifthItemOptions:  [],
        sixthItemOptions:  [],
      },
      skills: {
        order:      [],
        levelOrder: [],
      },
      summonerSpells: [],
    }]
  }
}
