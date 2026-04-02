import { motion } from 'framer-motion'
import { useState, useEffect, useRef, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { GlowingTooltip } from './glowing-tooltip'

const TOOLTIP_PADDING = 8 // min distance from window edge

interface AnimatedIconProps {
  src: string
  alt: string
  name: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  rounded?: 'full' | 'md' | 'sm'
  borderColor?: string
  iconId?: number
  hoveredId?: number | null
  onHoverStart?: () => void
  onHoverEnd?: () => void
  label?: ReactNode
  badge?: ReactNode
  className?: string
}

const SIZE_MAP = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-10 h-10',
}

const ROUNDED_MAP = {
  full: 'rounded-full',
  md: 'rounded-md',
  sm: 'rounded',
}

export function AnimatedIcon({
  src,
  alt,
  name,
  description,
  size = 'sm',
  rounded = 'sm',
  borderColor = 'border-lol-gold/20',
  iconId,
  hoveredId,
  onHoverStart,
  onHoverEnd,
  label,
  badge,
  className,
}: AnimatedIconProps) {
  const [selfHovered, setSelfHovered] = useState(false)
  const iconRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null)

  const isHovered = iconId != null ? hoveredId === iconId : selfHovered
  const isAnyHovered = iconId != null ? hoveredId != null : false

  const handleHoverStart = () => {
    setSelfHovered(true)
    onHoverStart?.()
  }

  const handleHoverEnd = () => {
    setSelfHovered(false)
    onHoverEnd?.()
  }

  // Position tooltip centered on icon, clamped to window edges
  useEffect(() => {
    if (!isHovered || !iconRef.current) {
      setTooltipPos(null)
      return
    }

    // Use rAF so the portal tooltip element has rendered and we can measure it
    const id = requestAnimationFrame(() => {
      const iconRect = iconRef.current!.getBoundingClientRect()
      const winW = document.documentElement.clientWidth
      const tooltipEl = tooltipRef.current
      const tooltipW = tooltipEl ? tooltipEl.offsetWidth : 176

      const centerX = iconRect.left + iconRect.width / 2
      let left = centerX - tooltipW / 2

      // Clamp to window edges
      if (left < TOOLTIP_PADDING) left = TOOLTIP_PADDING
      if (left + tooltipW > winW - TOOLTIP_PADDING) left = winW - tooltipW - TOOLTIP_PADDING

      setTooltipPos({
        left,
        top: iconRect.top,
      })
    })

    return () => cancelAnimationFrame(id)
  }, [isHovered])

  return (
    <motion.div
      ref={iconRef}
      className={`relative flex flex-col items-center ${className ?? ''}`}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      animate={{
        scale: isHovered ? 1.12 : 1,
        z: isHovered ? 30 : isAnyHovered ? -5 : 0,
        opacity: isAnyHovered && !isHovered ? 0.75 : 1,
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Subtle 3D tilt on the icon itself */}
      <motion.div
        animate={{
          rotateX: isHovered ? -3 : 0,
          rotateY: isHovered ? 2 : 0,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative"
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className={`${SIZE_MAP[size]} ${ROUNDED_MAP[rounded]} border ${borderColor} object-cover`}
          />
        ) : (
          <div className={`${SIZE_MAP[size]} ${ROUNDED_MAP[rounded]} bg-lol-gray border ${borderColor}`} />
        )}
        {badge}
      </motion.div>

      {/* Label below icon */}
      {label}

      {/* Portal tooltip — renders at body level to escape overflow clipping */}
      {isHovered && (name || description) && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: tooltipPos?.left ?? -9999,
            top: tooltipPos?.top ?? -9999,
            transform: 'translateY(-100%)',
            maxWidth: `calc(100vw - ${TOOLTIP_PADDING * 2}px)`,
          }}
        >
          <div className="mb-1.5">
            <GlowingTooltip className="w-44 max-w-full">
              <div className="p-2">
                <div className="flex items-center gap-1.5 mb-1">
                  {src && (
                    <img src={src} alt={name} className={`w-5 h-5 shrink-0 ${ROUNDED_MAP[rounded]}`} />
                  )}
                  <span className="text-white text-[11px] font-semibold">{name}</span>
                </div>
                {description && (
                  <p
                    className="text-[9px] text-lol-light/80 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                )}
              </div>
            </GlowingTooltip>
          </div>
        </div>,
        document.body
      )}
    </motion.div>
  )
}

/**
 * Container that applies subtle mouse-tracking parallax
 * to a row of AnimatedIcon children.
 */
interface TiltedIconRowProps {
  children: ReactNode
  className?: string
  tiltX?: number
  parallaxStrength?: number
}

export function TiltedIconRow({
  children,
  className,
  tiltX = 3,
  parallaxStrength = 3,
}: TiltedIconRowProps) {
  const [mouse, setMouse] = useState({ x: 0 })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      setMouse({ x })
    }

    const handleMouseLeave = () => {
      setMouse({ x: 0 })
    }

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div ref={ref} style={{ perspective: '800px' }}>
      <motion.div
        className={className}
        style={{ transformStyle: 'preserve-3d' }}
        animate={{
          rotateX: tiltX,
          rotateY: mouse.x * parallaxStrength,
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 25 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
