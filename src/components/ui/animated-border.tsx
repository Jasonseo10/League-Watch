import React, { useEffect, useRef } from 'react'

interface AnimatedBorderProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedBorder({ children, className = '' }: AnimatedBorderProps) {
  const topRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const animateBorder = () => {
      const now = Date.now() / 1000
      const speed = 0.5

      const topX = Math.sin(now * speed) * 100
      const rightY = Math.cos(now * speed) * 100
      const bottomX = Math.sin(now * speed + Math.PI) * 100
      const leftY = Math.cos(now * speed + Math.PI) * 100

      if (topRef.current) topRef.current.style.transform = `translateX(${topX}%)`
      if (rightRef.current) rightRef.current.style.transform = `translateY(${rightY}%)`
      if (bottomRef.current) bottomRef.current.style.transform = `translateX(${bottomX}%)`
      if (leftRef.current) leftRef.current.style.transform = `translateY(${leftY}%)`

      requestAnimationFrame(animateBorder)
    }

    const animationId = requestAnimationFrame(animateBorder)
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Animated border elements */}
      <div className="absolute top-0 left-0 w-full h-0.5 overflow-hidden z-20">
        <div
          ref={topRef}
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-[#C89B3C]/60 to-transparent"
        />
      </div>

      <div className="absolute top-0 right-0 w-0.5 h-full overflow-hidden z-20">
        <div
          ref={rightRef}
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#0AC8B9]/60 to-transparent"
        />
      </div>

      <div className="absolute bottom-0 left-0 w-full h-0.5 overflow-hidden z-20">
        <div
          ref={bottomRef}
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-[#C89B3C]/60 to-transparent"
        />
      </div>

      <div className="absolute top-0 left-0 w-0.5 h-full overflow-hidden z-20">
        <div
          ref={leftRef}
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#0AC8B9]/60 to-transparent"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  )
}
