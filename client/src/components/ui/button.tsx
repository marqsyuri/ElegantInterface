import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 hover:shadow-xl hover:shadow-pink-500/25 relative overflow-hidden group",
        destructive:
          "bg-red-500 text-white hover:bg-red-600",
        outline:
          "border border-pink-200 bg-white hover:bg-pink-50 hover:border-pink-300 hover:text-pink-700 text-slate-700",
        secondary:
          "bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 hover:border-pink-300",
        ghost: "hover:bg-pink-50 hover:text-pink-600 text-slate-600",
        link: "text-pink-600 underline-offset-4 hover:underline hover:text-pink-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isDefaultVariant = variant === "default" || variant === undefined
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={isDefaultVariant ? {
          boxShadow: '0 8px 24px rgba(236, 72, 153, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
        } : undefined}
        {...props}
      >
        {isDefaultVariant && (
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-rose-400/20 backdrop-blur-sm pointer-events-none" />
        )}
        <span className={isDefaultVariant ? "relative z-10" : ""}>
          {props.children}
        </span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
