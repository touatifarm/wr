"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Clock, TrendingUp, FileText, Users, ExternalLink, Download, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchAnalyticsAction } from "@/lib/actions"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"

type AnalyticsData = {
  pageViews: {
    daily: Array<{ date: string; views: number }>
    weekly: Array<{ date: string; views: number }>
    monthly: Array<{ date: string; views: number }>
  }
  topPosts: Array<{
    id: string
    title: string
    views: number
    comments: number
  }>
  demographics: Array<{
    name: string
    value: number
  }>
  referrers: Array<{
    name: string
    value: number
  }>
  engagement: {
    avgTimeOnPage: string
    bounceRate: string
    commentsPerPost: number
  }
  isRealData?: boolean
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export function ContentAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30days")
  const [viewType, setViewType] = useState("daily")

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  async function loadAnalytics() {
    setIsLoading(true)
    try {
      const data = await fetchAnalyticsAction(timeRange)
      setAnalyticsData(data)

      // Show a toast notification if using fallback data
      if (data && data.isRealData === false) {
        toast({
          title: "Using demo analytics data",
          description:
            "Your WordPress site doesn't have analytics capabilities. Install an analytics plugin like Jetpack or Google Analytics for WordPress to see real data.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error loading analytics:", error)

      toast({
        title: "Error loading analytics",
        description: "Could not load analytics data. Using demo data instead.",
        variant: "destructive",
      })

      // Set default empty data structure
      setAnalyticsData({
        pageViews: {
          daily: [],
          weekly: [],
          monthly: [],
        },
        topPosts: [],
        demographics: [],
        referrers: [],
        engagement: {
          avgTimeOnPage: "0:00",
          bounceRate: "0%",
          commentsPerPost: 0,
        },
        isRealData: false,
      })
    } finally {
      setIsLoading(false)
    }
  }

  function exportAnalytics() {
    if (!analyticsData) return

    try {
      const dataStr = JSON.stringify(analyticsData, null, 2)
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

      const exportFileDefaultName = `wordpress-analytics-${new Date().toISOString().split("T")[0]}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()

      toast({
        title: "Analytics exported",
        description: "Your analytics data has been exported successfully.",
      })
    } catch (error) {
      console.error("Error exporting analytics:", error)
      toast({
        title: "Export failed",
        description: "Could not export analytics data.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <AnalyticsSkeleton />
  }

  return (
    <div className="space-y-4">
      {analyticsData && analyticsData.isRealData === false && (
        <div className="bg-muted p-4 rounded-md mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-muted-foreground mr-2" />
          <div>
            <p className="text-sm font-medium">Using demo analytics data</p>
            <p className="text-sm text-muted-foreground">
              Your WordPress site doesn't have analytics capabilities. Install an analytics plugin like Jetpack or
              Google Analytics for WordPress to see real data.
            </p>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Content Analytics</h2>
          <p className="text-muted-foreground">Track your blog's performance and audience engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadAnalytics}>
            <TrendingUp className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
          <Button variant="outline" size="icon" onClick={exportAnalytics}>
            <Download className="h-4 w-4" />
            <span className="sr-only">Export</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.pageViews[viewType].reduce((sum, item) => sum + item.views, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">+12% from previous period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time on Page</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.engagement.avgTimeOnPage || "0:00"}</div>
            <p className="text-xs text-muted-foreground">+5% from previous period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.engagement.bounceRate || "0%"}</div>
            <p className="text-xs text-muted-foreground">-3% from previous period</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pageViews" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pageViews">Page Views</TabsTrigger>
          <TabsTrigger value="topContent">Top Content</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="referrers">Traffic Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="pageViews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page Views Over Time</CardTitle>
              <CardDescription>Track your blog's traffic over time</CardDescription>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={viewType === "daily" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewType("daily")}
                >
                  Daily
                </Button>
                <Button
                  variant={viewType === "weekly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewType("weekly")}
                >
                  Weekly
                </Button>
                <Button
                  variant={viewType === "monthly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewType("monthly")}
                >
                  Monthly
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-[300px]">
              {analyticsData?.pageViews[viewType] && analyticsData.pageViews[viewType].length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.pageViews[viewType]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded p-2 shadow-sm">
                              <p className="font-medium">{label}</p>
                              <p className="text-sm">
                                Views: <span className="font-medium">{payload[0].value}</span>
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No page view data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topContent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription>Your most viewed blog posts</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {analyticsData?.topPosts && analyticsData.topPosts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.topPosts}>
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
                              <p className="text-sm">
                                Comments: <span className="font-medium">{payload[0].payload.comments}</span>
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                    <Bar dataKey="views" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No top content data available
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="space-y-2 w-full">
                <h3 className="text-sm font-medium">Top Posts</h3>
                <div className="space-y-2">
                  {analyticsData?.topPosts?.slice(0, 5).map((post, index) => (
                    <div key={post.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs mr-2">
                          {index + 1}
                        </div>
                        <span className="text-sm truncate max-w-[300px]">{post.title}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">{post.views} views</span>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`/post/${post.id}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">View post</span>
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audience Demographics</CardTitle>
              <CardDescription>Understand your audience better</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {analyticsData?.demographics && analyticsData.demographics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.demographics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {analyticsData.demographics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded p-2 shadow-sm">
                              <p className="font-medium">{payload[0].name}</p>
                              <p className="text-sm">
                                Percentage:{" "}
                                <span className="font-medium">
                                  {(
                                    (payload[0].value /
                                      analyticsData.demographics.reduce((sum, item) => sum + item.value, 0)) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </span>
                              </p>
                              <p className="text-sm">
                                Count: <span className="font-medium">{payload[0].value}</span>
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No demographic data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Where your visitors are coming from</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {analyticsData?.referrers && analyticsData.referrers.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.referrers}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {analyticsData.referrers.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded p-2 shadow-sm">
                              <p className="font-medium">{payload[0].name}</p>
                              <p className="text-sm">
                                Percentage:{" "}
                                <span className="font-medium">
                                  {(
                                    (payload[0].value /
                                      analyticsData.referrers.reduce((sum, item) => sum + item.value, 0)) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </span>
                              </p>
                              <p className="text-sm">
                                Count: <span className="font-medium">{payload[0].value}</span>
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No referrer data available
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="space-y-2 w-full">
                <h3 className="text-sm font-medium">Top Referrers</h3>
                <div className="space-y-2">
                  {analyticsData?.referrers?.slice(0, 5).map((referrer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm">{referrer.name}</span>
                      </div>
                      <span className="text-sm font-medium">{referrer.value} visits</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <Skeleton className="h-10 w-96 mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="h-[300px]">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

