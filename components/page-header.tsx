import type React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  backHref?: string
  actions?: React.ReactNode
  className?: string
}

/** Consistent, editorial page heading used on every top-level screen. */
export const PageHeader = ({
  eyebrow,
  title,
  description,
  backHref,
  actions,
  className,
}: PageHeaderProps) => {
  return (
    <div className={cn("mb-8", className)}>
      {backHref ? (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 mb-3 h-8 text-muted-foreground hover:text-foreground"
        >
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
