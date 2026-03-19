import { useState, useEffect } from 'react'
import { ChampionInfo, BuildsPayload, LCUStatus } from '../types'

export function useLeagueData() {
  const [lcuStatus, setLcuStatus] = useState<LCUStatus>({ connected: false, message: 'Initializing...' })
  const [champion, setChampion] = useState<ChampionInfo | null>(null)
  const [builds, setBuilds] = useState<BuildsPayload | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [isInteractable, setIsInteractable] = useState(false)

  useEffect(() => {
    const api = window.leagueWatch
    if (!api) {
      setError('League Watch API not available')
      return
    }

    api.onLCUStatus((status) => {
      setLcuStatus(status)
    })

    api.onChampionSelected((data) => {
      setChampion(data)
      setIsLoading(true)
      setError(null)
    })

    api.onBuildsReceived((data) => {
      setBuilds(data)
      setIsLoading(false)
    })

    api.onChampSelectEnded(() => {
      setChampion(null)
      setBuilds(null)
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

    api.onInteractableChanged((interactable) => {
      setIsInteractable(interactable)
    })
  }, [])

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
    builds,
    isLoading,
    error,
    isVisible,
    isInteractable,
    pushRunes,
    pushItems,
    pushSpells,
  }
}
