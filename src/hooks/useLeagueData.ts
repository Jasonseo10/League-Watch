import { useState, useEffect, useCallback } from 'react'
import { ChampionInfo, BuildData, AllRoleBuildsPayload, RankOption, LCUStatus, ChampionAbilities } from '../types'

export function useLeagueData() {
  const [lcuStatus, setLcuStatus] = useState<LCUStatus>({ connected: false, message: 'Initializing...' })
  const [champion, setChampion] = useState<ChampionInfo | null>(null)
  const [buildsByRole, setBuildsByRole] = useState<Record<string, BuildData[]> | null>(null)
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedRank, setSelectedRank] = useState<string>('17') // Emerald+ default
  const [rankOptions, setRankOptions] = useState<RankOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [abilities, setAbilities] = useState<ChampionAbilities | null>(null)

  // Current builds for the selected role
  const builds = buildsByRole && selectedRole ? (buildsByRole[selectedRole] || null) : null

  useEffect(() => {
    const api = window.leagueWatch
    if (!api) {
      setError('League Watch API not available')
      return
    }

    // Fetch rank options once
    api.getRankOptions().then(setRankOptions)

    api.onLCUStatus((status) => {
      setLcuStatus(status)
    })

    // Request current status (handles race condition where main process
    // sent status before React mounted and registered listeners)
    api.getStatus().then((status) => {
      if (status) setLcuStatus(status)
    })

    api.onChampionSelected((data) => {
      setChampion(data)
      setIsLoading(true)
      setError(null)
      // Fetch champion abilities
      if (data.championDDragonId) {
        api.getChampionAbilities(data.championDDragonId).then(setAbilities)
      }
    })

    api.onBuildsReceived((data: AllRoleBuildsPayload) => {
      // Update champion info (role may have changed to default)
      if (data.champion.championName) {
        setChampion(data.champion)
      }
      // Fetch abilities if we don't have them yet for this champion
      if (data.champion.championDDragonId) {
        api.getChampionAbilities(data.champion.championDDragonId).then((a) => {
          if (a) setAbilities(a)
        })
      }
      setBuildsByRole(data.buildsByRole)
      setAvailableRoles(data.availableRoles)
      setSelectedRole(data.defaultRole)
      setSelectedRank(data.rank)
      setIsLoading(false)
    })

    api.onChampSelectEnded(() => {
      // Keep builds visible during loading screen and in-game.
      // They will be replaced when a new champ select starts.
      setIsLoading(false)
      setError(null)
    })

    api.onChampSelectError((data) => {
      setError(data.message)
      setIsLoading(false)
    })

    api.onVisibilityChanged((visible) => {
      setIsVisible(visible)
    })
  }, [])

  const changeRole = useCallback((role: string) => {
    setSelectedRole(role)
  }, [])

  const changeRank = useCallback((rank: string) => {
    if (!champion) return
    setSelectedRank(rank)
    setIsLoading(true)
    window.leagueWatch.requestRankChange(champion.championSlug, rank)
  }, [champion])

  const pushRunes = async (runes: any) => {
    return window.leagueWatch.pushRunes(runes)
  }

  const pushItems = async (items: any) => {
    return window.leagueWatch.pushItems(items)
  }

  const pushSpells = async (spells: any) => {
    return window.leagueWatch.pushSpells(spells)
  }

  return {
    lcuStatus,
    champion,
    abilities,
    builds,
    buildsByRole,
    availableRoles,
    selectedRole,
    selectedRank,
    rankOptions,
    isLoading,
    error,
    isVisible,
    changeRole,
    changeRank,
    pushRunes,
    pushItems,
    pushSpells,
  }
}
