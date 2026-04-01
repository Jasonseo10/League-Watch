import { app, BrowserWindow, globalShortcut, ipcMain, screen } from 'electron'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { LCUConnection } from './lcu/connection'
import { LCUWebSocket } from './lcu/websocket'
import { LCUApi } from './lcu/api'
import { DataDragonService } from './services/ddragon'
import { UGGScraper, RANK_OPTIONS } from './services/ugg-scraper'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Auto-detect the League of Legends lockfile path by:
 * 1. Checking the running LeagueClientUx.exe process
 * 2. Reading Riot's RiotClientInstalls.json config
 * 3. Falling back to common install locations
 */
function findLockfilePath(): string {
  // 1. Try to find via running League client process
  try {
    const output = execSync(
      'powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name=\'LeagueClientUx.exe\'\\" | Select-Object -ExpandProperty ExecutablePath"',
      { encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] }
    )
    const exePath = output.trim()
    if (exePath) {
      const lockfile = path.join(path.dirname(exePath), 'lockfile')
      console.log(`[League Watch] Found lockfile via process: ${lockfile}`)
      return lockfile
    }
  } catch {
    // Process not running or PowerShell failed
  }

  // 2. Try Riot's RiotClientInstalls.json
  try {
    const riotConfigPath = path.join(
      process.env.PROGRAMDATA || 'C:\\ProgramData',
      'Riot Games',
      'RiotClientInstalls.json'
    )
    if (fs.existsSync(riotConfigPath)) {
      const config = JSON.parse(fs.readFileSync(riotConfigPath, 'utf8'))
      const rcPaths = [config.rc_default, config.rc_live].filter(Boolean) as string[]
      for (const rcPath of rcPaths) {
        const riotGamesDir = path.dirname(path.dirname(rcPath.replace(/\//g, '\\')))
        const lockfile = path.join(riotGamesDir, 'League of Legends', 'lockfile')
        if (fs.existsSync(lockfile)) {
          console.log(`[League Watch] Found lockfile via RiotClientInstalls.json: ${lockfile}`)
          return lockfile
        }
      }
    }
  } catch {
    // Config not found or malformed
  }

  // 3. Common install locations
  const commonPaths = [
    'C:\\Riot Games\\League of Legends\\lockfile',
    'D:\\Riot Games\\League of Legends\\lockfile',
    'C:\\Program Files\\Riot Games\\League of Legends\\lockfile',
    'C:\\Program Files (x86)\\Riot Games\\League of Legends\\lockfile',
    'D:\\Program Files\\Riot Games\\League of Legends\\lockfile',
    'D:\\Program Files (x86)\\Riot Games\\League of Legends\\lockfile',
  ]

  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      console.log(`[League Watch] Found lockfile at common path: ${p}`)
      return p
    }
  }

  console.log('[League Watch] Lockfile not found yet, will detect when League starts')
  return commonPaths[0]
}

let mainWindow: BrowserWindow | null = null
let lcuConnection: LCUConnection
let lcuWebSocket: LCUWebSocket | null = null
let lcuApi: LCUApi | null = null
let ddragon: DataDragonService
let scraper: UGGScraper
let isOverlayVisible = true
let currentLCUStatus = { connected: false, message: 'Initializing...' }

// === Window position persistence ===

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'window-position.json')
}

function loadWindowPosition(): { x: number; y: number } | null {
  try {
    const data = fs.readFileSync(getSettingsPath(), 'utf-8')
    const pos = JSON.parse(data)
    if (typeof pos.x === 'number' && typeof pos.y === 'number') {
      return pos
    }
  } catch {
    // File doesn't exist yet — use default
  }
  return null
}

function saveWindowPosition(x: number, y: number) {
  try {
    fs.writeFileSync(getSettingsPath(), JSON.stringify({ x, y }))
  } catch (err: any) {
    console.error('[League Watch] Failed to save window position:', err.message)
  }
}

// === Window creation ===

