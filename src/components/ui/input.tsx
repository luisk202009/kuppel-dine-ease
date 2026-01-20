import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900",
          "placeholder:text-zinc-400",
          "focus:outline-none focus:ring-2 focus:ring-[#4AB7C6]/40 focus:border-[#4AB7C6] focus:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-50",
          "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500",
          "dark:focus:ring-[#4AB7C6]/20 dark:focus:border-[#4AB7C6]",
          "transition-colors duration-150",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-700 dark:file:text-zinc-300",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
