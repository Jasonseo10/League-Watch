import { BuildData } from '../types'

interface SkillOrderProps {
  skills: BuildData['skills']
}

const SKILL_COLORS: Record<string, string> = {
  Q: 'bg-blue-500/30 border-blue-400/50 text-blue-300',
  W: 'bg-green-500/30 border-green-400/50 text-green-300',
  E: 'bg-orange-500/30 border-orange-400/50 text-orange-300',
  R: 'bg-purple-500/30 border-purple-400/50 text-purple-300',
}

export function SkillOrder({ skills }: SkillOrderProps) {
  return (
    <div className="space-y-3">
      {/* Skill Priority */}
      <div>
        <h3 className="text-lol-gold text-xs font-semibold uppercase tracking-wider mb-2">
          Skill Max Order
        </h3>
        <div className="flex items-center gap-2">
          {skills.order.map((skill, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-lg ${SKILL_COLORS[skill] || 'bg-lol-gray border-lol-light/20 text-white'}`}>
                {skill}
              </div>
              {i < skills.order.length - 1 && (
                <span className="text-lol-gold/50 text-lg">›</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Level-by-level order */}
      {skills.levelOrder.length > 0 && (
        <div>
          <h3 className="text-lol-light text-xs font-semibold uppercase tracking-wider mb-2">
            Level-by-Level
          </h3>
          <div className="grid grid-cols-9 gap-1">
            {skills.levelOrder.slice(0, 18).map((skill, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[9px] text-lol-light/50 mb-0.5">{i + 1}</span>
                <div className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center border ${SKILL_COLORS[skill] || 'bg-lol-gray border-lol-light/20 text-white'}`}>
                  {skill}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
