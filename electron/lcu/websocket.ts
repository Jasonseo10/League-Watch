import WebSocket from 'ws'
import { EventEmitter } from 'events'
import { LCUCredentials, LCUConnection } from './connection'
import { DataDragonService } from '../services/ddragon'

interface ChampSelectAction {
  actorCellId: number
  championId: number
  type: string        // "pick", "ban", "ten_bans_reveal"
  completed: boolean
  isAllyAction: boolean
  isInProgress: boolean
}

interface ChampSelectSession {
  myTeam: Array<{
    cellId: number
    championId: number
    championPickIntent: number
    assignedPosition: string
    summonerId: number
  }>
  localPlayerCellId: number
  actions: ChampSelectAction[][]
}

export class LCUWebSocket extends EventEmitter {
  private credentials: LCUCredentials
  private ddragon: DataDragonService
  private ws: WebSocket | null = null
  private lastEmittedChampionId: number = 0
  private isInChampSelect: boolean = false

  constructor(credentials: LCUCredentials, ddragon: DataDragonService) {
    super()
    this.credentials = credentials
    this.ddragon = ddragon
  }

  connect() {
    const authToken = Buffer.from(`riot:${this.credentials.password}`).toString('base64')
    const url = `wss://127.0.0.1:${this.credentials.port}/`

    this.ws = new WebSocket(url, {
      headers: {
        'Authorization': `Basic ${authToken}`,
      },
      rejectUnauthorized: false,
    })

    this.ws.on('open', () => {
      console.log('[LCU WS] Connected')
      // Subscribe to champ select events
      // WAMP subscribe: [5, "OnJsonApiEvent_lol-champ-select_v1_session"]
      this.ws?.send(JSON.stringify([5, 'OnJsonApiEvent_lol-champ-select_v1_session']))

      // Poll for an already-in-progress champ select session (handles connect-after-start)
      this.pollCurrentSession()
    })

    this.ws.on('message', (rawData: WebSocket.Data) => {
      try {
        const message = JSON.parse(rawData.toString())
        this.handleMessage(message)
      } catch {
        // Ignore non-JSON messages
      }
    })

    this.ws.on('close', () => {
      console.log('[LCU WS] Disconnected')
      this.ws = null
      if (this.isInChampSelect) {
        this.isInChampSelect = false
        this.emit('champ-select-ended')
      }
      this.emit('disconnected')
    })

    this.ws.on('error', (err) => {
      console.error('[LCU WS] Error:', err.message)
    })
  }

  private async pollCurrentSession() {
    try {
      const session = await LCUConnection.request(this.credentials, 'GET', '/lol-champ-select/v1/session')
      if (session && session.localPlayerCellId !== undefined) {
        console.log('[LCU WS] Found active champ select session via HTTP poll')
        this.lastEmittedChampionId = 0
        this.isInChampSelect = true
        this.processChampSelectSession(session as ChampSelectSession)
      } else {
        console.log('[LCU WS] No active champ select session at connect time')
      }
    } catch {
      // 404 means no session — expected outside champ select
      console.log('[LCU WS] No active champ select session (HTTP poll 404/error)')
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  private handleMessage(message: any) {
    // WAMP event format: [8, "OnJsonApiEvent_...", { data, eventType, uri }]
    if (!Array.isArray(message) || message.length < 3) return
    if (message[0] !== 8) return

    const eventName = message[1]
    const payload = message[2]

    if (eventName === 'OnJsonApiEvent_lol-champ-select_v1_session') {
      this.handleChampSelectEvent(payload)
    }
  }

  private handleChampSelectEvent(payload: { eventType: string; data: ChampSelectSession }) {
    const { eventType, data } = payload

    if (eventType === 'Delete') {
      // Champ select ended (game started, dodged, etc.)
      console.log('[LCU WS] Champ select session deleted')
      this.isInChampSelect = false
      this.lastEmittedChampionId = 0
      this.emit('champ-select-ended')
      return
    }

    if (eventType === 'Create') {
      console.log('[LCU WS] Champ select session created')
      this.isInChampSelect = true
      this.lastEmittedChampionId = 0 // Reset so the first hover always fires
      this.processChampSelectSession(data)
    } else if (eventType === 'Update') {
      this.isInChampSelect = true
      this.processChampSelectSession(data)
    }
  }

  private processChampSelectSession(session: ChampSelectSession) {
    const localCellId = session.localPlayerCellId
    console.log(`[LCU WS] Processing session — localCellId: ${localCellId}, myTeam: [${session.myTeam.map(p => `cell${p.cellId}:champ${p.championId}:intent${p.championPickIntent}`).join(', ')}]`)

    // Find the local player in myTeam
    const localPlayer = session.myTeam.find(
      (player) => player.cellId === localCellId
    )

    if (!localPlayer) {
      console.log('[LCU WS] Could not find local player in myTeam')
      return
    }

    // Determine champion ID with priority:
    // 1. Locked-in champion (championId from the completed pick action)
    // 2. Currently hovering champion (championId from in-progress pick action)
    // 3. Pick intent / pre-pick (championPickIntent)
    // 4. championId on the team member object
    let championId = 0
    let isHover = false

    // Check actions for our picks
    for (const actionGroup of session.actions) {
      for (const action of actionGroup) {
        if (action.actorCellId === localCellId && action.type === 'pick') {
          if (action.championId !== 0) {
            championId = action.championId
            isHover = !action.completed
          }
        }
      }
    }

    // Fallback to team member championId
    if (championId === 0 && localPlayer.championId !== 0) {
      championId = localPlayer.championId
    }

    // Fallback to pick intent
    if (championId === 0 && localPlayer.championPickIntent !== 0) {
      championId = localPlayer.championPickIntent
      isHover = true
    }

    if (championId === 0) {
      console.log('[LCU WS] No champion selected/hovered yet (championId=0)')
      return
    }

    // Only emit if champion changed
    if (championId === this.lastEmittedChampionId) {
      console.log(`[LCU WS] Champion unchanged (${championId}), skipping emit`)
      return
    }
    this.lastEmittedChampionId = championId

    // Map championId to champion data
    const championData = this.ddragon.getChampionById(championId)
    if (!championData) {
      console.error(`[LCU WS] Unknown champion ID: ${championId}`)
      return
    }

    // Map assigned position to role
    const role = this.mapPosition(localPlayer.assignedPosition)

    console.log(`[LCU WS] Champion ${isHover ? 'hovered' : 'locked'}: ${championData.name} (ID: ${championId}, Role: ${role})`)

    this.emit('champion-selected', {
      championId,
      championName: championData.name,
      championSlug: championData.slug,
      role,
      isHover,
    })
  }

  /**
   * Map LCU assigned positions to u.gg role slugs.
   * LCU positions: "top", "jungle", "middle", "bottom", "utility"
   * u.gg roles: "top", "jungle", "mid", "adc", "support"
   */
  private mapPosition(position: string): string {
    const positionMap: Record<string, string> = {
      'top': 'top',
      'jungle': 'jungle',
      'middle': 'mid',
      'bottom': 'adc',
      'utility': 'support',
    }
    return positionMap[position.toLowerCase()] || 'mid'
  }
}
