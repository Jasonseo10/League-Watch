import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BuildData, ChampionInfo, ChampionAbilities, RankOption } from '../types'
import { RuneSection } from './RuneSection'
import { ItemSection } from './ItemSection'

import { SpellSection } from './SpellSection'
import { AnimatedText } from './ui/animated-text'
import { Dock, DockIcon } from './ui/dock'
import { RankFluidSelector } from './ui/fluid-menu'
import { cn } from '../lib/utils'
import { GlowingTooltip } from './ui/glowing-tooltip'

const TOOLTIP_PADDING = 8

/** Convert DDragon version (e.g. "16.6.1") to display patch (e.g. "26.6") */
function toDisplayPatch(ddragonVersion: string): string {
  if (!ddragonVersion) return ''
  const parts = ddragonVersion.split('.')
  const major = parseInt(parts[0], 10)
  const minor = parts[1]
  return `${major + 10}.${minor}`
}

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
  abilities: ChampionAbilities | null
}

export function BuildCard({
  champion, builds, availableRoles, selectedRole, selectedRank, rankOptions,
  onRoleChange, onRankChange, onPushRunes, onPushItems, onPushSpells, ddragonVersion, isLoading, abilities,
}: BuildCardProps) {
  const [currentBuildIndex, setCurrentBuildIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'runes' | 'items'>('runes')
  const [spellsSwapped, setSpellsSwapped] = useState(false)
  const [hoveredAbility, setHoveredAbility] = useState<number | null>(null)

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
      const spells = spellsSwapped
        ? [currentBuild.summonerSpells[1], currentBuild.summonerSpells[0]]
        : currentBuild.summonerSpells
      await onPushSpells({
        spell1Id: spells[0].id,
        spell2Id: spells[1].id,
      })
    }
  }

  const handleRoleChange = (role: string) => {
    setCurrentBuildIndex(0)
    onRoleChange(role)
  }

  const handleRankChange = (rank: string) => {
    setCurrentBuildIndex(0)
    onRankChange(rank)
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-lol-gray/80 to-transparent border-b border-lol-gold/10">
        <img
          src={championIconUrl}
          alt={champion.championName}
          className="w-12 h-12 rounded-lg border border-lol-gold/30"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className="flex-1 min-w-0">
          <AnimatedText
            text={champion.championName}
            as="h2"
            duration={0.04}
            delay={0.02}
            textClassName="text-lg font-bold text-white"
            underlineGradient="from-lol-gold via-lol-gold/60 to-transparent"
            underlineHeight="h-[2px]"
            underlineOffset="-bottom-1"
            className="items-start gap-0"
          />
          <div className="flex items-center gap-2 text-xs text-lol-light mt-1">
            <span className="capitalize">{ROLE_DISPLAY[selectedRole]?.label || selectedRole}</span>
            <span className="text-lol-gold/50">•</span>
            <span>Patch {toDisplayPatch(ddragonVersion)}</span>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="text-lol-blue font-semibold">{currentBuild.winRate} WR</div>
          <div className="text-lol-light">{currentBuild.games} games</div>
        </div>
      </div>

      {/* Champion Abilities (dock-style magnification) */}
      {abilities && (
        <div className="flex items-center px-2 py-1.5 border-b border-lol-gold/10 bg-lol-gray/20">
          <ul className="flex items-center rounded-xl border border-lol-gold/10 bg-gradient-to-t from-lol-dark to-lol-gray/50 p-1">
            {[abilities.passive, ...abilities.spells].map((ability, i) => (
              <AbilityIcon
                key={i}
                ability={ability}
                index={i}
                isHovered={hoveredAbility === i}
                onHover={() => setHoveredAbility(i)}
                onLeave={() => setHoveredAbility(null)}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Role Selector (Dock) + Rank Dropdown */}
      <div className="flex items-center justify-between border-b border-lol-gold/10 bg-lol-gray/30 px-2 py-1.5">
        <Dock iconSize={36} maxAdditionalSize={2}>
          {ROLE_ORDER.map((role) => {
            const available = availableRoles.includes(role)
            const active = role === selectedRole
            return (
              <DockIcon
                key={role}
                name={ROLE_DISPLAY[role]?.label || role}
                onClick={() => available && handleRoleChange(role)}
                isActive={active}
                disabled={!available}
              >
                {ROLE_DISPLAY[role]?.short || role.toUpperCase()}
              </DockIcon>
            )
          })}
        </Dock>

        {/* Rank Selector */}
        <RankFluidSelector
          options={rankOptions}
          selected={selectedRank}
          onChange={handleRankChange}
        />
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
        {(['runes', 'items'] as const).map((tab) => (
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
          <RuneSection runes={currentBuild.runes} skills={currentBuild.skills} onPush={handlePushRunes} />
        )}
        {activeTab === 'items' && (
          <ItemSection items={currentBuild.items} onPush={handlePushItems} />
        )}
      </div>

      {/* Summoner Spells + Push */}
      <div className="px-4 py-2 border-t border-lol-gold/10 bg-lol-gray/40">
        <SpellSection
          spells={currentBuild.summonerSpells}
          swapped={spellsSwapped}
          onSwap={() => setSpellsSwapped(s => !s)}
          onPush={handlePushSpells}
        />
      </div>

      {/* Footer — also serves as drag handle */}
      <div className="px-4 py-1.5 text-center border-t border-lol-gold/10 cursor-move" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <span className="text-[10px] text-lol-light/50">
          League Watch • Ctrl+L to toggle • Drag to move
        </span>
      </div>
    </div>
  )
}

/** Ability icon with portal tooltip that clamps to window edges */
function AbilityIcon({
  ability,
  index,
  isHovered,
  onHover,
  onLeave,
}: {
  ability: { key: string; name: string; description: string; icon: string }
  index: number
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
}) {
  const liRef = useRef<HTMLLIElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null)

  useEffect(() => {
    if (!isHovered || !liRef.current) {
      setTooltipPos(null)
      return
    }

    const id = requestAnimationFrame(() => {
      const iconRect = liRef.current!.getBoundingClientRect()
      const winW = document.documentElement.clientWidth
      const tooltipEl = tooltipRef.current
      const tooltipW = tooltipEl ? tooltipEl.offsetWidth : 200

      const centerX = iconRect.left + iconRect.width / 2
      let left = centerX - tooltipW / 2

      if (left < TOOLTIP_PADDING) left = TOOLTIP_PADDING
      if (left + tooltipW > winW - TOOLTIP_PADDING) left = winW - tooltipW - TOOLTIP_PADDING

      setTooltipPos({
        left,
        top: iconRect.bottom + 6,
      })
    })

    return () => cancelAnimationFrame(id)
  }, [isHovered])

  return (
    <li
      ref={liRef}
      className="dock-icon group/ability relative flex cursor-pointer items-center justify-center px-[2px]"
      style={{
        '--icon-size': '32px',
        width: '32px',
        height: '32px',
        transition: 'width 150ms cubic-bezier(0.25, 1, 0.5, 1), height 150ms cubic-bezier(0.25, 1, 0.5, 1), margin-top 150ms cubic-bezier(0.25, 1, 0.5, 1)',
      } as React.CSSProperties}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className={cn(
        "relative aspect-square w-full rounded-[10px] border p-0.5 transition-colors",
        "border-lol-light/20 bg-gradient-to-t from-lol-gray to-lol-dark hover:border-lol-gold/40 hover:from-lol-gold/10 hover:to-lol-dark"
      )}>
        {/* Ability name tooltip (like DockIcon) */}
        <span className="absolute top-[-32px] left-1/2 -translate-x-1/2 rounded-md border border-lol-gold/30 bg-lol-dark px-2 py-0.5 text-[10px] whitespace-nowrap text-lol-light opacity-0 transition-opacity duration-200 group-hover/ability:opacity-100 z-50 pointer-events-none">
          {ability.name}
        </span>
        <img
          src={ability.icon}
          alt={ability.name}
          className={cn(
            'h-full w-full object-contain',
            index === 0 ? 'rounded-full' : 'rounded-[inherit]'
          )}
        />
        <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold bg-lol-dark/90 text-lol-light/70 px-0.5 rounded">
          {ability.key}
        </span>
      </div>

      {/* Portal tooltip — escapes overflow clipping, clamped to window edges */}
      {isHovered && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: tooltipPos?.left ?? -9999,
            top: tooltipPos?.top ?? -9999,
            maxWidth: `calc(100vw - ${TOOLTIP_PADDING * 2}px)`,
          }}
        >
          <GlowingTooltip className="w-52 max-w-full">
            <div className="p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <img src={ability.icon} alt={ability.name} className="w-5 h-5 shrink-0 rounded" />
                <span className="text-white text-[11px] font-semibold">{ability.name}</span>
                <span className="text-lol-gold/60 text-[10px]">{ability.key}</span>
              </div>
              <p
                className="text-[9px] text-lol-light/80 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: ability.description }}
              />
            </div>
          </GlowingTooltip>
        </div>,
        document.body
      )}
    </li>
  )
}
