import axios from 'axios'

interface ChampionData {
  id: string       // e.g. "MonkeyKing"
  key: string      // e.g. "62" (the numeric ID as a string)
  name: string     // e.g. "Wukong"
  slug: string     // e.g. "wukong" (for u.gg URL)
}

interface RuneData {
  id: number
  key: string
  name: string
  icon: string
  slots?: Array<{
    runes: Array<{
      id: number
      key: string
      name: string
      icon: string
    }>
  }>
}

interface SummonerSpellData {
  id: string
  key: string // numeric ID as string
  name: string
  image: { full: string }
}

interface ItemData {
  name: string
  image: { full: string }
  gold: { total: number }
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

// Stat shards are not in DDragon's runesReforged.json — they use separate IDs
const STAT_SHARDS: Record<number, { name: string; icon: string }> = {
  5001: { name: 'Health Scaling', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodshealthscalingicon.png' },
  5002: { name: 'Armor', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodsarmoricon.png' },
  5003: { name: 'Magic Resist', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodsmagicresicon.png' },
  5005: { name: 'Attack Speed', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodsattackspeedicon.png' },
  5007: { name: 'Ability Haste', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodscdrscalingicon.png' },
  5008: { name: 'Adaptive Force', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodsadaptiveforceicon.png' },
  5010: { name: 'Move Speed', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodsmovespeedicon.png' },
  5011: { name: 'Health', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodshealthplusicon.png' },
  5013: { name: 'Tenacity', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/statmodstenacityicon.png' },
}

export class DataDragonService {
  private version: string = ''
  private champions: Map<number, ChampionData> = new Map()
  private championsBySlug: Map<string, ChampionData> = new Map()
  private runes: RuneData[] = []
  private runesById: Map<number, { name: string; icon: string; treeName: string }> = new Map()
  private summonerSpells: Map<number, SummonerSpellData> = new Map()
  private items: Map<number, ItemData> = new Map()

  async initialize(): Promise<void> {
    // Get latest version
    const versionsResponse = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json')
    this.version = versionsResponse.data[0]
    console.log(`[DDragon] Using version: ${this.version}`)

    // Load all data in parallel
    await Promise.all([
      this.loadChampions(),
      this.loadRunes(),
      this.loadSummonerSpells(),
      this.loadItems(),
    ])
  }

  private async loadChampions(): Promise<void> {
    const url = `https://ddragon.leagueoflegends.com/cdn/${this.version}/data/en_US/champion.json`
    const response = await axios.get(url)
    const data = response.data.data

    for (const [id, champ] of Object.entries(data) as [string, any][]) {
      const championData: ChampionData = {
        id,
        key: champ.key,
        name: champ.name,
        slug: this.toSlug(champ.name, id),
      }
      this.champions.set(parseInt(champ.key, 10), championData)
      this.championsBySlug.set(championData.slug, championData)
    }

    console.log(`[DDragon] Loaded ${this.champions.size} champions`)
  }

  private async loadRunes(): Promise<void> {
    const url = `https://ddragon.leagueoflegends.com/cdn/${this.version}/data/en_US/runesReforged.json`
    const response = await axios.get(url)
    this.runes = response.data

    // Build a flat lookup by rune ID
    for (const tree of this.runes) {
      // Store tree itself
      this.runesById.set(tree.id, { name: tree.name, icon: tree.icon, treeName: tree.name })

      // Store each rune in each slot
      if (tree.slots) {
        for (const slot of tree.slots) {
          for (const rune of slot.runes) {
            this.runesById.set(rune.id, { name: rune.name, icon: rune.icon, treeName: tree.name })
          }
        }
      }
    }

    console.log(`[DDragon] Loaded ${this.runesById.size} runes`)
  }

  private async loadSummonerSpells(): Promise<void> {
    const url = `https://ddragon.leagueoflegends.com/cdn/${this.version}/data/en_US/summoner.json`
    const response = await axios.get(url)
    const data = response.data.data

    for (const spell of Object.values(data) as any[]) {
      this.summonerSpells.set(parseInt(spell.key, 10), spell)
    }

    console.log(`[DDragon] Loaded ${this.summonerSpells.size} summoner spells`)
  }

  private async loadItems(): Promise<void> {
    const url = `https://ddragon.leagueoflegends.com/cdn/${this.version}/data/en_US/item.json`
    const response = await axios.get(url)
    const data = response.data.data

    for (const [id, item] of Object.entries(data) as [string, any][]) {
      this.items.set(parseInt(id, 10), item)
    }

    console.log(`[DDragon] Loaded ${this.items.size} items`)
  }

  /**
   * Convert champion name to u.gg URL slug.
   * Special cases: "Wukong" -> "wukong" (DDragon ID is "MonkeyKing")
   * Most champions: lowercase name, remove spaces and special chars
   */
  private toSlug(name: string, ddragonId: string): string {
    // Special mappings for champions whose u.gg slug differs
    const specialSlugs: Record<string, string> = {
      'MonkeyKing': 'wukong',
      'Chogath': 'chogath',
      'Velkoz': 'velkoz',
      'KhaZix': 'khazix',
      'KaiSa': 'kaisa',
      'RekSai': 'reksai',
      'BelVeth': 'belveth',
      'KSante': 'ksante',
    }

    if (specialSlugs[ddragonId]) return specialSlugs[ddragonId]

    // Default: lowercase, remove apostrophes, spaces, and dots
    return name.toLowerCase().replace(/['\s.]/g, '')
  }

  // === Public getters ===

  getCurrentVersion(): string {
    return this.version
  }

  getChampionById(id: number): ChampionData | undefined {
    return this.champions.get(id)
  }

  getChampionBySlug(slug: string): ChampionData | undefined {
    return this.championsBySlug.get(slug)
  }

  getRuneById(id: number): { name: string; icon: string; treeName: string } | undefined {
    return this.runesById.get(id)
  }

  getRuneTrees(): RuneData[] {
    return this.runes
  }

  getStatShard(id: number): { name: string; icon: string } | undefined {
    return STAT_SHARDS[id]
  }

  getSummonerSpell(id: number): SummonerSpellData | undefined {
    return this.summonerSpells.get(id)
  }

  getItem(id: number): ItemData | undefined {
    return this.items.get(id)
  }

  /**
   * Get the full CDN URL for a Data Dragon asset.
   */
  getAssetUrl(type: string, key: string): string {
    const base = `https://ddragon.leagueoflegends.com/cdn/${this.version}`
    switch (type) {
      case 'champion-icon':
        return `${base}/img/champion/${key}.png`
      case 'champion-splash':
        return `${base}/img/champion/splash/${key}_0.jpg`
      case 'item':
        return `${base}/img/item/${key}.png`
      case 'spell':
        return `${base}/img/spell/${key}`
      case 'rune':
        // Rune icons from DDragon use a different path
        return `https://ddragon.leagueoflegends.com/cdn/img/${key}`
      case 'passive':
        return `${base}/img/passive/${key}`
      default:
        return ''
    }
  }

  /**
   * Fetch detailed champion abilities (passive + Q/W/E/R).
   * Results are cached per champion ID.
   */
  private abilityCache: Map<string, ChampionAbilities> = new Map()

  async getChampionAbilities(ddragonId: string): Promise<ChampionAbilities | null> {
    const cached = this.abilityCache.get(ddragonId)
    if (cached) return cached

    try {
      const url = `https://ddragon.leagueoflegends.com/cdn/${this.version}/data/en_US/champion/${ddragonId}.json`
      const response = await axios.get(url)
      const champData = response.data.data[ddragonId]

      const base = `https://ddragon.leagueoflegends.com/cdn/${this.version}`

      const passive: AbilityData = {
        key: 'P',
        name: champData.passive.name,
        description: champData.passive.description,
        icon: `${base}/img/passive/${champData.passive.image.full}`,
      }

      const spells: AbilityData[] = champData.spells.map((spell: any, i: number) => ({
        key: ['Q', 'W', 'E', 'R'][i],
        name: spell.name,
        description: spell.description,
        icon: `${base}/img/spell/${spell.image.full}`,
      }))

      const abilities: ChampionAbilities = { passive, spells }
      this.abilityCache.set(ddragonId, abilities)
      return abilities
    } catch (err: any) {
      console.error(`[DDragon] Failed to fetch abilities for ${ddragonId}:`, err.message)
      return null
    }
  }

  /**
   * Get all champions as an array (useful for search/autocomplete).
   */
  getAllChampions(): ChampionData[] {
    return Array.from(this.champions.values())
  }
}
