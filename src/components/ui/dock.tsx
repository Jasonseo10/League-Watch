import * as React from "react"
import { useRef } from "react"
import { cn } from "@/lib/utils"

interface DockProps {
  className?: string
  children: React.ReactNode
  maxAdditionalSize?: number
  iconSize?: number
}

interface DockIconProps {
  className?: string
  src?: string
  href?: string
  name: string
  handleIconHover?: (e: React.MouseEvent<HTMLLIElement>) => void
  onClick?: () => void
  children?: React.ReactNode
  iconSize?: number
  isActive?: boolean
  disabled?: boolean
}

type ScaleValueParams = [number, number]

export const scaleValue = function (
  value: number,
  from: ScaleValueParams,
  to: ScaleValueParams
): number {
  const scale = (to[1] - to[0]) / (from[1] - from[0])
  const capped = Math.min(from[1], Math.max(from[0], value)) - from[0]
  return Math.floor(capped * scale + to[0])
}

export function DockIcon({
  className,
  src,
  href,
  name,
  handleIconHover,
  onClick,
  children,
  iconSize,
  isActive,
  disabled,
}: DockIconProps) {
  const ref = useRef<HTMLLIElement | null>(null)

  return (
    <li
      ref={ref}
      style={
        {
          transition:
            "width 150ms cubic-bezier(0.25, 1, 0.5, 1), height 150ms cubic-bezier(0.25, 1, 0.5, 1), margin-top 150ms cubic-bezier(0.25, 1, 0.5, 1)",
          "--icon-size": `${iconSize}px`,
          width: `${iconSize}px`,
          height: `${iconSize}px`,
        } as React.CSSProperties
      }
      onMouseMove={handleIconHover}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "dock-icon group/li flex cursor-pointer items-center justify-center px-[2px]",
        disabled && "opacity-30 cursor-not-allowed",
        className
      )}
    >
      <div
        className={cn(
          "group/a relative aspect-square w-full rounded-[10px] border p-1.5 transition-colors",
          isActive
            ? "border-lol-gold/60 bg-gradient-to-t from-lol-gold/20 to-lol-gold/5 shadow-[0_0_8px_rgba(200,155,60,0.3)]"
            : "border-lol-light/20 bg-gradient-to-t from-lol-gray to-lol-dark hover:border-lol-gold/40 hover:from-lol-gold/10 hover:to-lol-dark",
          disabled && "hover:border-lol-light/20 hover:from-lol-gray hover:to-lol-dark"
        )}
      >
        <span className="absolute top-[-32px] left-1/2 -translate-x-1/2 rounded-md border border-lol-gold/30 bg-lol-dark px-2 py-0.5 text-[10px] whitespace-nowrap text-lol-light opacity-0 transition-opacity duration-200 group-hover/li:opacity-100 z-50">
          {name}
        </span>
        {src ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full rounded-[inherit] object-contain"
          />
        ) : (
          <div className={cn(
            "h-full w-full flex items-center justify-center text-xs font-bold",
            isActive ? "text-lol-gold" : "text-lol-light"
          )}>
            {children}
          </div>
        )}
      </div>
    </li>
  )
}

export function Dock({
  className,
  children,
  maxAdditionalSize = 3,
  iconSize = 40,
}: DockProps) {
  const dockRef = useRef<HTMLDivElement | null>(null)

  const handleIconHover = (e: React.MouseEvent<HTMLLIElement>) => {
    if (!dockRef.current) return
    const mousePos = e.clientX
    const iconPosLeft = e.currentTarget.getBoundingClientRect().left
    const iconWidth = e.currentTarget.getBoundingClientRect().width

    const cursorDistance = (mousePos - iconPosLeft) / iconWidth
    const offsetPixels = scaleValue(
      cursorDistance,
      [0, 1],
      [maxAdditionalSize * -1, maxAdditionalSize]
    )

    dockRef.current.style.setProperty(
      "--dock-offset-left",
      `${offsetPixels * -1}px`
    )

    dockRef.current.style.setProperty(
      "--dock-offset-right",
      `${offsetPixels}px`
    )
  }

  return (
    <nav ref={dockRef} role="navigation" aria-label="Role Selector">
      <ul
        className={cn(
          "flex items-center rounded-xl border border-lol-gold/10 bg-gradient-to-t from-lol-dark to-lol-gray/50 p-1",
          className
        )}
      >
        {React.Children.map(children, (child) =>
          React.isValidElement<DockIconProps>(child)
            ? React.cloneElement(child as React.ReactElement<DockIconProps>, {
                handleIconHover,
                iconSize,
              })
            : child
        )}
      </ul>
    </nav>
  )
}
