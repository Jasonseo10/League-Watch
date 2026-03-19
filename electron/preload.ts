import { contextBridge, ipcRenderer } from 'electron'

export interface LeagueWatchAPI {
  // LCU events
  onLCUStatus: (callback: (status: { connected: boolean; message: string }) => void) => void
  onChampionSelected: (callback: (data: any) => void) => void
  onBuildsReceived: (callback: (data: any) => void) => void
  onChampSelectEnded: (callback: () => void) => void
  onChampSelectError: (callback: (data: { message: string }) => void) => void

  // Overlay events
  onVisibilityChanged: (callback: (visible: boolean) => void) => void
  onInteractableChanged: (callback: (interactable: boolean) => void) => void
  setInteractable: (value: boolean) => void

  // Push actions
  pushRunes: (runes: any) => Promise<{ success: boolean; error?: string }>
  pushItems: (items: any) => Promise<{ success: boolean; error?: string }>
  pushSpells: (spells: any) => Promise<{ success: boolean; error?: string }>

  // Data Dragon
  getDDragonVersion: () => Promise<string>
  getAssetUrl: (type: string, key: string) => Promise<string>
}

contextBridge.exposeInMainWorld('leagueWatch', {
  // LCU events
  onLCUStatus: (callback: (status: { connected: boolean; message: string }) => void) => {
    ipcRenderer.on('lcu:status', (_event, status) => callback(status))
  },
  onChampionSelected: (callback: (data: any) => void) => {
    ipcRenderer.on('champ-select:champion', (_event, data) => callback(data))
  },
  onBuildsReceived: (callback: (data: any) => void) => {
    ipcRenderer.on('champ-select:builds', (_event, data) => callback(data))
  },
  onChampSelectEnded: (callback: () => void) => {
    ipcRenderer.on('champ-select:ended', () => callback())
  },
  onChampSelectError: (callback: (data: { message: string }) => void) => {
    ipcRenderer.on('champ-select:error', (_event, data) => callback(data))
  },

  // Overlay events
  onVisibilityChanged: (callback: (visible: boolean) => void) => {
    ipcRenderer.on('overlay:visibility-changed', (_event, visible) => callback(visible))
  },
  onInteractableChanged: (callback: (interactable: boolean) => void) => {
    ipcRenderer.on('overlay:interactable-changed', (_event, interactable) => callback(interactable))
  },
  setInteractable: (value: boolean) => {
    ipcRenderer.send('overlay:set-interactable', value)
  },

  // Push actions
  pushRunes: (runes: any) => ipcRenderer.invoke('lcu:push-runes', runes),
  pushItems: (items: any) => ipcRenderer.invoke('lcu:push-items', items),
  pushSpells: (spells: any) => ipcRenderer.invoke('lcu:push-spells', spells),

  // Data Dragon
  getDDragonVersion: () => ipcRenderer.invoke('ddragon:version'),
  getAssetUrl: (type: string, key: string) => ipcRenderer.invoke('ddragon:asset-url', type, key),
} satisfies LeagueWatchAPI)
