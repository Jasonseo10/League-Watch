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
              <ItemIcon key={i} item={item} size="sm" />
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
              <div key={i} className="relative">
                <ItemIcon item={item} size="md" borderColor="border-lol-gold/30" />
                {i < items.core.length - 1 && (
                  <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-lol-gold/30 text-xs">{'\u2192'}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Late Game Options */}
      {(items.fourthItemOptions.length > 0 || items.fifthItemOptions.length > 0 || items.sixthItemOptions.length > 0) && (
        <div>
          <h3 className="text-lol-blue text-xs font-semibold uppercase tracking-wider mb-2">
            Item Alternatives
          </h3>
          <div className="space-y-2">
            <SlotOptions label="4th Item" options={items.fourthItemOptions} />
            <SlotOptions label="5th Item" options={items.fifthItemOptions} />
            <SlotOptions label="6th Item" options={items.sixthItemOptions} />
          </div>
        </div>
      )}

      {/* Push Items Button */}
      <button
        onClick={onPush}
        className="w-full py-2 bg-lol-blue/20 hover:bg-lol-blue/30 text-lol-blue text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2"
      >
        <span>Push Items</span>
        <span className="text-lol-blue/60">{'\u25B6\u25B6'}</span>
      </button>
    </div>
  )
}

function SlotOptions({ label, options }: { label: string; options: BuildData['items']['fourthItemOptions'] }) {
  if (options.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-lol-light/50 w-12 shrink-0">{label}</span>
      <div className="flex gap-1">
        {options.slice(0, 4).map((item, i) => (
          <div key={i} className="relative">
            <ItemIcon
              item={item}
              size="sm"
              borderColor={i === 0 ? 'border-lol-gold/40' : 'border-lol-light/15'}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function ItemIcon({
  item,
  size,
  borderColor = 'border-lol-gold/20',
}: {
  item: { id: number; name: string; icon: string }
  size: 'sm' | 'md'
  borderColor?: string
}) {
  const sizeClass = size === 'sm' ? 'w-9 h-9' : 'w-10 h-10'
  return (
    <div className="relative group">
      <img
        src={item.icon}
        alt={item.name}
        className={`${sizeClass} rounded border ${borderColor}`}
      />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-lol-dark border border-lol-gold/30 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
        {item.name}
      </div>
    </div>
  )
}
