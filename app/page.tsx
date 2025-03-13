import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { BlogAgentDashboard } from "@/components/blog-agent-dashboard"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <DashboardShell>
          <BlogAgentDashboard />
        </DashboardShell>
      </div>
    </div>
  )
}

