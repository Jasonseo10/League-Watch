import axios from 'axios'
import * as cheerio from 'cheerio'
import { DataDragonService } from './ddragon'

export interface BuildData {
  name: string           // Build name / playstyle
  winRate: string
  pickRate: string
  games: string
  role: string

  // Runes
  runes: {
    primaryTree: string
    primaryTreeId: number
    subTree: string
    subTreeId: number
    keystone: RuneInfo
    primaryPerks: RuneInfo[]
    subPerks: RuneInfo[]
    statShards: number[]
    // Flat array of all perk IDs for LCU push
    allPerkIds: number[]
  }

  // Items
  items: {
    starting: ItemInfo[]
    core: ItemInfo[]
    boots: ItemInfo | null
    fullBuild: ItemInfo[]
  }

  // Skills
  skills: {
    order: string[]        // e.g. ["Q", "E", "W"]
    levelOrder: string[]   // Level-by-level: ["Q", "W", "E", "Q", ...]
  }

  // Summoner Spells
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

/**
 * u.gg role mapping for their URL format
 */
const UGG_ROLES: Record<string, string> = {
  'top': 'top',
  'jungle': 'jungle',
  'mid': 'mid',
  'adc': 'adc',
  'support': 'support',
}

export class UGGScraper {
  private ddragon: DataDragonService
  private cache: Map<string, { builds: BuildData[]; timestamp: number }> = new Map()
  private cacheTTL = 10 * 60 * 1000 // 10 minutes

  constructor(ddragon: DataDragonService) {
    this.ddragon = ddragon
  }

  /**
   * Get builds for a champion in a specific role.
   * Returns multiple builds sorted by popularity (most popular first).
   */
  async getBuilds(championSlug: string, role: string): Promise<BuildData[]> {
    const cacheKey = `${championSlug}-${role}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`[Scraper] Cache hit: ${cacheKey}`)
      return cached.builds
    }

    console.log(`[Scraper] Fetching builds for ${championSlug} (${role})`)

    const uggRole = UGG_ROLES[role] || 'mid'
    const url = `https://u.gg/lol/champions/${championSlug}/build/${uggRole}`

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 10000,
      })

      const builds = this.parseBuilds(response.data, championSlug, role)

      // Cache the result
      this.cache.set(cacheKey, { builds, timestamp: Date.now() })

