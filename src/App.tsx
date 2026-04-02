import { useState, useEffect } from 'react'
import { useLeagueData } from './hooks/useLeagueData'
import { BuildCard } from './components/BuildCard'
import { StatusIndicator } from './components/StatusIndicator'
import { AnimatedBorder } from './components/ui/animated-border'
import { TierListTable } from './components/TierListTable'

const dragStyle = { WebkitAppRegion: 'drag' } as React.CSSProperties

/** Convert DDragon version (e.g. "16.6.1") to display patch (e.g. "26.6") */
function toDisplayPatch(ddragonVersion: string): string {
  if (!ddragonVersion) return ''
  const parts = ddragonVersion.split('.')
  const major = parseInt(parts[0], 10)
  const minor = parts[1]
  return `${major + 10}.${minor}`
}

function App() {

  const {
    lcuStatus,
    champion,
    abilities,
    builds,
    availableRoles,
    selectedRole,
    selectedRank,
    rankOptions,
    isLoading,
    error,
    changeRole,
    changeRank,
    pushRunes,
    pushItems,
    pushSpells,
  } = useLeagueData()

  const [ddragonVersion, setDdragonVersion] = useState('')

  useEffect(() => {
    if (window.leagueWatch) {
      window.leagueWatch.getDDragonVersion().then(setDdragonVersion)
    }
  }, [])

  const content = (() => {
    // Waiting for League client
    if (!lcuStatus.connected) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 cursor-move" style={dragStyle}>
          <div className="text-center mb-4">
            <h1 className="text-lol-gold text-xl font-bold tracking-wide">LEAGUE WATCH</h1>
            <p className="text-lol-light/60 text-xs mt-1">Champion Build Overlay</p>
          </div>
          <StatusIndicator status={lcuStatus} />
          <p className="text-center text-[10px] text-lol-light/30 mt-4">
            Ctrl+L to toggle • Drag to move
          </p>
        </div>
      )
    }

    // Connected but no champ select yet — show tier list
    if (!champion && !builds) {
      return (
        <div className="w-full h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-lol-gold/15 flex-shrink-0" style={dragStyle}>
            <div>
              <h1 className="text-lol-gold text-sm font-bold tracking-wide leading-none">LEAGUE WATCH</h1>
              <p className="text-lol-light/50 text-[10px] mt-0.5">Patch {toDisplayPatch(ddragonVersion)}</p>
            </div>
            <StatusIndicator status={lcuStatus} />
          </div>

          {/* Tier list fills remaining space */}
          <div className="flex-1 overflow-hidden">
            <TierListTable ddragonVersion={ddragonVersion} />
          </div>
        </div>
      )
    }

    // Loading builds for a new champion
    if (isLoading && champion && !builds) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 cursor-move" style={dragStyle}>
          <div className="text-center">
            <img
              src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${champion.championDDragonId}.png`}
              alt={champion.championName}
              className="w-16 h-16 rounded-lg border border-lol-gold/30 mx-auto mb-3"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <h1 className="text-lol-gold text-lg font-bold">{champion.championName}</h1>
            <p className="text-lol-light text-sm capitalize">{selectedRole || champion.role}</p>
            <div className="mt-4 flex justify-center">
              <div className="w-8 h-8 border-2 border-lol-gold border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-lol-light/60 text-xs mt-3">Fetching builds...</p>
          </div>
        </div>
      )
    }

    // Error state
    if (error && !builds) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 cursor-move" style={dragStyle}>
          <p className="text-lol-red text-sm text-center">{error}</p>
          <p className="text-center text-[10px] text-lol-light/30 mt-2">
            Ctrl+L to toggle • Drag to move
          </p>
        </div>
      )
    }

    // Show builds
    if (builds && champion) {
      return (
        <BuildCard
          champion={{ ...champion, role: selectedRole }}
          builds={builds}
          availableRoles={availableRoles}
          selectedRole={selectedRole}
          selectedRank={selectedRank}
          rankOptions={rankOptions}
          onRoleChange={changeRole}
          onRankChange={changeRank}
          onPushRunes={pushRunes}
          onPushItems={pushItems}
          onPushSpells={pushSpells}
          ddragonVersion={ddragonVersion}
          isLoading={isLoading}
          abilities={abilities}
        />
      )
    }

    return null
  })()

  return (
    <AnimatedBorder className="w-full h-full rounded-xl bg-lol-dark/95 backdrop-blur-md">
      {content}
    </AnimatedBorder>
  )
}

export default App
