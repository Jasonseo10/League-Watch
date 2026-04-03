import { LCUStatus } from '../types'

interface StatusIndicatorProps {
  status: LCUStatus
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  return (
    <div className="relative">
      {/* Glowing border layers */}
      <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-full blur-[3px]
                      before:absolute before:content-[''] before:z-[-2] before:w-[400px] before:h-[400px] before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2
                      before:bg-[conic-gradient(#000,#402fb5_5%,#000_38%,#000_50%,#cf30aa_60%,#000_87%)] before:animate-[spin_4s_linear_infinite]" />
      <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-full blur-[1px]
                      before:absolute before:content-[''] before:z-[-2] before:w-[400px] before:h-[400px] before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2
                      before:bg-[conic-gradient(rgba(0,0,0,0)_0%,#a099d8,rgba(0,0,0,0)_8%,rgba(0,0,0,0)_50%,#dfa2da,rgba(0,0,0,0)_58%)] before:brightness-150 before:animate-[spin_4s_linear_infinite]" />

      {/* Pill content */}
      <div className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lol-dark/95`}>
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
        <span className="text-[10px] font-medium text-lol-light/80 whitespace-nowrap">
          {status.connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </div>
  )
}
