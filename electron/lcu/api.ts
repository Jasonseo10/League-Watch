import { LCUConnection, LCUCredentials } from './connection'

export interface RunePageData {
  name: string
  primaryStyleId: number
  subStyleId: number
  selectedPerkIds: number[]
  current: boolean
}

export interface ItemSetData {
  championName: string
  title: string
  blocks: Array<{
    type: string
    items: Array<{ id: string; count: number }>
  }>
}

export interface SummonerSpellsData {
  spell1Id: number
  spell2Id: number
}

export class LCUApi {
  private credentials: LCUCredentials

  constructor(credentials: LCUCredentials) {
    this.credentials = credentials
  }

  /**
   * Push runes to the League client.
   * This creates or updates a rune page with the provided configuration.
   */
  async pushRunes(runes: RunePageData): Promise<void> {
    // Get current rune pages
    const pages = await LCUConnection.request(this.credentials, 'GET', '/lol-perks/v1/pages')

    // Find an editable page to replace, or delete one to make room
    let editablePage = Array.isArray(pages)
      ? pages.find((p: any) => p.isDeletable && p.current)
      : null

    if (!editablePage) {
      editablePage = Array.isArray(pages)
        ? pages.find((p: any) => p.isDeletable)
        : null
    }

    if (editablePage) {
      // Delete the existing page
      await LCUConnection.request(this.credentials, 'DELETE', `/lol-perks/v1/pages/${editablePage.id}`)
    }

    // Create new rune page
    await LCUConnection.request(this.credentials, 'POST', '/lol-perks/v1/pages', {
      name: runes.name || 'League Watch',
      primaryStyleId: runes.primaryStyleId,
      subStyleId: runes.subStyleId,
      selectedPerkIds: runes.selectedPerkIds,
      current: true,
    })
  }

  /**
   * Push an item set to the League client.
   */
  async pushItemSet(itemSet: ItemSetData): Promise<void> {
    // Get current summoner info
    const summoner = await LCUConnection.request(
      this.credentials,
      'GET',
      '/lol-summoner/v1/current-summoner'
    )

    const itemSetPayload = {
      associatedChampions: [],
      associatedMaps: [],
      blocks: itemSet.blocks,
      map: 'any',
      mode: 'any',
      preferredItemSlots: [],
      sortrank: 0,
      startedFrom: 'blank',
      title: itemSet.title || 'League Watch Build',
      type: 'custom',
      uid: `league-watch-${Date.now()}`,
    }

    await LCUConnection.request(
      this.credentials,
      'PUT',
      `/lol-item-sets/v1/item-sets/${summoner.summonerId}/sets`,
      {
        accountId: summoner.accountId,
        itemSets: [itemSetPayload],
        timestamp: Date.now(),
      }
    )
  }

  /**
   * Push summoner spells to the League client during champ select.
   */
  async pushSummonerSpells(spells: SummonerSpellsData): Promise<void> {
    // Get current champ select session to find our cellId
    const session = await LCUConnection.request(
      this.credentials,
      'GET',
      '/lol-champ-select/v1/session'
    )

    const localPlayer = session.myTeam.find(
      (p: any) => p.cellId === session.localPlayerCellId
    )

    if (!localPlayer) {
      throw new Error('Could not find local player in champ select')
    }

    // Update summoner spells
    await LCUConnection.request(
      this.credentials,
      'PATCH',
      `/lol-champ-select/v1/session/my-selection`,
      {
        spell1Id: spells.spell1Id,
        spell2Id: spells.spell2Id,
      }
    )
  }
}
