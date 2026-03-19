import { BuildData } from '../types'

interface ItemSectionProps {
  items: BuildData['items']
  onPush: () => Promise<void>
}

export function ItemSection({ items, onPush }: ItemSectionProps) {
  return (
    <div className="space-y-3">
      {/* Starting Items */}
      {items.starting.length > 0 && (
        <div>
          <h3 className="text-lol-light text-xs font-semibold uppercase tracking-wider mb-2">
            Starting Items
          </h3>
          <div className="flex gap-1.5">
            {items.starting.map((item, i) => (
              <div key={i} className="relative group">
                <img
                  src={item.icon}
                  alt={item.name}
                  className="w-9 h-9 rounded border border-lol-gold/20"
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-lol-dark border border-lol-gold/30 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Core Build */}
      {items.core.length > 0 && (
        <div>
          <h3 className="text-lol-gold text-xs font-semibold uppercase tracking-wider mb-2">
            Core Build
          </h3>
          <div className="flex gap-1.5">
            {items.core.map((item, i) => (
              <div key={i} className="relative group">
                <img
                  src={item.icon}
                  alt={item.name}
                  className="w-10 h-10 rounded border border-lol-gold/30"
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-lol-dark border border-lol-gold/30 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                  {item.name}
                </div>
                {i < items.core.length - 1 && (
                  <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-lol-gold/30 text-xs">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Build */}
      {items.fullBuild.length > 0 && (
        <div>
          <h3 className="text-lol-light text-xs font-semibold uppercase tracking-wider mb-2">
            Full Build
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {items.fullBuild.map((item, i) => (
              <div key={i} className="relative group">
                <img
                  src={item.icon}
                  alt={item.name}
                  className="w-9 h-9 rounded border border-lol-light/20"
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-lol-dark border border-lol-gold/30 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Push Items Button */}
      <button
        onClick={onPush}
        className="w-full py-2 bg-lol-blue/20 hover:bg-lol-blue/30 text-lol-blue text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2"
      >
        <span>Push Items</span>
        <span className="text-lol-blue/60">▶▶</span>
      </button>
    </div>
  )
}
