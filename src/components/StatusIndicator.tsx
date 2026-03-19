import { LCUStatus } from '../types'

interface StatusIndicatorProps {
  status: LCUStatus
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-lol-gray/60 rounded-lg border border-lol-gold/10">
      <div className={`w-2 h-2 rounded-full ${status.connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
      <span className="text-xs text-lol-light">{status.message}</span>
    </div>
  )
}
