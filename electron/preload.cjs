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
  pushRunes: (runes) => ipcRenderer.invoke('lcu:push-runes', runes),
  pushItems: (items) => ipcRenderer.invoke('lcu:push-items', items),
  pushSpells: (spells) => ipcRenderer.invoke('lcu:push-spells', spells),
  requestRankChange: (championSlug, rank) => ipcRenderer.invoke('builds:request-rank-change', championSlug, rank),
  getRankOptions: () => ipcRenderer.invoke('builds:get-rank-options'),
  getStatus: () => ipcRenderer.invoke('lcu:get-status'),
  getDDragonVersion: () => ipcRenderer.invoke('ddragon:version'),
  getAssetUrl: (type, key) => ipcRenderer.invoke('ddragon:asset-url', type, key),
  getChampionAbilities: (ddragonId) => ipcRenderer.invoke('ddragon:champion-abilities', ddragonId),
  getTierList: (rank) => ipcRenderer.invoke('ugg:tier-list', rank),
  getCounters: (champKey, roleCode, rank) => ipcRenderer.invoke('ugg:counters', champKey, roleCode, rank),
  setWindowWidth: (width) => ipcRenderer.invoke('window:set-width', width),
});
