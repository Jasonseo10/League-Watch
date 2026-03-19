'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('leagueWatch', {
  onLCUStatus: (callback) => {
    ipcRenderer.on('lcu:status', (_event, status) => callback(status));
  },
  onChampionSelected: (callback) => {
    ipcRenderer.on('champ-select:champion', (_event, data) => callback(data));
  },
  onBuildsReceived: (callback) => {
    ipcRenderer.on('champ-select:builds', (_event, data) => callback(data));
  },
  onChampSelectEnded: (callback) => {
    ipcRenderer.on('champ-select:ended', () => callback());
  },
  onChampSelectError: (callback) => {
    ipcRenderer.on('champ-select:error', (_event, data) => callback(data));
  },
  onVisibilityChanged: (callback) => {
    ipcRenderer.on('overlay:visibility-changed', (_event, visible) => callback(visible));
  },
  onInteractableChanged: (callback) => {
    ipcRenderer.on('overlay:interactable-changed', (_event, interactable) => callback(interactable));
  },
  setInteractable: (value) => {
    ipcRenderer.send('overlay:set-interactable', value);
  },
  pushRunes: (runes) => ipcRenderer.invoke('lcu:push-runes', runes),
  pushItems: (items) => ipcRenderer.invoke('lcu:push-items', items),
  pushSpells: (spells) => ipcRenderer.invoke('lcu:push-spells', spells),
  getDDragonVersion: () => ipcRenderer.invoke('ddragon:version'),
  getAssetUrl: (type, key) => ipcRenderer.invoke('ddragon:asset-url', type, key),
});
