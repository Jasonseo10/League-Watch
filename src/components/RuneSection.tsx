import { useState } from 'react'
import { BuildData } from '../types'
import { NeonButton } from './ui/neon-button'
import { AnimatedIcon, TiltedIconRow } from './ui/animated-icon'

interface RuneSectionProps {
  runes: BuildData['runes']
  skills: BuildData['skills']
  onPush: () => Promise<void>
}

const SKILL_COLORS: Record<string, string> = {
  Q: 'bg-blue-500/30 border-blue-400/50 text-blue-300',
  W: 'bg-green-500/30 border-green-400/50 text-green-300',
  E: 'bg-orange-500/30 border-orange-400/50 text-orange-300',
  R: 'bg-purple-500/30 border-purple-400/50 text-purple-300',
}

export function RuneSection({ runes, skills, onPush }: RuneSectionProps) {
  const [showLevelOrder, setShowLevelOrder] = useState(false)
  const [hoveredKeystone, setHoveredKeystone] = useState<number | null>(null)
  const [hoveredPrimary, setHoveredPrimary] = useState<number | null>(null)
  const [hoveredSub, setHoveredSub] = useState<number | null>(null)
  const [hoveredShard, setHoveredShard] = useState<number | null>(null)

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
        <TiltedIconRow  className="flex items-center gap-2 mb-2">
          <AnimatedIcon
            src={runes.keystone.icon}
            alt={runes.keystone.name}
            name={runes.keystone.name}
            description={runes.keystone.description}
            size="lg"
            rounded="full"
            borderColor="border-2 border-lol-gold/50"
            iconId={0}
            hoveredId={hoveredKeystone}
            onHoverStart={() => setHoveredKeystone(0)}
            onHoverEnd={() => setHoveredKeystone(null)}
            label={
              <span className="text-white text-sm font-medium mt-1">{runes.keystone.name}</span>
            }
          />
        </TiltedIconRow>

        {/* Primary Perks */}
        <TiltedIconRow  className="flex gap-2">
          {runes.primaryPerks.map((perk, i) => (
            <AnimatedIcon
              key={i}
              src={perk.icon}
              alt={perk.name}
              name={perk.name}
              description={perk.description}
              size="sm"
              rounded="full"
              borderColor="border-lol-gold/20"
              iconId={i}
              hoveredId={hoveredPrimary}
              onHoverStart={() => setHoveredPrimary(i)}
              onHoverEnd={() => setHoveredPrimary(null)}
              label={
                <span className="text-[9px] text-lol-light text-center leading-tight max-w-[50px] truncate mt-1">
                  {perk.name}
                </span>
              }
            />
          ))}
        </TiltedIconRow>
      </div>

      {/* Secondary Tree */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lol-blue text-xs font-semibold uppercase tracking-wider">
            {runes.subTree}
          </h3>
          <span className="text-lol-light/50 text-[10px]">Secondary</span>
        </div>

        <TiltedIconRow  className="flex gap-2">
          {runes.subPerks.map((perk, i) => (
            <AnimatedIcon
              key={i}
              src={perk.icon}
              alt={perk.name}
              name={perk.name}
              description={perk.description}
              size="sm"
              rounded="full"
              borderColor="border-lol-blue/20"
              iconId={i}
              hoveredId={hoveredSub}
              onHoverStart={() => setHoveredSub(i)}
              onHoverEnd={() => setHoveredSub(null)}
              label={
                <span className="text-[9px] text-lol-light text-center leading-tight max-w-[50px] truncate mt-1">
                  {perk.name}
                </span>
              }
            />
          ))}
        </TiltedIconRow>
      </div>

      {/* Stat Shards */}
      {runes.statShards.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lol-light/70 text-xs font-semibold uppercase tracking-wider">
              Stat Shards
            </h3>
          </div>
          <TiltedIconRow  className="flex gap-2">
            {runes.statShards.map((shard, i) => (
              <AnimatedIcon
                key={i}
                src={shard.icon}
                alt={shard.name}
                name={shard.name}
                description={shard.description}
                size="sm"
                rounded="full"
                borderColor="border-lol-light/20"
                iconId={i}
                hoveredId={hoveredShard}
                onHoverStart={() => setHoveredShard(i)}
                onHoverEnd={() => setHoveredShard(null)}
                  label={
                  <span className="text-[9px] text-lol-light text-center leading-tight max-w-[50px] truncate mt-1">
                    {shard.name}
                  </span>
                }
              />
            ))}
          </TiltedIconRow>
        </div>
      )}

      {/* Push Runes Button */}
      <NeonButton onClick={onPush} variant="gold" size="default" className="w-full text-lol-gold text-xs font-semibold">
        Push Runes ▶▶
      </NeonButton>

      {/* Skill Max Order */}
      {skills.order.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowLevelOrder(prev => !prev)}
            className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg bg-lol-gray/50 hover:bg-lol-gray/80 transition"
          >
            <span className="text-lol-light/70 text-[10px] font-semibold uppercase tracking-wider">
              Skill Order
            </span>
            <div className="flex items-center gap-1.5">
              {skills.order.map((skill, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className={`w-6 h-6 rounded text-[11px] font-bold flex items-center justify-center border ${SKILL_COLORS[skill] || 'bg-lol-gray border-lol-light/20 text-white'}`}>
                    {skill}
                  </span>
                  {i < skills.order.length - 1 && (
                    <span className="text-lol-gold/50 text-xs">›</span>
                  )}
                </div>
              ))}
              <span className="text-lol-light/40 text-[10px] ml-1">{showLevelOrder ? '▲' : '▼'}</span>
            </div>
          </button>

          {/* Level-by-level popup */}
          {showLevelOrder && skills.levelOrder.length > 0 && (
            <div className="mt-2 p-2 rounded-lg bg-lol-dark/95 border border-lol-gold/20">
              <div className="grid grid-cols-9 gap-1">
                {skills.levelOrder.slice(0, 18).map((skill, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-[8px] text-lol-light/50 mb-0.5">{i + 1}</span>
                    <div className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center border ${SKILL_COLORS[skill] || 'bg-lol-gray border-lol-light/20 text-white'}`}>
                      {skill}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
