"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Clock, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchDashboardStatsAction } from "@/lib/actions"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"

type DashboardStats = {
  topicsGenerated: number
  postsCreated: number
  postsPublished: number
  recentActivity: Array<{
    action: string
    timestamp: string
    status?: "success" | "pending" | "error"
  }>
  postPerformance?: Array<{
    title: string
    views: number
    date: string
  }>
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  async function loadDashboardStats() {
    setIsLoading(true)
    try {
      const data = await fetchDashboardStatsAction()
      setStats(data)
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
      // Set default stats to prevent the UI from breaking
      setStats({
        topicsGenerated: 0,
        postsCreated: 0,
        postsPublished: 0,
        recentActivity: [],
        postPerformance: [],
      })

      toast({
        title: "Error loading stats",
        description: "Could not load all dashboard statistics. Some data may be unavailable.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Topics Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.topicsGenerated || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.topicsGenerated && stats.topicsGenerated > 0
                ? `+${Math.floor(stats.topicsGenerated * 0.2)} since last week`
                : "No topics generated yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.postsCreated || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.postsCreated && stats.postsCreated > 0
                ? `+${Math.floor(stats.postsCreated * 0.3)} since last week`
                : "No posts created yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Posts</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.postsPublished || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.postsPublished && stats.postsPublished > 0
                ? `+${Math.floor(stats.postsPublished * 0.1)} since last week`
                : "No posts published yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your agent's recent actions and status updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center">
                      {activity.status === "success" ? (
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      ) : activity.status === "error" ? (
                        <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                      )}
                      <div className="font-medium">{activity.action}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{activity.timestamp}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Post Performance</CardTitle>
            <CardDescription>Views for your recent posts</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {stats?.postPerformance && stats.postPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.postPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" tick={false} />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded p-2 shadow-sm">
                            <p className="font-medium">{payload[0].payload.title}</p>
                            <p className="text-sm">
                              Views: <span className="font-medium">{payload[0].value}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">{payload[0].payload.date}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="views" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No performance data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Schedule</CardTitle>
          <CardDescription>Upcoming content publishing schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 28 }).map((_, i) => {
                const hasPost = i === 3 || i === 10 || i === 17 || i === 24
                return (
                  <div
                    key={i}
                    className={`aspect-square flex items-center justify-center rounded-md text-xs ${
                      hasPost ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={loadDashboardStats} variant="outline" size="sm">
          Refresh Dashboard
        </Button>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="h-[300px]">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

