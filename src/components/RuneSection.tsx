import { useState } from 'react'
import { BuildData } from '../types'
import { NeonButton } from './ui/neon-button'

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

      {/* Stat Shards */}
      {runes.statShards.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lol-light/70 text-xs font-semibold uppercase tracking-wider">
              Stat Shards
            </h3>
          </div>
          <div className="flex gap-2">
            {runes.statShards.map((shard, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                {shard.icon ? (
                  <img src={shard.icon} alt={shard.name} className="w-7 h-7 rounded-full border border-lol-light/20" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-lol-gray border border-lol-light/20" />
                )}
                <span className="text-[9px] text-lol-light text-center leading-tight max-w-[50px] truncate">
                  {shard.name}
                </span>
              </div>
            ))}
          </div>
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
