import { BuildData } from '../types'

interface RuneSectionProps {
  runes: BuildData['runes']
  onPush: () => Promise<void>
}

export function RuneSection({ runes, onPush }: RuneSectionProps) {
  return (
    <div className="space-y-3">
      {/* Primary Tree */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lol-gold text-xs font-semibold uppercase tracking-wider">
            {runes.primaryTree}
          </h3>
          <span className="text-lol-light/50 text-[10px]">Primary</span>
        </div>

        {/* Keystone */}
        <div className="flex items-center gap-2 mb-2">
          {runes.keystone.icon && (
            <img
              src={runes.keystone.icon}
              alt={runes.keystone.name}
              className="w-10 h-10 rounded-full border-2 border-lol-gold/50"
            />
          )}
          <span className="text-white text-sm font-medium">{runes.keystone.name}</span>
        </div>

        {/* Primary Perks */}
        <div className="flex gap-2">
          {runes.primaryPerks.map((perk, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              {perk.icon ? (
                <img src={perk.icon} alt={perk.name} className="w-7 h-7 rounded-full border border-lol-gold/20" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-lol-gray border border-lol-gold/20" />
              )}
              <span className="text-[9px] text-lol-light text-center leading-tight max-w-[50px] truncate">
                {perk.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Tree */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lol-blue text-xs font-semibold uppercase tracking-wider">
            {runes.subTree}
          </h3>
          <span className="text-lol-light/50 text-[10px]">Secondary</span>
        </div>

        <div className="flex gap-2">
          {runes.subPerks.map((perk, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              {perk.icon ? (
                <img src={perk.icon} alt={perk.name} className="w-7 h-7 rounded-full border border-lol-blue/20" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-lol-gray border border-lol-blue/20" />
              )}
              <span className="text-[9px] text-lol-light text-center leading-tight max-w-[50px] truncate">
                {perk.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Push Runes Button */}
      <button
        onClick={onPush}
        className="w-full py-2 bg-lol-gold/20 hover:bg-lol-gold/30 text-lol-gold text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2"
      >
        <span>Push Runes</span>
        <span className="text-lol-gold/60">▶▶</span>
      </button>
    </div>
  )
}
