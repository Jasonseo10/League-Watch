"use client"

import React, { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

// ── Rank Fluid Selector ────────────────────────────────────────────────────

interface RankOption {
  label: string
  code: string
}

interface RankFluidSelectorProps {
  options: RankOption[]
  selected: string
  onChange: (code: string) => void
}

export function RankFluidSelector({ options, selected, onChange }: RankFluidSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedLabel = options.find(o => o.code === selected)?.label ?? ''

  // Close on outside click
  useEffect(() => {
    if (!isExpanded) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isExpanded])

  return (
    <div ref={containerRef} className="relative">

      {/* Trigger pill */}
      <div
        onClick={() => setIsExpanded(v => !v)}
        className={cn(
          'flex items-center gap-1 px-2.5 py-1 rounded-full cursor-pointer select-none',
          'border transition-all duration-200 bg-lol-dark',
          isExpanded
            ? 'border-lol-gold/70 shadow-[0_0_10px_rgba(200,170,100,0.2)]'
            : 'border-lol-gold/30 hover:border-lol-gold/55'
        )}
      >
        <span className="text-[11px] font-semibold text-lol-blue leading-none whitespace-nowrap">
          {selectedLabel}
        </span>
        <ChevronDown
          className={cn(
            'w-3 h-3 text-lol-gold/60 transition-transform duration-200 flex-shrink-0',
            isExpanded ? 'rotate-180' : 'rotate-0'
          )}
        />
      </div>

      {/* Scrollable pill list */}
      <div
        className="absolute right-0 z-50 flex flex-col gap-1 scrollbar-thin scrollbar-thumb-lol-gold/30 scrollbar-track-transparent"
        style={{
          top: 'calc(100% + 5px)',
          maxHeight: isExpanded ? '220px' : '0px',
          overflowY: 'auto',
          opacity: isExpanded ? 1 : 0,
          transition: 'max-height 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 180ms',
          pointerEvents: isExpanded ? 'auto' : 'none',
        }}
      >
        {/* inner wrapper so padding doesn't clip during animation */}
        <div className="flex flex-col gap-1 py-1">
          {options.map((opt, i) => (
            <button
              key={opt.code}
              onClick={() => { onChange(opt.code); setIsExpanded(false) }}
              className={cn(
                'px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold',
                'border transition-all duration-150 bg-lol-dark cursor-pointer select-none',
                opt.code === selected
                  ? 'border-lol-gold text-lol-gold shadow-[0_0_6px_rgba(200,170,100,0.2)]'
                  : 'border-lol-gold/20 text-lol-light/60 hover:border-lol-gold/50 hover:text-lol-gold'
              )}
              style={{
                opacity: isExpanded ? 1 : 0,
                transform: isExpanded ? 'translateY(0)' : 'translateY(-6px)',
                transition: `opacity 180ms ${i * 20}ms, transform 180ms ${i * 20}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}

interface MenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "left" | "right"
  showChevron?: boolean
  menuClassName?: string
}

export function Menu({ trigger, children, align = "left", showChevron = true, menuClassName }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block text-left">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer inline-flex items-center"
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
        {showChevron && (
          <ChevronDown className="ml-2 -mr-1 h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
        )}
      </div>

      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`absolute ${
              align === "right" ? "right-0" : "left-0"
            } mt-2 w-56 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-9 focus:outline-none z-50 ${menuClassName || ""}`}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="menu-button"
          >
            <div className="py-1 max-h-48 overflow-y-auto" role="none">
              {React.Children.map(children, (child) =>
                React.isValidElement(child)
                  ? React.cloneElement(child as React.ReactElement<{ onClose?: () => void }>, {
                      onClose: () => setIsOpen(false),
                    })
                  : child
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface MenuItemProps {
  children?: React.ReactNode
  onClick?: () => void
  onClose?: () => void
  disabled?: boolean
  icon?: React.ReactNode
  isActive?: boolean
  compact?: boolean
}

export function MenuItem({ children, onClick, onClose, disabled = false, icon, isActive = false, compact = false }: MenuItemProps) {
  return (
    <button
      className={`relative block w-full text-center group
        ${compact ? "h-8 text-[11px]" : "h-16"}
        ${disabled ? "text-gray-400 dark:text-gray-500 cursor-not-allowed" : "text-gray-600 dark:text-gray-300 hover:bg-white/5"}
        ${isActive ? "bg-white/10" : ""}
      `}
      role="menuitem"
      onClick={() => {
        if (!disabled) {
          onClick?.()
          onClose?.()
        }
      }}
      disabled={disabled}
    >
      <span className={`flex items-center justify-center h-full ${compact ? "" : "mt-[5%]"}`}>
        {icon && (
          <span className="h-6 w-6 transition-all duration-200 group-hover:[&_svg]:stroke-[2.5]">
            {icon}
          </span>
        )}
        {children}
      </span>
    </button>
  )
}

export function MenuContainer({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const childrenArray = React.Children.toArray(children)
  const totalItems = childrenArray.length

  const handleToggle = () => {
    if (isExpanded) {
      setIsExpanded(false)
    } else {
      setIsExpanded(true)
    }
  }

  return (
    <div className="relative w-[64px]" data-expanded={isExpanded}>
      {/* Container for all items */}
      <div className="relative">
        {/* First item - always visible */}
        <div
          className="relative w-16 h-16 bg-gray-100 dark:bg-gray-800 cursor-pointer rounded-full group will-change-transform z-50"
          onClick={handleToggle}
        >
          {childrenArray[0]}
        </div>

        {/* Other items */}
        {childrenArray.slice(1).map((child, index) => (
          <div
            key={index}
            className="absolute top-0 left-0 w-16 h-16 bg-gray-100 dark:bg-gray-800 will-change-transform"
            style={{
              transform: `translateY(${isExpanded ? (index + 1) * 48 : 0}px)`,
              opacity: isExpanded ? 1 : 0,
              zIndex: 40 - index,
              clipPath: index === childrenArray.length - 2
                ? "circle(50% at 50% 50%)"
                : "circle(50% at 50% 55%)",
              transition: `transform ${isExpanded ? '300ms' : '300ms'} cubic-bezier(0.4, 0, 0.2, 1),
                         opacity ${isExpanded ? '300ms' : '350ms'}`,
              backfaceVisibility: 'hidden',
              perspective: 1000,
              WebkitFontSmoothing: 'antialiased'
            }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
