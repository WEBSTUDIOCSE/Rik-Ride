import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold uppercase tracking-wider transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#009944] text-white shadow-[0px_4px_0px_0px_#006400] hover:shadow-[0px_2px_0px_0px_#006400] hover:translate-y-[2px] active:shadow-none active:translate-y-1",
        destructive:
          "bg-red-500 text-white shadow-[0px_4px_0px_0px_#991b1b] hover:shadow-[0px_2px_0px_0px_#991b1b] hover:translate-y-[2px] active:shadow-none active:translate-y-1",
        outline:
          "border-2 border-[#FFD700] bg-[#1a1a1a] text-white hover:bg-[#FFD700] hover:text-[#1a1a1a]",
        secondary:
          "bg-[#FFD700] text-[#1a1a1a] shadow-[0px_4px_0px_0px_#B8860B] hover:shadow-[0px_2px_0px_0px_#B8860B] hover:translate-y-[2px] active:shadow-none active:translate-y-1",
        ghost:
          "bg-transparent text-gray-400 hover:bg-[#252525] hover:text-white",
        link: "text-[#FFD700] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg gap-1.5 px-3 text-xs",
        lg: "h-12 rounded-lg px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
