import { useState } from 'react'
import { BuildData, ChampionInfo, RankOption } from '../types'
import { RuneSection } from './RuneSection'
import { ItemSection } from './ItemSection'
import { SkillOrder } from './SkillOrder'
import { SpellSection } from './SpellSection'
import { cn } from '../lib/utils'

const ROLE_DISPLAY: Record<string, { label: string; short: string }> = {
  top:     { label: 'Top',     short: 'TOP' },
  jungle:  { label: 'Jungle',  short: 'JGL' },
  mid:     { label: 'Mid',     short: 'MID' },
  adc:     { label: 'ADC',     short: 'ADC' },
  support: { label: 'Support', short: 'SUP' },
}

const ROLE_ORDER = ['top', 'jungle', 'mid', 'adc', 'support']

interface BuildCardProps {
  champion: ChampionInfo
  builds: BuildData[]
  availableRoles: string[]
  selectedRole: string
  selectedRank: string
  rankOptions: RankOption[]
  onRoleChange: (role: string) => void
  onRankChange: (rank: string) => void
  onPushRunes: (runes: any) => Promise<{ success: boolean; error?: string }>
  onPushItems: (items: any) => Promise<{ success: boolean; error?: string }>
  onPushSpells: (spells: any) => Promise<{ success: boolean; error?: string }>
  ddragonVersion: string
  isLoading: boolean
}

