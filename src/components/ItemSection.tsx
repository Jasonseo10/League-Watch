import { useState } from 'react'
import { BuildData, ItemInfo } from '../types'
import { NeonButton } from './ui/neon-button'
import { AnimatedIcon, TiltedIconRow } from './ui/animated-icon'

interface ItemSectionProps {
  items: BuildData['items']
  onPush: () => Promise<void>
}

export function ItemSection({ items, onPush }: ItemSectionProps) {
  const [hoveredStarting, setHoveredStarting] = useState<number | null>(null)
  const [hoveredCore, setHoveredCore] = useState<number | null>(null)
  const [hoveredSlot4, setHoveredSlot4] = useState<number | null>(null)
  const [hoveredSlot5, setHoveredSlot5] = useState<number | null>(null)
  const [hoveredSlot6, setHoveredSlot6] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {/* Starting Items */}
      {items.starting.length > 0 && (
        <div>
          <h3 className="text-lol-light text-xs font-semibold uppercase tracking-wider mb-2">
            Starting Items
          </h3>
          <TiltedIconRow className="flex gap-1.5">
            {items.starting.map((item, i) => (
              <AnimatedIcon
                key={i}
                src={item.icon}
                alt={item.name}
                name={item.name}
                description={item.description}
                size="sm"
                rounded="sm"
                borderColor="border-lol-gold/20"
                iconId={i}
                hoveredId={hoveredStarting}
                onHoverStart={() => setHoveredStarting(i)}
                onHoverEnd={() => setHoveredStarting(null)}
              />
            ))}
          </TiltedIconRow>
        </div>
      )}

      {/* Core Build */}
      {items.core.length > 0 && (
        <div>
          <h3 className="text-lol-gold text-xs font-semibold uppercase tracking-wider mb-2">
            Core Build
          </h3>
          <TiltedIconRow className="flex gap-1.5">
            {items.core.map((item, i) => (
              <div key={i} className="relative">
                <AnimatedIcon
                  src={item.icon}
                  alt={item.name}
                  name={item.name}
                  description={item.description}
                  size="md"
                  rounded="sm"
                  borderColor="border-lol-gold/30"
                  iconId={i}
                  hoveredId={hoveredCore}
                  onHoverStart={() => setHoveredCore(i)}
                  onHoverEnd={() => setHoveredCore(null)}
                />
                {i < items.core.length - 1 && (
                  <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-lol-gold/30 text-xs">{'\u2192'}</span>
                )}
              </div>
            ))}
          </TiltedIconRow>
        </div>
      )}

      {/* Late Game Options */}
      {(items.fourthItemOptions.length > 0 || items.fifthItemOptions.length > 0 || items.sixthItemOptions.length > 0) && (
        <div>
          <h3 className="text-lol-blue text-xs font-semibold uppercase tracking-wider mb-2">
            Item Alternatives
          </h3>
          <div className="space-y-2">
            <SlotOptions
              label="4th Item"
              options={items.fourthItemOptions}
              hoveredId={hoveredSlot4}
              onHoverStart={(i) => setHoveredSlot4(i)}
              onHoverEnd={() => setHoveredSlot4(null)}
            />
            <SlotOptions
              label="5th Item"
              options={items.fifthItemOptions}
              hoveredId={hoveredSlot5}
              onHoverStart={(i) => setHoveredSlot5(i)}
              onHoverEnd={() => setHoveredSlot5(null)}
            />
            <SlotOptions
              label="6th Item"
              options={items.sixthItemOptions}
              hoveredId={hoveredSlot6}
              onHoverStart={(i) => setHoveredSlot6(i)}
              onHoverEnd={() => setHoveredSlot6(null)}
            />
          </div>
        </div>
      )}

      {/* Push Items Button */}
      <NeonButton onClick={onPush} variant="teal" size="default" className="w-full text-lol-blue text-xs font-semibold">
        Push Items ▶▶
      </NeonButton>
    </div>
  )
}

function SlotOptions({
  label,
  options,
  hoveredId,
  onHoverStart,
  onHoverEnd,
}: {
  label: string
  options: ItemInfo[]
  hoveredId: number | null
  onHoverStart: (i: number) => void
  onHoverEnd: () => void
}) {
  if (options.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-lol-light/50 w-12 shrink-0">{label}</span>
      <TiltedIconRow className="flex gap-1">
        {options.slice(0, 4).map((item, i) => (
          <AnimatedIcon
            key={i}
            src={item.icon}
            alt={item.name}
            name={item.name}
            description={item.description}
            size="sm"
            rounded="sm"
            borderColor={i === 0 ? 'border-lol-gold/40' : 'border-lol-light/15'}
            iconId={i}
            hoveredId={hoveredId}
            onHoverStart={() => onHoverStart(i)}
            onHoverEnd={onHoverEnd}
          />
        ))}
      </TiltedIconRow>
    </div>
  )
}