function createOverlayWindow(): BrowserWindow {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.size

  const savedPos = loadWindowPosition()
  const x = savedPos?.x ?? (width - 360)
  const y = savedPos?.y ?? (Math.floor(height / 2) - 340)

  const win = new BrowserWindow({
    width: 340,
    height: 680,
    x,
    y,
    transparent: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    movable: true,
    focusable: false, // Prevent stealing focus from the game
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Use 'screen-saver' level to stay above borderless fullscreen games
  win.setAlwaysOnTop(true, 'screen-saver')

  // Prevent the window from being minimized when game takes focus
  win.on('minimize', () => {
    win.restore()
  })

  // Save position when the window is moved
  win.on('moved', () => {
    if (!win.isDestroyed()) {
      const [newX, newY] = win.getPosition()
      saveWindowPosition(newX, newY)
      console.log(`[League Watch] Window moved to (${newX}, ${newY})`)
    }
  })

  // Intercept close event — hide instead of destroying so hotkeys keep working
  win.on('close', (e) => {
    e.preventDefault()
    win.hide()
    isOverlayVisible = false
    console.log('[League Watch] Window close intercepted — hiding instead')
  })

  // Re-send current state when renderer finishes loading (avoids race condition)
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('lcu:status', currentLCUStatus)
  })

  // Load the renderer
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  console.log(`[League Watch] Overlay window created at (${x}, ${y})`)

  return win
}

function registerHotkeys() {
  // Ctrl+L: Toggle overlay visibility
  globalShortcut.register('CommandOrControl+L', () => {
    if (!mainWindow) return
    if (isOverlayVisible) {
      mainWindow.hide()
      isOverlayVisible = false
      console.log('[League Watch] Overlay hidden (Ctrl+L)')
    } else {
      mainWindow.showInactive()
      isOverlayVisible = true
      console.log('[League Watch] Overlay shown (Ctrl+L)')
    }
    mainWindow.webContents.send('overlay:visibility-changed', isOverlayVisible)
  })

  console.log('[League Watch] Hotkeys registered: Ctrl+L (toggle)')
}

// Periodically re-assert always-on-top to prevent the game from pushing us under
function startOverlayKeepAlive() {
  setInterval(() => {
    if (mainWindow && isOverlayVisible && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(true, 'screen-saver')
    }
  }, 3000)
}

async function initializeServices() {
  ddragon = new DataDragonService()
  await ddragon.initialize()
  console.log(`[League Watch] Data Dragon initialized - Patch ${ddragon.getCurrentVersion()}`)

  scraper = new UGGScraper(ddragon)
  lcuConnection = new LCUConnection(findLockfilePath())
}

