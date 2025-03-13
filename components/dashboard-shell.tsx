import type { ReactNode } from "react"

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="grid gap-4 md:gap-8">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">{children}</div>
    </div>
  )
}

