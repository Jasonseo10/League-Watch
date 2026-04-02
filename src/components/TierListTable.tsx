import { useState, useEffect, useRef } from 'react'
import { TierEntry, CounterChamp } from '../types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { cn } from '../lib/utils'

const ROLES = [
  { label: 'All',  code: 'all', icon: '⚔' },
  { label: 'Top',  code: '4',   icon: '🛡' },
  { label: 'JGL',  code: '1',   icon: '🌲' },
  { label: 'Mid',  code: '5',   icon: '🔮' },
  { label: 'ADC',  code: '3',   icon: '🏹' },
  { label: 'Sup',  code: '2',   icon: '💊' },
]

const TIER_COLORS: Record<string, string> = {
  S: 'text-yellow-300 border-yellow-400/40 bg-yellow-400/10',
  A: 'text-green-300  border-green-400/40  bg-green-400/10',
  B: 'text-blue-300   border-blue-400/40   bg-blue-400/10',
  C: 'text-orange-300 border-orange-400/40 bg-orange-400/10',
  D: 'text-red-400    border-red-400/40    bg-red-400/10',
}

const TIER_LIST_WIDTH = 460
const BUILD_WIDTH    = 340

const DDR_BASE = 'https://ddragon.leagueoflegends.com/cdn'
const champIcon = (id: string, v: string) => `${DDR_BASE}/${v}/img/champion/${id}.png`

interface TierListTableProps {
  ddragonVersion: string
}

