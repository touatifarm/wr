"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfigurationForm } from "@/components/configuration-form"
import { TopicGenerator } from "@/components/topic-generator"
import { ContentGenerator } from "@/components/content-generator"
import { PublishingQueue } from "@/components/publishing-queue"
import { DashboardOverview } from "@/components/dashboard-overview"
import { ContentScheduler } from "@/components/content-scheduler"
import { SeoAnalyzer } from "@/components/seo-analyzer"
import { ContentAnalytics } from "@/components/content-analytics"
import { ContentImprover } from "@/components/content-improver"
import { TaxonomyManager } from "@/components/taxonomy-manager"
import { ContentCalendar } from "@/components/content-calendar"
import { ContentSuggestions } from "@/components/content-suggestions"

export function BlogAgentDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Manage your autonomous WordPress blog agent</p>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="topics">Topic Research</TabsTrigger>
          <TabsTrigger value="suggestions">Content Suggestions</TabsTrigger>
          <TabsTrigger value="content">Content Generation</TabsTrigger>
          <TabsTrigger value="calendar">Content Calendar</TabsTrigger>
          <TabsTrigger value="seo">SEO Analyzer</TabsTrigger>
          <TabsTrigger value="improve">Content Improver</TabsTrigger>
          <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
          <TabsTrigger value="publishing">Publishing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="taxonomy">Categories & Tags</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DashboardOverview />
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          <TopicGenerator />
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <ContentSuggestions />
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <ContentGenerator />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <ContentCalendar />
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <SeoAnalyzer />
        </TabsContent>

        <TabsContent value="improve" className="space-y-4">
          <ContentImprover />
        </TabsContent>

        <TabsContent value="scheduler" className="space-y-4">
          <ContentScheduler />
        </TabsContent>

        <TabsContent value="publishing" className="space-y-4">
          <PublishingQueue />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ContentAnalytics />
        </TabsContent>

        <TabsContent value="taxonomy" className="space-y-4">
          <TaxonomyManager />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <ConfigurationForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}

