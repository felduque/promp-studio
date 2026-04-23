"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground bg-clip-padding [a]:hover:bg-primary/80",
        outline:
          "border-border bg-background bg-clip-padding hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground bg-clip-padding hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "bg-clip-padding hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive bg-clip-padding hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "border-0 ps-gradient-btn text-[#1000a9] font-bold shadow-[0_4px_14px_rgba(192,193,255,0.2)] hover:shadow-[0_4px_20px_rgba(192,193,255,0.3)] relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/40",
        "outline-ps":
          "border-[rgba(45,52,73,0.5)] hover:border-[#c0c1ff]/30 text-[#c0c1ff] hover:bg-[#131b2e] bg-transparent",
        "ghost-ps":
          "text-ps-text-secondary hover:text-ps-text-primary hover:bg-ps-bg-elevated bg-transparent",
        "destructive-ps":
          "bg-ps-error/20 text-ps-error hover:bg-ps-error/30 font-bold",
      },
      size: {
        default: "h-9 px-4 py-2",
        xs: "h-7 px-2.5 text-xs rounded-md [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 px-3 text-sm rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 px-6 text-sm",
        xl: "h-12 px-8 text-base",
        icon: "size-9",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10",
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
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
