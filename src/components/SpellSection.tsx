import { SpellInfo } from '../types'

interface SpellSectionProps {
  spells: SpellInfo[]
  swapped: boolean
  onSwap: () => void
  onPush: () => Promise<void>
}

export function SpellSection({ spells, swapped, onSwap, onPush }: SpellSectionProps) {
  if (spells.length === 0) return null

  const displaySpells = swapped ? [spells[1], spells[0]] : spells

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-lol-light/50 uppercase tracking-wider">Spells</span>
        <div className="flex items-center gap-0.5">
          {/* First spell (D) */}
          <div className="relative group">
            <div className="relative">
              {displaySpells[0]?.icon ? (
                <img
                  src={displaySpells[0].icon}
                  alt={displaySpells[0].name}
                  className="w-7 h-7 rounded border border-lol-gold/20"
                />
              ) : (
                <div className="w-7 h-7 rounded bg-lol-gray border border-lol-gold/20 flex items-center justify-center text-[8px] text-lol-light">
                  {displaySpells[0]?.name.slice(0, 2)}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 bg-lol-dark text-[7px] text-lol-light/60 px-0.5 rounded font-bold">D</span>
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-lol-dark border border-lol-gold/30 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
              {displaySpells[0]?.name}
            </div>
          </div>

          {/* Swap button */}
          <button
            onClick={onSwap}
            className="w-5 h-5 flex items-center justify-center text-[10px] text-lol-light/40 hover:text-lol-gold transition rounded hover:bg-lol-gold/10"
            title="Swap D/F"
          >
            {'\u21C4'}
          </button>

          {/* Second spell (F) */}
          <div className="relative group">
            <div className="relative">
              {displaySpells[1]?.icon ? (
                <img
                  src={displaySpells[1].icon}
                  alt={displaySpells[1].name}
                  className="w-7 h-7 rounded border border-lol-gold/20"
                />
              ) : (
                <div className="w-7 h-7 rounded bg-lol-gray border border-lol-gold/20 flex items-center justify-center text-[8px] text-lol-light">
                  {displaySpells[1]?.name.slice(0, 2)}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 bg-lol-dark text-[7px] text-lol-light/60 px-0.5 rounded font-bold">F</span>
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-lol-dark border border-lol-gold/30 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
              {displaySpells[1]?.name}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onPush}
        className="px-3 py-1 bg-lol-red/20 hover:bg-lol-red/30 text-lol-red text-[10px] font-semibold rounded transition flex items-center gap-1"
      >
        Push Spells {'\u25B6\u25B6'}
      </button>
    </div>
  )
}
