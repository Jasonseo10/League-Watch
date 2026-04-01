import React from 'react'
import { cn } from '@/lib/utils'
import { VariantProps, cva } from "class-variance-authority"

const buttonVariants = cva(
  "relative group border text-foreground mx-auto text-center rounded-full",
  {
    variants: {
      variant: {
        gold: "bg-lol-gold/5 hover:bg-lol-gold/0 border-lol-gold/20",
        teal: "bg-lol-blue/5 hover:bg-lol-blue/0 border-lol-blue/20",
        red: "bg-lol-red/5 hover:bg-lol-red/0 border-lol-red/20",
      },
      size: {
        default: "px-7 py-1.5",
        sm: "px-4 py-0.5",
        lg: "px-10 py-2.5",
      },
    },
    defaultVariants: {
      variant: "gold",
      size: "default",
    },
  }
)

const neonColors = {
  gold: "via-lol-gold",
  teal: "via-lol-blue",
  red: "via-lol-red",
}

export interface NeonButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  neon?: boolean
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, neon = true, size, variant, children, ...props }, ref) => {
    const neonColor = neonColors[variant ?? "gold"]
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        <span
          className={cn(
            "absolute h-px opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out inset-x-0 inset-y-0 bg-gradient-to-r w-3/4 mx-auto from-transparent to-transparent hidden",
            neonColor,
            neon && "block"
          )}
        />
        {children}
        <span
          className={cn(
            "absolute group-hover:opacity-30 transition-all duration-500 ease-in-out inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent to-transparent hidden",
            neonColor,
            neon && "block"
          )}
        />
      </button>
    )
  }
)

NeonButton.displayName = "NeonButton"

export { NeonButton, buttonVariants }
