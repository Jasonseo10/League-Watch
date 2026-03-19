import { SpellInfo } from '../types'

interface SpellSectionProps {
  spells: SpellInfo[]
  onPush: () => Promise<void>
}

export function SpellSection({ spells, onPush }: SpellSectionProps) {
  if (spells.length === 0) return null

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-lol-light/50 uppercase tracking-wider">Spells</span>
        <div className="flex gap-1">
          {spells.map((spell, i) => (
            <div key={i} className="relative group">
              {spell.icon ? (
                <img
                  src={spell.icon}
                  alt={spell.name}
                  className="w-7 h-7 rounded border border-lol-gold/20"
                />
              ) : (
                <div className="w-7 h-7 rounded bg-lol-gray border border-lol-gold/20 flex items-center justify-center text-[8px] text-lol-light">
                  {spell.name.slice(0, 2)}
                </div>
              )}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-lol-dark border border-lol-gold/30 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                {spell.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onPush}
        className="px-3 py-1 bg-lol-red/20 hover:bg-lol-red/30 text-lol-red text-[10px] font-semibold rounded transition flex items-center gap-1"
      >
        Push Spells ▶▶
      </button>
    </div>
  )
}
