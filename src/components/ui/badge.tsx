import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
        secondary:
          "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        destructive:
          "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
        success:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
        warning:
          "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
        info:
          "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
        purple:
          "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400",
        outline: 
          "border border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300",
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
