import React from 'react'
import { cn } from '@/lib/utils'

interface GlowingTooltipProps {
  children: React.ReactNode
  className?: string
}

export function GlowingTooltip({ children, className }: GlowingTooltipProps) {
  return (
    <div className={cn("relative group/glow", className)}>
      {/* Outer glow layer 1 - purple/pink conic gradient */}
      <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-lg blur-[3px]
                      before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2
                      before:bg-[conic-gradient(#000,#402fb5_5%,#000_38%,#000_50%,#cf30aa_60%,#000_87%)] before:animate-[spin_4s_linear_infinite]">
      </div>

      {/* Inner glow layer - sharper edge */}
      <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-lg blur-[1px]
                      before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2
                      before:bg-[conic-gradient(rgba(0,0,0,0)_0%,#a099d8,rgba(0,0,0,0)_8%,rgba(0,0,0,0)_50%,#dfa2da,rgba(0,0,0,0)_58%)] before:brightness-150 before:animate-[spin_4s_linear_infinite]">
      </div>

      {/* Solid border layer */}
      <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-lg blur-[0.5px]
                      before:absolute before:content-[''] before:z-[-2] before:w-[600px] before:h-[600px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2
                      before:bg-[conic-gradient(#1c191c,#402fb5_5%,#1c191c_14%,#1c191c_50%,#cf30aa_60%,#1c191c_64%)] before:brightness-125 before:animate-[spin_4s_linear_infinite]">
      </div>

      {/* Content */}
      <div className="relative rounded-lg bg-lol-dark/95">
        {children}
      </div>
    </div>
  )
}
