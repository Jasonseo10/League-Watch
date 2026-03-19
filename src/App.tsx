import { useState, useEffect } from 'react'
import { useLeagueData } from './hooks/useLeagueData'
import { BuildCard } from './components/BuildCard'
import { StatusIndicator } from './components/StatusIndicator'

function App() {
  const {
    lcuStatus,
    champion,
    builds,
    isLoading,
    error,
    isInteractable,
    pushRunes,
    pushItems,
    pushSpells,
  } = useLeagueData()

  const [ddragonVersion, setDdragonVersion] = useState('16.6.1')

  useEffect(() => {
    if (window.leagueWatch) {
      window.leagueWatch.getDDragonVersion().then(setDdragonVersion)
    }
  }, [])

  // Waiting for League client
  if (!lcuStatus.connected) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6">
        <div className="bg-lol-dark/95 backdrop-blur-md rounded-xl border border-lol-gold/20 p-6 w-full max-w-sm">
          <div className="text-center mb-4">
            <h1 className="text-lol-gold text-xl font-bold tracking-wide">LEAGUE WATCH</h1>
            <p className="text-lol-light/60 text-xs mt-1">Champion Build Overlay</p>
          </div>
          <StatusIndicator status={lcuStatus} />
          <p className="text-center text-[10px] text-lol-light/30 mt-4">
            Ctrl+L to toggle • Shift+F1 to interact
          </p>
        </div>
      </div>
    )
  }

  // Connected but no champ select yet
  if (!champion && !builds) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6">
        <div className="bg-lol-dark/95 backdrop-blur-md rounded-xl border border-lol-gold/20 p-6 w-full max-w-sm">
          <div className="text-center mb-4">
            <h1 className="text-lol-gold text-xl font-bold tracking-wide">LEAGUE WATCH</h1>
            <p className="text-lol-light/60 text-xs mt-1">Patch {ddragonVersion}</p>
          </div>
          <StatusIndicator status={lcuStatus} />
          <p className="text-center text-sm text-lol-light mt-4">
            Waiting for champion select...
          </p>
          <p className="text-center text-[10px] text-lol-light/30 mt-2">
            Hover or select a champion to see builds
          </p>
        </div>
      </div>
    )
  }

  // Loading builds for a new champion
  if (isLoading && champion) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6">
        <div className="bg-lol-dark/95 backdrop-blur-md rounded-xl border border-lol-gold/20 p-6 w-full max-w-sm">
          <div className="text-center">
            <img
              src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${champion.championSlug.charAt(0).toUpperCase() + champion.championSlug.slice(1)}.png`}
              alt={champion.championName}
              className="w-16 h-16 rounded-lg border border-lol-gold/30 mx-auto mb-3"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <h1 className="text-lol-gold text-lg font-bold">{champion.championName}</h1>
            <p className="text-lol-light text-sm capitalize">{champion.role}</p>
            <div className="mt-4 flex justify-center">
              <div className="w-8 h-8 border-2 border-lol-gold border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-lol-light/60 text-xs mt-3">Fetching builds...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !builds) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6">
        <div className="bg-lol-dark/95 backdrop-blur-md rounded-xl border border-lol-red/30 p-6 w-full max-w-sm">
          <p className="text-lol-red text-sm text-center">{error}</p>
          <p className="text-center text-[10px] text-lol-light/30 mt-2">
            Ctrl+L to toggle • Shift+F1 to interact
          </p>
        </div>
      </div>
    )
  }

  // Show builds
  if (builds) {
    return (
      <div className="w-full h-full p-2 relative">
        {/* Interactable mode indicator */}
        {isInteractable && (
          <div className="absolute top-0 left-0 right-0 z-50 bg-lol-blue/90 text-white text-[10px] text-center py-1 rounded-t-xl font-semibold">
            INTERACTIVE MODE — Click buttons • Press Shift+F1 to lock
          </div>
        )}
        <BuildCard
          champion={builds.champion}
          builds={builds.builds}
          onPushRunes={pushRunes}
          onPushItems={pushItems}
          onPushSpells={pushSpells}
          ddragonVersion={ddragonVersion}
        />
      </div>
    )
  }

  return null
}

export default App
