import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center border-2 border-[var(--border-color)] px-2 py-0.5 text-xs font-bold uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-[var(--bg-card)] text-[var(--text-on-card)]",
        secondary: "bg-[var(--bg-secondary)] text-[var(--text-primary)]",
        destructive: "bg-red-500 text-white border-black",
        outline: "bg-transparent text-[var(--text-primary)]",
        accent: "bg-[var(--accent)] text-[var(--text-primary)] border-[var(--border-color)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
