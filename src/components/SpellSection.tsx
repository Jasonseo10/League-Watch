import { useState } from 'react'
import { SpellInfo } from '../types'
import { NeonButton } from './ui/neon-button'
import { AnimatedIcon, TiltedIconRow } from './ui/animated-icon'

interface SpellSectionProps {
  spells: SpellInfo[]
  swapped: boolean
  onSwap: () => void
  onPush: () => Promise<void>
}

export function SpellSection({ spells, swapped, onSwap, onPush }: SpellSectionProps) {
  const [hoveredSpell, setHoveredSpell] = useState<number | null>(null)

  if (spells.length === 0) return null

  const displaySpells = swapped ? [spells[1], spells[0]] : spells

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-lol-light/50 uppercase tracking-wider">Spells</span>
        <TiltedIconRow className="flex items-center gap-0.5">
          {/* First spell (D) */}
          <AnimatedIcon
            src={displaySpells[0]?.icon ?? ''}
            alt={displaySpells[0]?.name ?? ''}
            name={displaySpells[0]?.name ?? ''}
            description={displaySpells[0]?.description}
            size="sm"
            rounded="sm"
            borderColor="border-lol-gold/20"
            iconId={0}
            hoveredId={hoveredSpell}
            onHoverStart={() => setHoveredSpell(0)}
            onHoverEnd={() => setHoveredSpell(null)}
            badge={
              <span className="absolute -bottom-0.5 -right-0.5 bg-lol-dark text-[7px] text-lol-light/60 px-0.5 rounded font-bold">D</span>
            }
          />

          {/* Swap button */}
          <button
            onClick={onSwap}
            className="w-5 h-5 flex items-center justify-center text-[10px] text-lol-light/40 hover:text-lol-gold transition rounded hover:bg-lol-gold/10"
            title="Swap D/F"
          >
            {'\u21C4'}
          </button>

          {/* Second spell (F) */}
          <AnimatedIcon
            src={displaySpells[1]?.icon ?? ''}
            alt={displaySpells[1]?.name ?? ''}
            name={displaySpells[1]?.name ?? ''}
            description={displaySpells[1]?.description}
            size="sm"
            rounded="sm"
            borderColor="border-lol-gold/20"
            iconId={1}
            hoveredId={hoveredSpell}
            onHoverStart={() => setHoveredSpell(1)}
            onHoverEnd={() => setHoveredSpell(null)}
            badge={
              <span className="absolute -bottom-0.5 -right-0.5 bg-lol-dark text-[7px] text-lol-light/60 px-0.5 rounded font-bold">F</span>
            }
          />
        </TiltedIconRow>
      </div>

      <NeonButton onClick={onPush} variant="red" size="sm" className="text-lol-red text-[10px] font-semibold">
        Push Spells ▶▶
      </NeonButton>
    </div>
  )
}
