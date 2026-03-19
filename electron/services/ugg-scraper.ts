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

// Rank fallback order: Plat+ → Overall → Emerald+ → ... → Iron
const RANK_FALLBACK = ['10', '8', '17', '11', '14', '13', '16', '4', '5', '6', '7', '12', '15']

export class UGGScraper {
  private ddragon: DataDragonService
  private cache: Map<string, { builds: BuildData[]; timestamp: number }> = new Map()
  private readonly cacheTTL = 10 * 60 * 1000 // 10 minutes

  // Metadata fetched once per session
  private currentPatch: string | null = null
  private apiVersion: string | null = null

  constructor(ddragon: DataDragonService) {
    this.ddragon = ddragon
  }

  /**
   * Fetch and cache the current u.gg patch and API version.
   * This is called once before the first build request.
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
      // Derive patch from DDragon version: "16.6.1" → "16_6"
      const ddragonVersion = this.ddragon.getCurrentVersion()
      this.currentPatch = ddragonVersion.replace(/\.\d+$/, '').replace('.', '_')
      this.apiVersion = '1.5.0'
      console.log(`[Scraper] Fallback: patch=${this.currentPatch}, apiVersion=${this.apiVersion}`)
    }
  }

  /**
   * Get builds for a champion in a specific role.
   */
  async getBuilds(championSlug: string, role: string): Promise<BuildData[]> {
    const cacheKey = `${championSlug}-${role}`
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`[Scraper] Cache hit: ${cacheKey}`)
      return cached.builds
    }

    await this.fetchMeta()

    // Resolve champion numeric key from DDragon (e.g. "103" for Ahri)
    const champion = this.ddragon.getChampionBySlug(championSlug)
    if (!champion) {
      console.error(`[Scraper] Unknown champion slug: ${championSlug}`)
      return this.getFallbackBuild(role)
    }

    const champKey = champion.key
    const roleCode = UGG_ROLE_CODES[role] || '5'

    const url = `https://stats2.u.gg/lol/1.5/overview/${this.currentPatch}/ranked_solo_5x5/${champKey}/${this.apiVersion}.json`
    console.log(`[Scraper] Fetching: ${url}`)

    try {
      const response = await axios.get(url, { timeout: 10000 })
      const rawData = response.data

      const buildArray = this.findBuildArray(rawData, roleCode)
      if (!buildArray) {
        console.error(`[Scraper] No build data found for ${champion.name} (${role}) in API response`)
        return this.getFallbackBuild(role)
      }

      const build = this.parseBuildArray(buildArray, role)
      console.log(`[Scraper] Parsed build for ${champion.name}: WR=${build.winRate}, games=${build.games}, keystone=${build.runes.keystone.name}`)

      const builds = [build]
      this.cache.set(cacheKey, { builds, timestamp: Date.now() })
      return builds
    } catch (err: any) {
      console.error(`[Scraper] API request failed: ${err.message}`)
      return this.getFallbackBuild(role)
    }
  }

  /**
   * Walk through region → rank → role to find build data.
   * Returns the inner buildDataArray (13-element array).
   */
  private findBuildArray(data: any, roleCode: string): any[] | null {
    for (const region of [DEFAULT_REGION, '1', '2', '3']) {
      if (!data[region]) continue
      for (const rank of RANK_FALLBACK) {
        const roleEntry = data[region]?.[rank]?.[roleCode]
        if (!roleEntry) continue
        // roleEntry = [buildDataArray, timestamp]
        const buildDataArray = Array.isArray(roleEntry) ? roleEntry[0] : null
        if (buildDataArray && Array.isArray(buildDataArray) && buildDataArray.length > 6) {
          return buildDataArray
        }
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

    // Stat shards — u.gg returns them as strings ("5005"), convert to numbers
    const shardIds: number[] = (shardsRaw[2] ?? []).map((s: string | number) => parseInt(String(s), 10))

    const allPerkIds = [...runeIds, ...shardIds]

    const runes: BuildData['runes'] = {
      primaryTree:   primaryTreeInfo?.name ?? '',
      primaryTreeId: primaryStyleId,
      subTree:       subTreeInfo?.name ?? '',
      subTreeId:     subStyleId,
      keystone:      this.runeIdToInfo(runeIds[0]),
      primaryPerks:  runeIds.slice(1, 4).map(id => this.runeIdToInfo(id)),
      subPerks:      runeIds.slice(4, 6).map(id => this.runeIdToInfo(id)),
      statShards:    shardIds,
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

    const items: BuildData['items'] = {
      starting,
      core,
      boots,
      fullBuild: coreAll,
    }

    // Skills — abilitiesRaw[2] is the level-by-level array, abilitiesRaw[3] is the max order string
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
    }
  }

  private itemIdToInfo(id: number): ItemInfo | null {
    const item = this.ddragon.getItem(id)
    if (!item) return null
    return {
      id,
      name: item.name,
      icon: this.ddragon.getAssetUrl('item', `${id}`),
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
        keystone:    { id: 0, name: 'N/A', icon: '' },
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
      },
      skills: {
        order:      [],
        levelOrder: [],
      },
      summonerSpells: [],
    }]
  }
}
