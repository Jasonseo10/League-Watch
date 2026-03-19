import { app, BrowserWindow, globalShortcut, ipcMain, screen } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { LCUConnection } from './lcu/connection'
import { LCUWebSocket } from './lcu/websocket'
import { LCUApi } from './lcu/api'
import { DataDragonService } from './services/ddragon'
import { UGGScraper } from './services/ugg-scraper'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LOCKFILE_PATH = 'D:\\Riot Games\\League of Legends\\lockfile'

let mainWindow: BrowserWindow | null = null
let lcuConnection: LCUConnection
let lcuWebSocket: LCUWebSocket | null = null
let lcuApi: LCUApi | null = null
let ddragon: DataDragonService
let scraper: UGGScraper
let isOverlayVisible = true
let isInteractable = false
let currentLCUStatus = { connected: false, message: 'Initializing...' }

function createOverlayWindow(): BrowserWindow {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.size // use full screen size, not workArea

  const win = new BrowserWindow({
    width: 420,
    height: 680,
    x: width - 440,
    y: Math.floor(height / 2) - 340,
    transparent: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false, // Prevent stealing focus from the game
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Use 'screen-saver' level to stay above fullscreen/borderless games
  win.setAlwaysOnTop(true, 'screen-saver')

  // Click-through by default
  win.setIgnoreMouseEvents(true, { forward: true })

  // Prevent the window from being minimized when game takes focus
  win.on('minimize', () => {
    win.restore()
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

  console.log(`[League Watch] Overlay window created at (${width - 440}, ${Math.floor(height / 2) - 340})`)

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
      mainWindow.showInactive() // showInactive prevents stealing focus from game
      isOverlayVisible = true
      console.log('[League Watch] Overlay shown (Ctrl+L)')
    }
    mainWindow.webContents.send('overlay:visibility-changed', isOverlayVisible)
  })

  // Shift+F1: Toggle interactable mode
  globalShortcut.register('Shift+F1', () => {
    if (!mainWindow) return
    isInteractable = !isInteractable
    if (isInteractable) {
      mainWindow.setIgnoreMouseEvents(false)
      mainWindow.setFocusable(true)
      console.log('[League Watch] Overlay is now INTERACTABLE (Shift+F1)')
    } else {
      mainWindow.setIgnoreMouseEvents(true, { forward: true })
      mainWindow.setFocusable(false)
      console.log('[League Watch] Overlay is now CLICK-THROUGH (Shift+F1)')
    }
    mainWindow.webContents.send('overlay:interactable-changed', isInteractable)
  })

  console.log('[League Watch] Hotkeys registered: Ctrl+L (toggle), Shift+F1 (interact)')
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
  lcuConnection = new LCUConnection(LOCKFILE_PATH)
}

async function connectToLCU() {
  try {
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
      role: string
      isHover: boolean
    }) => {
      console.log(`[League Watch] → Champion ${data.isHover ? 'HOVER' : 'LOCK'}: ${data.championName} (${data.role})`)
      mainWindow?.webContents.send('champ-select:champion', data)

      try {
        const builds = await scraper.getBuilds(data.championSlug, data.role)
        console.log(`[League Watch] → Fetched ${builds.length} build(s) for ${data.championName}`)
        mainWindow?.webContents.send('champ-select:builds', {
          champion: data,
          builds,
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

  ipcMain.on('overlay:set-interactable', (_event, value: boolean) => {
    if (!mainWindow) return
    isInteractable = value
    if (isInteractable) {
      mainWindow.setIgnoreMouseEvents(false)
      mainWindow.setFocusable(true)
    } else {
      mainWindow.setIgnoreMouseEvents(true, { forward: true })
      mainWindow.setFocusable(false)
    }
  })

  ipcMain.handle('ddragon:version', () => {
    return ddragon.getCurrentVersion()
  })

  ipcMain.handle('ddragon:asset-url', (_event, type: string, key: string) => {
    return ddragon.getAssetUrl(type, key)
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
    // Only fires if the process is forcibly killed — close is intercepted above
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