      return builds
    } catch (err: any) {
      console.error(`[Scraper] Failed to fetch from u.gg: ${err.message}`)
      // Return fallback/empty builds
      return this.getFallbackBuild(championSlug, role)
    }
  }

  /**
   * Parse the u.gg page HTML to extract build data.
   * u.gg server-side renders build data, so Cheerio can parse it.
   */
  private parseBuilds(html: string, championSlug: string, role: string): BuildData[] {
    const $ = cheerio.load(html)
    const builds: BuildData[] = []

    try {
      // Try to extract the recommended/primary build
      const primaryBuild = this.extractPrimaryBuild($, championSlug, role)
      if (primaryBuild) {
        builds.push(primaryBuild)
      }
    } catch (err) {
      console.error('[Scraper] Error parsing primary build:', err)
    }

    // If we couldn't parse any builds from the page, return fallback
    if (builds.length === 0) {
      return this.getFallbackBuild(championSlug, role)
    }

    return builds
  }

  /**
   * Extract the primary/most popular build from u.gg page.
   */
  private extractPrimaryBuild($: cheerio.CheerioAPI, championSlug: string, role: string): BuildData | null {
    // u.gg embeds build data in their page structure
    // We'll look for the key data sections

    // Extract rune data from the rune recommendation section
    const runeData = this.extractRunes($)
    const itemData = this.extractItems($)
    const skillData = this.extractSkills($)
    const spellData = this.extractSummonerSpells($)
    const statsData = this.extractStats($)

    if (!runeData && !itemData) {
      return null
    }

    return {
      name: 'Most Popular',
      winRate: statsData?.winRate || 'N/A',
      pickRate: statsData?.pickRate || 'N/A',
      games: statsData?.games || 'N/A',
      role,
      runes: runeData || {
        primaryTree: 'Unknown',
        primaryTreeId: 0,
        subTree: 'Unknown',
        subTreeId: 0,
        keystone: { id: 0, name: 'Unknown', icon: '' },
        primaryPerks: [],
        subPerks: [],
        statShards: [],
        allPerkIds: [],
      },
      items: itemData || {
        starting: [],
        core: [],
        boots: null,
        fullBuild: [],
      },
      skills: skillData || {
        order: ['Q', 'W', 'E'],
        levelOrder: [],
      },
      summonerSpells: spellData || [],
    }
  }

  /**
   * Extract rune information from the page.
   */
  private extractRunes($: cheerio.CheerioAPI): BuildData['runes'] | null {
    try {
      const runeIds: number[] = []

      // u.gg uses specific CSS classes for rune selections
      // Look for active/selected runes in the rune tree display
      $('[class*="rune-tree"] [class*="active"], [class*="perk-active"], .perk-active').each((_i, el) => {
        const img = $(el).find('img').first()
        const src = img.attr('src') || ''
        // Try to extract rune ID from the image path or data attributes
        const dataId = $(el).attr('data-id') || $(el).attr('data-perk-id')
        if (dataId) {
          runeIds.push(parseInt(dataId, 10))
        }
      })

      // Also try to find runes via image alt text or title
      if (runeIds.length === 0) {
        $('img[alt]').each((_i, el) => {
          const alt = $(el).attr('alt') || ''
          // Match against known rune names from DDragon
          const runeData = this.findRuneByName(alt)
          if (runeData) {
            runeIds.push(runeData.id)
          }
        })
      }

      if (runeIds.length < 4) return null

      // Determine primary and secondary trees
      const keystone = runeIds[0]
      const keystoneInfo = this.ddragon.getRuneById(keystone)

      let primaryTreeId = 0
      let primaryTreeName = ''
      let subTreeId = 0
      let subTreeName = ''

      if (keystoneInfo) {
        const trees = this.ddragon.getRuneTrees()
        for (const tree of trees) {
          if (tree.name === keystoneInfo.treeName) {
            primaryTreeId = tree.id
            primaryTreeName = tree.name
            break
          }
        }
      }

      // Find secondary tree from sub perks
      for (let i = 4; i < Math.min(runeIds.length, 7); i++) {
        const runeInfo = this.ddragon.getRuneById(runeIds[i])
        if (runeInfo && runeInfo.treeName !== primaryTreeName) {
          subTreeName = runeInfo.treeName
          const trees = this.ddragon.getRuneTrees()
          for (const tree of trees) {
            if (tree.name === subTreeName) {
              subTreeId = tree.id
              break
            }
          }
          break
        }
      }

      return {
        primaryTree: primaryTreeName,
        primaryTreeId,
        subTree: subTreeName,
        subTreeId,
        keystone: this.runeIdToInfo(keystone),
        primaryPerks: runeIds.slice(1, 4).map(id => this.runeIdToInfo(id)),
        subPerks: runeIds.slice(4, 6).map(id => this.runeIdToInfo(id)),
        statShards: runeIds.slice(6, 9),
        allPerkIds: runeIds,
      }
    } catch {
      return null
    }
  }

  /**
   * Extract item builds from the page.
   */
  private extractItems($: cheerio.CheerioAPI): BuildData['items'] | null {
    try {
      const starting: ItemInfo[] = []
      const core: ItemInfo[] = []
      const fullBuild: ItemInfo[] = []

      // u.gg displays items in sections - starting, core, full build
      // Look for item images within build sections
      $('[class*="starting-items"] img, [class*="item-build"] img').each((_i, el) => {
        const src = $(el).attr('src') || ''
        const itemIdMatch = src.match(/\/(\d+)\.png/)
        if (itemIdMatch) {
          const itemId = parseInt(itemIdMatch[1], 10)
          const itemData = this.ddragon.getItem(itemId)
          if (itemData) {
            const info: ItemInfo = {
              id: itemId,
              name: itemData.name,
              icon: this.ddragon.getAssetUrl('item', `${itemId}`),
            }
            // Categorize based on gold cost
            if (itemData.gold.total < 800) {
              starting.push(info)
            } else {
              core.push(info)
            }
          }
        }
      })

      if (core.length === 0 && starting.length === 0) return null

      return {
        starting,
        core: core.slice(0, 4),
        boots: null,
        fullBuild: core,
      }
    } catch {
      return null
    }
  }

  /**
   * Extract skill max order from the page.
   */
  private extractSkills($: cheerio.CheerioAPI): BuildData['skills'] | null {
    try {
      const skillOrder: string[] = []

      // u.gg displays skill order as Q > E > W etc.
      $('[class*="skill-order"] [class*="skill-label"], [class*="skill-priority"] span').each((_i, el) => {
        const text = $(el).text().trim().toUpperCase()
        if (['Q', 'W', 'E', 'R'].includes(text) && text !== 'R') {
          skillOrder.push(text)
        }
      })

      if (skillOrder.length >= 3) {
        return {
          order: skillOrder.slice(0, 3),
          levelOrder: [],
        }
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Extract summoner spells from the page.
   */
  private extractSummonerSpells($: cheerio.CheerioAPI): SpellInfo[] {
    try {
      const spells: SpellInfo[] = []

      $('[class*="summoner-spell"] img, [class*="spell-icon"] img').each((_i, el) => {
        const src = $(el).attr('src') || ''
        const alt = $(el).attr('alt') || ''
        // Try to match spell by name or image
        const spellName = alt.toLowerCase()
        const spellMap: Record<string, number> = {
          'flash': 4,
          'ignite': 14,
          'teleport': 12,
          'heal': 7,
          'barrier': 21,
          'exhaust': 3,
          'ghost': 6,
          'cleanse': 1,
          'smite': 11,
        }

        for (const [name, id] of Object.entries(spellMap)) {
          if (spellName.includes(name)) {
            const spellData = this.ddragon.getSummonerSpell(id)
            if (spellData) {
              spells.push({
                id,
                name: spellData.name,
                icon: this.ddragon.getAssetUrl('spell', spellData.image.full),
              })
            }
            break
          }
        }
      })

      return spells
    } catch {
      return []
    }
  }

  /**
   * Extract win rate, pick rate, games from the stats section.
   */
  private extractStats($: cheerio.CheerioAPI): { winRate: string; pickRate: string; games: string } | null {
    try {
      const stats = {
        winRate: '',
        pickRate: '',
        games: '',
      }

      // Look for win rate percentage
      $('[class*="win-rate"], [class*="winrate"]').each((_i, el) => {
        const text = $(el).text().trim()
        if (text.includes('%') && !stats.winRate) {
          stats.winRate = text
        }
      })

      $('[class*="pick-rate"], [class*="pickrate"]').each((_i, el) => {
        const text = $(el).text().trim()
        if (text.includes('%') && !stats.pickRate) {
          stats.pickRate = text
        }
      })

      $('[class*="games"], [class*="matches"]').each((_i, el) => {
        const text = $(el).text().trim()
        if (/\d/.test(text) && !stats.games) {
          stats.games = text
        }
      })

      if (stats.winRate || stats.pickRate) return stats
      return null
    } catch {
      return null
    }
  }

  // === Helpers ===

  private runeIdToInfo(id: number): RuneInfo {
    const rune = this.ddragon.getRuneById(id)
    return {
      id,
      name: rune?.name || 'Unknown',
      icon: rune ? this.ddragon.getAssetUrl('rune', rune.icon) : '',
    }
  }

  private findRuneByName(name: string): { id: number } | null {
    const trees = this.ddragon.getRuneTrees()
    for (const tree of trees) {
      if (tree.name.toLowerCase() === name.toLowerCase()) return { id: tree.id }
      if (tree.slots) {
        for (const slot of tree.slots) {
          for (const rune of slot.runes) {
            if (rune.name.toLowerCase() === name.toLowerCase()) return { id: rune.id }
          }
        }
      }
    }
    return null
  }

  /**
   * Return a basic fallback build when scraping fails.
   * This uses common/safe defaults so the UI always has something to display.
   */
  private getFallbackBuild(championSlug: string, role: string): BuildData[] {
    console.warn(`[Scraper] Using fallback build for ${championSlug}`)
    return [{
      name: 'Default Build',
      winRate: 'N/A',
      pickRate: 'N/A',
      games: 'N/A',
      role,
      runes: {
        primaryTree: 'Precision',
        primaryTreeId: 8000,
        subTree: 'Domination',
        subTreeId: 8100,
        keystone: { id: 8005, name: 'Press the Attack', icon: '' },
        primaryPerks: [],
        subPerks: [],
        statShards: [],
        allPerkIds: [8005],
      },
      items: {
        starting: [],
        core: [],
        boots: null,
        fullBuild: [],
      },
      skills: {
        order: ['Q', 'W', 'E'],
        levelOrder: [],
      },
      summonerSpells: [],
    }]
  }
}