export function BuildCard({
  champion, builds, availableRoles, selectedRole, selectedRank, rankOptions,
  onRoleChange, onRankChange, onPushRunes, onPushItems, onPushSpells, ddragonVersion, isLoading,
}: BuildCardProps) {
  const [currentBuildIndex, setCurrentBuildIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'runes' | 'items' | 'skills'>('runes')
  const [showRankDropdown, setShowRankDropdown] = useState(false)

  const currentBuild = builds[currentBuildIndex]
  if (!currentBuild) return null

  const championIconUrl = `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${champion.championDDragonId}.png`

  const currentRankLabel = rankOptions.find(r => r.code === selectedRank)?.label || 'Emerald+'

  const handlePrevBuild = () => {
    setCurrentBuildIndex((prev) => (prev > 0 ? prev - 1 : builds.length - 1))
  }

  const handleNextBuild = () => {
    setCurrentBuildIndex((prev) => (prev < builds.length - 1 ? prev + 1 : 0))
  }

  const handlePushRunes = async () => {
    const roleLabel = ROLE_DISPLAY[selectedRole]?.label || selectedRole
    await onPushRunes({
      name: `LW: ${roleLabel} ${champion.championName}`,
      primaryStyleId: currentBuild.runes.primaryTreeId,
      subStyleId: currentBuild.runes.subTreeId,
      selectedPerkIds: currentBuild.runes.allPerkIds,
    })
  }

  const handlePushItems = async () => {
    await onPushItems({
      championName: champion.championName,
      title: `League Watch - ${currentBuild.name}`,
      blocks: [
        {
          type: 'Starting Items',
          items: currentBuild.items.starting.map(i => ({ id: String(i.id), count: 1 })),
        },
        {
          type: 'Core Build',
          items: currentBuild.items.core.map(i => ({ id: String(i.id), count: 1 })),
        },
        {
          type: 'Full Build',
          items: currentBuild.items.fullBuild.map(i => ({ id: String(i.id), count: 1 })),
        },
      ],
    })
  }

  const handlePushSpells = async () => {
    if (currentBuild.summonerSpells.length >= 2) {
      await onPushSpells({
        spell1Id: currentBuild.summonerSpells[0].id,
        spell2Id: currentBuild.summonerSpells[1].id,
      })
    }
  }

  const handleRoleChange = (role: string) => {
    setCurrentBuildIndex(0)
    onRoleChange(role)
  }

  const handleRankChange = (rank: string) => {
    setCurrentBuildIndex(0)
    setShowRankDropdown(false)
    onRankChange(rank)
  }

  return (
    <div className="w-full h-full flex flex-col bg-lol-dark/95 backdrop-blur-md rounded-xl border border-lol-gold/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-lol-gray/80 to-transparent border-b border-lol-gold/10">
        <img
          src={championIconUrl}
          alt={champion.championName}
          className="w-12 h-12 rounded-lg border border-lol-gold/30"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-lg leading-tight">{champion.championName}</h2>
          <div className="flex items-center gap-2 text-xs text-lol-light">
            <span className="capitalize">{ROLE_DISPLAY[selectedRole]?.label || selectedRole}</span>
            <span className="text-lol-gold/50">•</span>
            <span>Patch {ddragonVersion}</span>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="text-lol-blue font-semibold">{currentBuild.winRate} WR</div>
          <div className="text-lol-light">{currentBuild.games} games</div>
        </div>
      </div>

      {/* Role Selector */}
      <div className="flex items-center border-b border-lol-gold/10 bg-lol-gray/30">
        <div className="flex flex-1">
          {ROLE_ORDER.map((role) => {
            const available = availableRoles.includes(role)
            const active = role === selectedRole
            return (
              <button
                key={role}
                onClick={() => available && handleRoleChange(role)}
                disabled={!available}
                className={cn(
                  'flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all',
                  active
                    ? 'text-lol-gold border-b-2 border-lol-gold bg-lol-gold/10'
                    : available
                      ? 'text-lol-light/60 hover:text-white hover:bg-lol-gold/5'
                      : 'text-lol-light/20 cursor-not-allowed'
                )}
              >
                {ROLE_DISPLAY[role]?.short || role.toUpperCase()}
              </button>
            )
          })}
        </div>

        {/* Rank Dropdown */}
        <div className="relative px-2">
          <button
            onClick={() => setShowRankDropdown(!showRankDropdown)}
            className="text-[10px] font-semibold text-lol-blue hover:text-white transition px-2 py-1.5 rounded flex items-center gap-1"
          >
            {currentRankLabel}
            <span className="text-[8px]">{showRankDropdown ? '\u25B2' : '\u25BC'}</span>
          </button>

          {showRankDropdown && (
            <div className="absolute right-0 top-full z-50 mt-1 bg-lol-dark border border-lol-gold/30 rounded-lg shadow-xl max-h-48 overflow-y-auto w-32">
              {rankOptions.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => handleRankChange(opt.code)}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-[11px] transition hover:bg-lol-gold/10',
                    opt.code === selectedRank
                      ? 'text-lol-gold font-semibold'
                      : 'text-lol-light'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay for rank changes */}
      {isLoading && builds && (
        <div className="px-4 py-1 bg-lol-blue/10 border-b border-lol-blue/20">
          <p className="text-[10px] text-lol-blue text-center animate-pulse">Updating builds...</p>
        </div>
      )}

      {/* Build Selector */}
      {builds.length > 1 && (
        <div className="flex items-center justify-between px-4 py-2 bg-lol-gray/40 border-b border-lol-gold/10">
          <button onClick={handlePrevBuild} className="text-lol-gold hover:text-white transition text-sm">◀</button>
          <span className="text-white text-sm font-medium">
            {currentBuild.name}
            <span className="text-lol-light ml-2 text-xs">{currentBuildIndex + 1} of {builds.length}</span>
          </span>
          <button onClick={handleNextBuild} className="text-lol-gold hover:text-white transition text-sm">▶</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-lol-gold/10">
        {(['runes', 'items', 'skills'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition',
              activeTab === tab
                ? 'text-lol-gold border-b-2 border-lol-gold bg-lol-gold/5'
                : 'text-lol-light hover:text-white'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {activeTab === 'runes' && (
          <RuneSection runes={currentBuild.runes} onPush={handlePushRunes} />
        )}
        {activeTab === 'items' && (
          <ItemSection items={currentBuild.items} onPush={handlePushItems} />
        )}
        {activeTab === 'skills' && (
          <SkillOrder skills={currentBuild.skills} />
        )}
      </div>

      {/* Summoner Spells + Push */}
      <div className="px-4 py-2 border-t border-lol-gold/10 bg-lol-gray/40">
        <SpellSection spells={currentBuild.summonerSpells} onPush={handlePushSpells} />
      </div>

      {/* Footer */}
      <div className="px-4 py-1.5 text-center border-t border-lol-gold/10">
        <span className="text-[10px] text-lol-light/50">
          League Watch • Ctrl+L to toggle • Shift+F1 to interact
        </span>
      </div>
    </div>
  )
}
