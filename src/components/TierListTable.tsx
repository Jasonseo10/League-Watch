import { useState, useEffect, useRef } from 'react'
import { TierEntry, CounterChamp, RankOption, QueueOption, RegionOption } from '../types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { RankFluidSelector } from './ui/fluid-menu'
import { cn } from '../lib/utils'

/* ── Role icons (inline SVG paths matching u.gg style) ── */
const ROLES = [
  { label: 'All',  code: 'all' },
  { label: 'Top',  code: '4'   },
  { label: 'JGL',  code: '1'   },
  { label: 'Mid',  code: '5'   },
  { label: 'ADC',  code: '3'   },
  { label: 'Sup',  code: '2'   },
]

// Compact role icon SVGs (16×16)
function RoleIcon({ code, className }: { code: string; className?: string }) {
  const cls = cn('w-3.5 h-3.5', className)
  switch (code) {
    case 'all':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1l2.5 5H14l-4 3.5 1.5 5.5L8 12l-3.5 3 1.5-5.5L2 6h3.5z" />
        </svg>
      )
    case '4': // Top
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 2h5v5H2zM2 9h3v5H2zM9 2h5v3H9zM9 7h5v7H9z" opacity="0.3" />
          <path d="M2 2h5v5H2z" opacity="1" />
        </svg>
      )
    case '1': // Jungle
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1C5 4 3 7 3 10a5 5 0 0010 0c0-3-2-6-5-9zm0 12a3 3 0 01-3-3c0-1.5 1-3.5 3-6 2 2.5 3 4.5 3 6a3 3 0 01-3 3z" />
        </svg>
      )
    case '5': // Mid
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 2h12v12H2z" opacity="0.15" />
          <path d="M2 2h4v4H2zM10 10h4v4H10z" opacity="0.3" />
          <path d="M2 2l12 12" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.9" />
        </svg>
      )
    case '3': // ADC
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 2h5v5H2zM2 9h3v5H2zM9 2h5v3H9zM9 7h5v7H9z" opacity="0.3" />
          <path d="M9 7h5v7H9z" opacity="1" />
        </svg>
      )
    case '2': // Support
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 3a2 2 0 100 4 2 2 0 000-4zM4 10c0-1.5 2-2.5 4-2.5s4 1 4 2.5v1H4v-1z" />
          <path d="M13 5l-1.5 1.5M3 5l1.5 1.5M8 1v1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      )
    default:
      return null
  }
}

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
  const [entries,      setEntries]      = useState<TierEntry[]>([])
  const [loading,      setLoading]      = useState(true)
  const [selectedRole, setSelectedRole] = useState('all')
  const [counterMap,   setCounterMap]   = useState<Record<string, CounterChamp[]>>({})
  const pendingRef = useRef<Set<string>>(new Set())

  // Filter state
  const [selectedRank,   setSelectedRank]   = useState('17')
  const [selectedQueue,  setSelectedQueue]  = useState('ranked_solo_5x5')
  const [selectedRegion, setSelectedRegion] = useState('12')

  // Options loaded from backend
  const [rankOptions,   setRankOptions]   = useState<RankOption[]>([])
  const [queueOptions,  setQueueOptions]  = useState<QueueOption[]>([])
  const [regionOptions, setRegionOptions] = useState<RegionOption[]>([])

  // Widen overlay on mount, restore on unmount
  useEffect(() => {
    window.leagueWatch?.setWindowWidth(TIER_LIST_WIDTH)
    return () => { window.leagueWatch?.setWindowWidth(BUILD_WIDTH) }
  }, [])

  // Load filter options once
  useEffect(() => {
    if (!window.leagueWatch) return
    Promise.all([
      window.leagueWatch.getRankOptions(),
      window.leagueWatch.getQueueOptions(),
      window.leagueWatch.getRegionOptions(),
    ]).then(([ranks, queues, regions]) => {
      setRankOptions(ranks)
      setQueueOptions(queues)
      setRegionOptions(regions)
    })
  }, [])

  // Fetch tier list when filters change
  useEffect(() => {
    if (!window.leagueWatch) return
    setLoading(true)
    setCounterMap({})
    pendingRef.current.clear()
    window.leagueWatch.getTierList(selectedRank, selectedQueue, selectedRegion)
      .then(data => { setEntries(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedRank, selectedQueue, selectedRegion])

  const filtered = selectedRole === 'all'
    ? entries
    : entries.filter(e => e.roleCode === selectedRole)

  // Fetch counters for visible entries
  useEffect(() => {
    if (!window.leagueWatch || filtered.length === 0) return
    const visible = filtered.slice(0, 30)
    for (const entry of visible) {
      const key = `${entry.championKey}-${entry.roleCode}`
      if (counterMap[key] !== undefined) continue
      if (pendingRef.current.has(key)) continue
      pendingRef.current.add(key)
      window.leagueWatch.getCounters(entry.championKey, entry.roleCode, selectedRank, selectedQueue, selectedRegion)
        .then(counters => {
          setCounterMap(prev => ({ ...prev, [key]: counters }))
        })
        .catch(() => {
          setCounterMap(prev => ({ ...prev, [key]: [] }))
        })
        .finally(() => { pendingRef.current.delete(key) })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length, selectedRole, selectedRank, selectedQueue, selectedRegion])

  const currentRankLabel   = rankOptions.find(r => r.code === selectedRank)?.label   || 'Emerald+'
  const currentQueueLabel  = queueOptions.find(q => q.code === selectedQueue)?.label  || 'Ranked Solo'
  const currentRegionLabel = regionOptions.find(r => r.code === selectedRegion)?.label || 'World'

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-full">

        {/* Filter bar: Roles + Dropdowns — all on one row */}
        <div className="flex items-center gap-1.5 px-2 pt-2 pb-1.5 border-b border-lol-gold/10 flex-shrink-0">

          {/* Compact role icons */}
          <div className="flex items-center gap-0.5">
            {ROLES.map(role => (
              <button
                key={role.code}
                onClick={() => setSelectedRole(role.code)}
                className={cn(
                  'w-6 h-6 flex items-center justify-center rounded transition-all duration-150 border',
                  selectedRole === role.code
                    ? 'bg-lol-gold/20 border-lol-gold/50 text-lol-gold'
                    : 'bg-lol-gray/30 border-transparent text-lol-light/40 hover:border-lol-gold/30 hover:text-lol-light/70'
                )}
                title={role.label}
              >
                <RoleIcon code={role.code} />
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Filter dropdowns */}
          <div className="flex items-center gap-1">
            <RankFluidSelector
              options={rankOptions}
              selected={selectedRank}
              onChange={setSelectedRank}
            />
            <RankFluidSelector
              options={queueOptions}
              selected={selectedQueue}
              onChange={setSelectedQueue}
            />
            <RankFluidSelector
              options={regionOptions}
              selected={selectedRegion}
              onChange={setSelectedRegion}
            />
          </div>
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
                  const counters = counterMap[counterKey]
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
              {filtered.length} champions · {currentRankLabel} · {currentQueueLabel} · {currentRegionLabel}
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