export function TierListTable({ ddragonVersion }: TierListTableProps) {
  const [entries,     setEntries]     = useState<TierEntry[]>([])
  const [loading,     setLoading]     = useState(true)
  const [selectedRole, setSelectedRole] = useState('all')
  // counterMap: "champKey-roleCode" → CounterChamp[] (only set when loaded)
  const [counterMap,  setCounterMap]  = useState<Record<string, CounterChamp[]>>({})
  // pendingSet tracks which keys are currently being fetched (avoids duplicate requests)
  const pendingRef = useRef<Set<string>>(new Set())

  // Widen overlay on mount, restore on unmount
  useEffect(() => {
    window.leagueWatch?.setWindowWidth(TIER_LIST_WIDTH)
    return () => { window.leagueWatch?.setWindowWidth(BUILD_WIDTH) }
  }, [])

  // Fetch tier list once on mount
  useEffect(() => {
    if (!window.leagueWatch) return
    setLoading(true)
    window.leagueWatch.getTierList('17')
      .then(data => { setEntries(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = selectedRole === 'all'
    ? entries
    : entries.filter(e => e.roleCode === selectedRole)

  // Fetch counters for visible entries (up to 30) when role or entries change
  useEffect(() => {
    if (!window.leagueWatch || filtered.length === 0) return
    const visible = filtered.slice(0, 30)
    for (const entry of visible) {
      const key = `${entry.championKey}-${entry.roleCode}`
      if (counterMap[key] !== undefined) continue  // already have data
      if (pendingRef.current.has(key)) continue     // already in-flight
      pendingRef.current.add(key)
      window.leagueWatch.getCounters(entry.championKey, entry.roleCode, '17')
        .then(counters => {
          setCounterMap(prev => ({ ...prev, [key]: counters }))
        })
        .catch(() => {
          setCounterMap(prev => ({ ...prev, [key]: [] })) // mark as loaded (empty)
        })
        .finally(() => { pendingRef.current.delete(key) })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length, selectedRole])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-full">

        {/* Role filter */}
        <div className="flex items-center gap-1 px-2 pt-2 pb-1 border-b border-lol-gold/10 flex-shrink-0">
          {ROLES.map(role => (
            <button
              key={role.code}
              onClick={() => setSelectedRole(role.code)}
              className={cn(
                'flex-1 flex flex-col items-center py-1 rounded-lg text-[9px] font-semibold transition-all duration-150 border',
                selectedRole === role.code
                  ? 'bg-lol-gold/20 border-lol-gold/50 text-lol-gold'
                  : 'bg-lol-gray/30 border-lol-light/10 text-lol-light/60 hover:border-lol-gold/30 hover:text-lol-light'
              )}
            >
              <span className="text-[11px] leading-none mb-0.5">{role.icon}</span>
              {role.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-lol-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-lol-light/50 text-[10px]">Loading tier list...</p>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-lol-light/40 text-[10px]">No data available</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-lol-gold/20 scrollbar-track-transparent">
            <Table>
              <TableHeader className="sticky top-0 bg-lol-dark/95 z-10">
                <TableRow className="border-b border-lol-gold/20">
                  <TableHead className="w-7 px-1">Tier</TableHead>
                  <TableHead className="px-1">Champion</TableHead>
                  <TableHead className="w-11 text-right px-1">WR</TableHead>
                  <TableHead className="w-10 text-right px-1">PR</TableHead>
                  <TableHead className="w-10 text-right px-1">BR</TableHead>
                  <TableHead className="w-16 px-1">Counters</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry, i) => {
                  const counterKey = `${entry.championKey}-${entry.roleCode}`
                  const counters = counterMap[counterKey]    // undefined = not yet loaded
                  const isPending = counterMap[counterKey] === undefined
                  return (
                    <TableRow key={`${entry.championKey}-${entry.roleCode}-${i}`}>

                      {/* Tier badge */}
                      <TableCell className="px-1">
                        <span className={cn(
                          'inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold border',
                          TIER_COLORS[entry.tier] ?? ''
                        )}>
                          {entry.tier}
                        </span>
                      </TableCell>

                      {/* Champion icon + name */}
                      <TableCell className="px-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 cursor-default">
                              {ddragonVersion && (
                                <img
                                  src={champIcon(entry.championDDragonId, ddragonVersion)}
                                  alt={entry.championName}
                                  className="w-6 h-6 rounded border border-lol-gold/20 flex-shrink-0"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                              )}
                              <div className="min-w-0">
                                <p className="text-white text-[10px] font-medium leading-none truncate max-w-[65px]">
                                  {entry.championName}
                                </p>
                                <p className="text-lol-light/40 text-[9px] capitalize mt-0.5">{entry.role}</p>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            {entry.championName} · {entry.role} · {entry.games.toLocaleString()} games
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      {/* Win rate */}
                      <TableCell className="px-1 text-right">
                        <span className={cn(
                          'text-[10px] font-semibold',
                          entry.winRateNum >= 54 ? 'text-yellow-300' :
                          entry.winRateNum >= 52 ? 'text-green-300' :
                          entry.winRateNum >= 50 ? 'text-lol-light' :
                          'text-lol-red/80'
                        )}>
                          {entry.winRate}
                        </span>
                      </TableCell>

                      {/* Pick rate */}
                      <TableCell className="px-1 text-right">
                        <span className="text-[10px] text-lol-light/70">{entry.pickRate}</span>
                      </TableCell>

                      {/* Ban rate */}
                      <TableCell className="px-1 text-right">
                        <span className={cn(
                          'text-[10px]',
                          entry.banRate !== 'N/A' && parseFloat(entry.banRate) >= 10
                            ? 'text-lol-red/80'
                            : 'text-lol-light/60'
                        )}>
                          {entry.banRate}
                        </span>
                      </TableCell>

                      {/* Top 3 counter icons */}
                      <TableCell className="px-1">
                        <div className="flex items-center gap-0.5">
                          {isPending ? (
                            // Still loading
                            <div className="w-3 h-3 border border-lol-light/20 border-t-transparent rounded-full animate-spin" />
                          ) : !counters || counters.length === 0 ? (
                            <span className="text-lol-light/20 text-[9px]">—</span>
                          ) : (
                            counters.map(c => (
                              <Tooltip key={c.championKey}>
                                <TooltipTrigger asChild>
                                  <img
                                    src={ddragonVersion ? champIcon(c.championDDragonId, ddragonVersion) : ''}
                                    alt={c.championName}
                                    className="w-5 h-5 rounded border border-lol-red/30 cursor-default"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                  />
                                </TooltipTrigger>
                                <TooltipContent side="left">{c.championName}</TooltipContent>
                              </Tooltip>
                            ))
                          )}
                        </div>
                      </TableCell>

                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Footer */}
        {!loading && entries.length > 0 && (
          <div className="px-3 py-1 border-t border-lol-gold/10 flex-shrink-0">
            <p className="text-lol-light/30 text-[9px]">
              {filtered.length} champions · Emerald+ · Patch data
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