async function connectToLCU() {
  try {
    // Re-detect lockfile path each attempt (League may have started since last check)
    lcuConnection.setLockfilePath(findLockfilePath())

    const credentials = await lcuConnection.getCredentials()
    if (!credentials) {
      console.log('[League Watch] League client not running. Polling...')
      currentLCUStatus = { connected: false, message: 'Waiting for League client...' }
      mainWindow?.webContents.send('lcu:status', currentLCUStatus)
      setTimeout(connectToLCU, 5000)
      return
    }

    console.log(`[League Watch] LCU credentials found - port: ${credentials.port}`)
    currentLCUStatus = { connected: true, message: 'Connected to League client' }
    mainWindow?.webContents.send('lcu:status', currentLCUStatus)

    lcuApi = new LCUApi(credentials)

    lcuWebSocket = new LCUWebSocket(credentials, ddragon)

    lcuWebSocket.on('champion-selected', async (data: {
      championId: number
      championName: string
      championSlug: string
      championDDragonId: string
      role: string
      isHover: boolean
    }) => {
      console.log(`[League Watch] → Champion ${data.isHover ? 'HOVER' : 'LOCK'}: ${data.championName} (${data.role})`)
      mainWindow?.webContents.send('champ-select:champion', data)

      try {
        const allBuilds = await scraper.getAllRoleBuilds(data.championSlug)
        console.log(`[League Watch] → Fetched builds for ${data.championName}: roles=[${allBuilds.availableRoles.join(', ')}], default=${allBuilds.defaultRole}`)
        mainWindow?.webContents.send('champ-select:builds', {
          champion: { ...data, role: allBuilds.defaultRole },
          buildsByRole: allBuilds.buildsByRole,
          defaultRole: allBuilds.defaultRole,
          availableRoles: allBuilds.availableRoles,
          rank: allBuilds.rank,
        })
      } catch (err) {
        console.error('[League Watch] Failed to fetch builds:', err)
        mainWindow?.webContents.send('champ-select:error', { message: 'Failed to fetch builds' })
      }
    })

    lcuWebSocket.on('champ-select-ended', () => {
      console.log('[League Watch] Champ select ended')
      mainWindow?.webContents.send('champ-select:ended')
    })

    lcuWebSocket.on('disconnected', () => {
      console.log('[League Watch] LCU WebSocket disconnected. Reconnecting...')
      currentLCUStatus = { connected: false, message: 'Disconnected. Reconnecting...' }
      mainWindow?.webContents.send('lcu:status', currentLCUStatus)
      lcuWebSocket = null
      lcuApi = null
      setTimeout(connectToLCU, 5000)
    })

    lcuWebSocket.connect()
  } catch (err) {
    console.error('[League Watch] LCU connection error:', err)
    setTimeout(connectToLCU, 5000)
  }
}

function setupIPC() {
  ipcMain.handle('lcu:push-runes', async (_event, runes) => {
    if (!lcuApi) return { success: false, error: 'Not connected to League client' }
    try {
      await lcuApi.pushRunes(runes)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('lcu:push-items', async (_event, items) => {
    if (!lcuApi) return { success: false, error: 'Not connected to League client' }
    try {
      await lcuApi.pushItemSet(items)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('lcu:push-spells', async (_event, spells) => {
    if (!lcuApi) return { success: false, error: 'Not connected to League client' }
    try {
      await lcuApi.pushSummonerSpells(spells)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('builds:request-rank-change', async (_event, championSlug: string, rank: string) => {
    try {
      const allBuilds = await scraper.getAllRoleBuilds(championSlug, rank)
      console.log(`[League Watch] Rank change → ${rank} for ${championSlug}: roles=[${allBuilds.availableRoles.join(', ')}]`)
      mainWindow?.webContents.send('champ-select:builds', {
        champion: { championId: 0, championName: '', championSlug, role: allBuilds.defaultRole },
        buildsByRole: allBuilds.buildsByRole,
        defaultRole: allBuilds.defaultRole,
        availableRoles: allBuilds.availableRoles,
        rank: allBuilds.rank,
      })
    } catch (err) {
      console.error('[League Watch] Rank change failed:', err)
    }
  })

  ipcMain.handle('builds:get-rank-options', () => {
    return RANK_OPTIONS.map(r => ({ label: r.label, code: r.code }))
  })

  ipcMain.handle('lcu:get-status', () => {
    return currentLCUStatus
  })

  ipcMain.handle('ddragon:version', () => {
    return ddragon.getCurrentVersion()
  })

  ipcMain.handle('ddragon:asset-url', (_event, type: string, key: string) => {
    return ddragon.getAssetUrl(type, key)
  })

  ipcMain.handle('ddragon:champion-abilities', (_event, ddragonId: string) => {
    return ddragon.getChampionAbilities(ddragonId)
  })
}

app.whenReady().then(async () => {
  await initializeServices()

  mainWindow = createOverlayWindow()
  registerHotkeys()
  setupIPC()
  startOverlayKeepAlive()

  connectToLCU()

  mainWindow.on('closed', () => {
    mainWindow = null
  })
})

app.on('window-all-closed', () => {
  // Don't quit — the window is hidden, not destroyed. App stays alive for hotkeys.
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  if (lcuWebSocket) {
    lcuWebSocket.disconnect()
  }
})
