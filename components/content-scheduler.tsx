"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Calendar, Clock, Trash2, AlertCircle, Check, RefreshCw, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Switch } from "@/components/ui/switch"
import { saveScheduleAction, getScheduleAction, generateContentAction, publishPostAction } from "@/lib/actions"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Slider } from "@/components/ui/slider"

const scheduleFormSchema = z.object({
  frequency: z.string().min(1, { message: "Post frequency is required" }),
  dayOfWeek: z.string().optional(),
  time: z.string(),
  topicKeywords: z.string(),
  autoPublish: z.boolean(),
  startDate: z.date().optional(),
  contentType: z.string().default("blog-post"),
  wordCount: z.number().min(300).max(5000).default(1500),
  tone: z.string().default("professional"),
  audience: z.string().default("general"),
})

type ScheduledPost = {
  id: string
  date: string
  time: string
  topic: string
  status: "scheduled" | "completed" | "failed" | "in-progress"
  frequency?: string
  dayOfWeek?: string
  contentType?: string
  wordCount?: number
  tone?: string
  audience?: string
  autoPublish?: boolean
  lastRun?: string
  nextRun?: string
  result?: string
}

export function ContentScheduler() {
  const [schedules, setSchedules] = useState<ScheduledPost[]>([])
  const [date, setDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSchedule, setActiveSchedule] = useState<string | null>(null)

  const form = useForm<z.infer<typeof scheduleFormSchema>>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      frequency: "weekly",
      dayOfWeek: "monday",
      time: "09:00",
      topicKeywords: "wordpress, blogging, content marketing",
      autoPublish: true,
      contentType: "blog-post",
      wordCount: 1500,
      tone: "professional",
      audience: "general",
    },
  })

  // Load existing schedules when component mounts
  useEffect(() => {
    loadSchedules()
  }, [])

  async function loadSchedules() {
    setIsLoading(true)
    try {
      // Try to load schedules from localStorage first
      const savedSchedules = localStorage.getItem("contentSchedules")
      if (savedSchedules) {
        setSchedules(JSON.parse(savedSchedules))
      } else {
        // If no schedules in localStorage, try to get from server
        const result = await getScheduleAction()
        if (result && Object.keys(result).length > 0) {
          // Convert server response to ScheduledPost format
          const serverSchedule: ScheduledPost = {
            id: "server-schedule",
            date: new Date().toISOString().split("T")[0],
            time: result.time || "09:00",
            topic: result.topicKeywords || "wordpress, blogging",
            status: "scheduled",
            frequency: result.frequency,
            dayOfWeek: result.dayOfWeek,
            autoPublish: result.autoPublish,
            nextRun: calculateNextRun(result.frequency, result.dayOfWeek, result.time),
          }
          setSchedules([serverSchedule])

          // Update form with server values
          form.setValue("frequency", result.frequency)
          form.setValue("dayOfWeek", result.dayOfWeek || "monday")
          form.setValue("time", result.time)
          form.setValue("topicKeywords", result.topicKeywords)
          form.setValue("autoPublish", result.autoPublish)
        }
      }
    } catch (error) {
      console.error("Error loading schedules:", error)
      setError("Failed to load schedules. Using default settings.")

      // Set some default schedules for demonstration
      const defaultSchedule: ScheduledPost = {
        id: "default-schedule",
        date: new Date().toISOString().split("T")[0],
        time: "09:00",
        topic: "WordPress content",
        status: "scheduled",
        frequency: "weekly",
        dayOfWeek: "monday",
        autoPublish: true,
        nextRun: calculateNextRun("weekly", "monday", "09:00"),
      }
      setSchedules([defaultSchedule])
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate the next run date based on frequency, day, and time
  function calculateNextRun(frequency: string, dayOfWeek?: string, time?: string): string {
    const now = new Date()
    const nextRun = new Date()

    // Set the time
    if (time) {
      const [hours, minutes] = time.split(":").map(Number)
      nextRun.setHours(hours, minutes, 0, 0)
    }

    // If the time is in the past today, move to the next occurrence
    if (nextRun <= now) {
      // For daily, just move to tomorrow
      if (frequency === "daily") {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      // For weekly/biweekly/monthly, we need to calculate the next occurrence
      else {
        // First, move to tomorrow as a starting point
        nextRun.setDate(nextRun.getDate() + 1)

        // Then adjust based on frequency
        switch (frequency) {
          case "weekly":
            // Find the next occurrence of the specified day
            if (dayOfWeek) {
              const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
              const targetDay = days.indexOf(dayOfWeek.toLowerCase())
              if (targetDay !== -1) {
                const currentDay = nextRun.getDay()
                const daysToAdd = (targetDay + 7 - currentDay) % 7
                // If today is the target day but time has passed, we need to add 7 days
                // Otherwise, add the days until the next occurrence
                nextRun.setDate(nextRun.getDate() + (daysToAdd === 0 ? 7 : daysToAdd))
              }
            }
            break
          case "biweekly":
            // Find the next occurrence of the specified day, then add another week
            if (dayOfWeek) {
              const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
              const targetDay = days.indexOf(dayOfWeek.toLowerCase())
              if (targetDay !== -1) {
                const currentDay = nextRun.getDay()
                const daysToAdd = (targetDay + 7 - currentDay) % 7
                // If today is the target day but time has passed, we need to add 14 days
                // Otherwise, add the days until the next occurrence + 7 days
                nextRun.setDate(nextRun.getDate() + (daysToAdd === 0 ? 14 : daysToAdd + 7))
              }
            }
            break
          case "monthly":
            // Move to the same day next month
            nextRun.setMonth(nextRun.getMonth() + 1)
            break
        }
      }
    }

    return nextRun.toISOString()
  }

  async function onSubmit(data: z.infer<typeof scheduleFormSchema>) {
    setIsSaving(true)
    setError(null)

    try {
      // Create a new schedule object
      const newSchedule: ScheduledPost = {
        id: `schedule-${Date.now()}`,
        date: data.startDate ? format(data.startDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        time: data.time,
        topic: `Content about ${data.topicKeywords.split(",")[0]}`,
        status: "scheduled",
        frequency: data.frequency,
        dayOfWeek: data.dayOfWeek,
        contentType: data.contentType,
        wordCount: data.wordCount,
        tone: data.tone,
        audience: data.audience,
        autoPublish: data.autoPublish,
        nextRun: calculateNextRun(data.frequency, data.dayOfWeek, data.time),
      }

      // Save to server
      await saveScheduleAction({
        frequency: data.frequency,
        dayOfWeek: data.dayOfWeek,
        time: data.time,
        topicKeywords: data.topicKeywords,
        autoPublish: data.autoPublish,
        contentType: data.contentType,
        wordCount: data.wordCount,
        tone: data.tone,
        audience: data.audience,
        startDate: data.startDate ? data.startDate.toISOString() : new Date().toISOString(),
      })

      // Update local state
      const updatedSchedules = activeSchedule
        ? schedules.map((s) => (s.id === activeSchedule ? newSchedule : s))
        : [...schedules, newSchedule]

      setSchedules(updatedSchedules)

      // Save to localStorage for persistence
      localStorage.setItem("contentSchedules", JSON.stringify(updatedSchedules))

      // Reset active schedule
      setActiveSchedule(null)

      toast({
        title: "Schedule saved",
        description: "Your content generation schedule has been saved.",
      })
    } catch (error) {
      console.error("Error saving schedule:", error)
      setError("Failed to save schedule. Please try again.")

      toast({
        title: "Error saving schedule",
        description: "There was an error saving your schedule. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function removeSchedule(id: string) {
    setIsDeleting(true)
    try {
      // Remove from local state
      const updatedSchedules = schedules.filter((schedule) => schedule.id !== id)
      setSchedules(updatedSchedules)

      // Save to localStorage
      localStorage.setItem("contentSchedules", JSON.stringify(updatedSchedules))

      // If this was the active schedule, reset the form
      if (id === activeSchedule) {
        setActiveSchedule(null)
        form.reset({
          frequency: "weekly",
          dayOfWeek: "monday",
          time: "09:00",
          topicKeywords: "wordpress, blogging, content marketing",
          autoPublish: true,
        })
      }

      toast({
        title: "Schedule removed",
        description: "The scheduled post has been removed.",
      })
    } catch (error) {
      console.error("Error removing schedule:", error)
      toast({
        title: "Error removing schedule",
        description: "Failed to remove schedule. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  function editSchedule(id: string) {
    const schedule = schedules.find((s) => s.id === id)
    if (!schedule) return

    // Set the active schedule
    setActiveSchedule(id)

    // Update form values
    form.setValue("frequency", schedule.frequency || "weekly")
    form.setValue("dayOfWeek", schedule.dayOfWeek || "monday")
    form.setValue("time", schedule.time)
    form.setValue("topicKeywords", schedule.topic)
    form.setValue("autoPublish", schedule.autoPublish || false)
    form.setValue("contentType", schedule.contentType || "blog-post")
    form.setValue("wordCount", schedule.wordCount || 1500)
    form.setValue("tone", schedule.tone || "professional")
    form.setValue("audience", schedule.audience || "general")

    // Set the date if available
    if (schedule.date) {
      const scheduleDate = new Date(schedule.date)
      setDate(scheduleDate)
      form.setValue("startDate", scheduleDate)
    }

    toast({
      title: "Editing schedule",
      description: "You are now editing an existing schedule.",
    })
  }

  function formatNextRun(nextRunIso: string | undefined): string {
    if (!nextRunIso) return "Not scheduled"

    try {
      const nextRun = new Date(nextRunIso)
      return format(nextRun, "PPP 'at' p")
    } catch (e) {
      return "Invalid date"
    }
  }

  // Add a polling mechanism to check for due schedules
  useEffect(() => {
    // Check for due schedules every minute
    const intervalId = setInterval(checkSchedules, 60000)

    // Run an initial check when component mounts
    checkSchedules()

    return () => clearInterval(intervalId)
  }, [schedules])

  async function checkSchedules() {
    // Get current time
    const now = new Date()

    // Check each schedule
    const updatedSchedules = [...schedules]
    let hasChanges = false

    for (let i = 0; i < updatedSchedules.length; i++) {
      const schedule = updatedSchedules[i]

      // Skip schedules that are not in 'scheduled' status
      if (schedule.status !== "scheduled") continue

      // Parse the next run time
      const nextRun = schedule.nextRun ? new Date(schedule.nextRun) : null

      // If nextRun is in the past, trigger content generation
      if (nextRun && nextRun <= now) {
        hasChanges = true

        // Update status to in-progress
        updatedSchedules[i] = {
          ...schedule,
          status: "in-progress",
          lastRun: new Date().toISOString(),
        }

        // Trigger content generation (in a non-blocking way)
        generateScheduledContent(
          schedule.id,
          schedule.topic,
          schedule.frequency,
          schedule.dayOfWeek,
          schedule.time,
          schedule.autoPublish,
          schedule.contentType,
          schedule.wordCount,
          schedule.tone,
          schedule.audience,
        )
      }
    }

    // Update state if any schedules changed
    if (hasChanges) {
      setSchedules(updatedSchedules)
      localStorage.setItem("contentSchedules", JSON.stringify(updatedSchedules))
    }
  }

  async function generateScheduledContent(
    scheduleId: string,
    topic: string,
    frequency: string,
    dayOfWeek: string,
    time: string,
    autoPublish: boolean,
    contentType = "blog-post",
    wordCount = 1500,
    tone = "professional",
    audience = "general",
  ) {
    try {
      // Update UI to show generation in progress
      setSchedules((prev) => {
        const updated = prev.map((s) =>
          s.id === scheduleId ? { ...s, status: "in-progress", result: "Generating content..." } : s,
        )
        localStorage.setItem("contentSchedules", JSON.stringify(updated))
        return updated
      })

      // Extract keywords from topic
      const keywords = topic.replace("Content about ", "")

      // Create parameters for content generation
      const params = JSON.stringify({
        contentType,
        wordCount,
        tone,
        audience,
        includeImages: false,
        includeFaqs: true,
      })

      // Generate the content
      const { content, suggestedCategories } = await generateContentAction(
        `Auto-generated: ${keywords}`,
        params,
        keywords,
      )

      // Publish or save as draft based on autoPublish setting
      const status = autoPublish ? "publish" : "draft"
      const result = await publishPostAction(`Auto-generated: ${keywords}`, content, status, suggestedCategories)

      if (!result.success) {
        throw new Error(result.error || "Failed to publish post")
      }

      // Update the schedule with success status and calculate next run
      setSchedules((prev) => {
        const updated = prev.map((s) => {
          if (s.id === scheduleId) {
            return {
              ...s,
              status: "completed",
              lastRun: new Date().toISOString(),
              nextRun: calculateNextRun(frequency, dayOfWeek, time),
              result: autoPublish
                ? "Content generated and published successfully"
                : "Content generated and saved as draft",
            }
          }
          return s
        })
        localStorage.setItem("contentSchedules", JSON.stringify(updated))
        return updated
      })

      // Show success toast
      toast({
        title: "Content generated",
        description: autoPublish
          ? "Scheduled content has been generated and published."
          : "Scheduled content has been generated and saved as draft.",
      })

      // After a delay, set the status back to scheduled for the next run
      setTimeout(() => {
        setSchedules((prev) => {
          const updated = prev.map((s) => {
            if (s.id === scheduleId) {
              return {
                ...s,
                status: "scheduled",
              }
            }
            return s
          })
          localStorage.setItem("contentSchedules", JSON.stringify(updated))
          return updated
        })
      }, 5000)
    } catch (error) {
      console.error("Error generating scheduled content:", error)

      // Extract the error message, handling term_exists errors specially
      let errorMessage = "Failed to generate content"
      if (error instanceof Error) {
        errorMessage = error.message

        // If it's a term_exists error, provide a more user-friendly message
        if (errorMessage.includes("term_exists")) {
          errorMessage = "A category with this name already exists. The post was still created successfully."

          // In this case, we'll treat it as a success with a warning
          setSchedules((prev) => {
            const updated = prev.map((s) => {
              if (s.id === scheduleId) {
                return {
                  ...s,
                  status: "completed",
                  lastRun: new Date().toISOString(),
                  nextRun: calculateNextRun(frequency, dayOfWeek, time),
                  result: "Content generated with a warning: " + errorMessage,
                }
              }
              return s
            })
            localStorage.setItem("contentSchedules", JSON.stringify(updated))
            return updated
          })

          // Show warning toast
          toast({
            title: "Content generated with warning",
            description: errorMessage,
            variant: "default",
          })

          // After a delay, set the status back to scheduled for the next run
          setTimeout(() => {
            setSchedules((prev) => {
              const updated = prev.map((s) => {
                if (s.id === scheduleId) {
                  return {
                    ...s,
                    status: "scheduled",
                  }
                }
                return s
              })
              localStorage.setItem("contentSchedules", JSON.stringify(updated))
              return updated
            })
          }, 5000)

          return // Exit early since we've handled this special case
        }
      }

      // Update the schedule with error status
      setSchedules((prev) => {
        const updated = prev.map((s) => {
          if (s.id === scheduleId) {
            return {
              ...s,
              status: "failed",
              result: errorMessage,
            }
          }
          return s
        })
        localStorage.setItem("contentSchedules", JSON.stringify(updated))
        return updated
      })

      // Show error toast
      toast({
        title: "Error generating content",
        description: errorMessage,
        variant: "destructive",
      })

      // After a delay, set the status back to scheduled for retry
      setTimeout(() => {
        setSchedules((prev) => {
          const updated = prev.map((s) => {
            if (s.id === scheduleId) {
              return {
                ...s,
                status: "scheduled",
              }
            }
            return s
          })
          localStorage.setItem("contentSchedules", JSON.stringify(updated))
          return updated
        })
      }, 10000)
    }
  }

  // Add a manual trigger function
  async function triggerScheduleNow(scheduleId: string) {
    const schedule = schedules.find((s) => s.id === scheduleId)
    if (!schedule) return

    // Update UI to show we're triggering the schedule
    toast({
      title: "Triggering schedule",
      description: "Manually running the scheduled content generation...",
    })

    // Call the generate function
    await generateScheduledContent(
      schedule.id,
      schedule.topic,
      schedule.frequency || "weekly",
      schedule.dayOfWeek || "monday",
      schedule.time,
      schedule.autoPublish || false,
      schedule.contentType || "blog-post",
      schedule.wordCount || 1500,
      schedule.tone || "professional",
      schedule.audience || "general",
    )
  }

  // Add a debug function to test scheduling
  function debugNextRun() {
    const testCases = [
      { freq: "daily", day: undefined, time: "09:00" },
      { freq: "weekly", day: "monday", time: "09:00" },
      { freq: "weekly", day: "friday", time: "09:00" },
      { freq: "biweekly", day: "monday", time: "09:00" },
      { freq: "monthly", day: undefined, time: "09:00" },
    ]

    console.log("Debug next run calculations:")
    testCases.forEach((test) => {
      const next = calculateNextRun(test.freq, test.day, test.time)
      console.log(`${test.freq} ${test.day || ""} at ${test.time}: ${formatNextRun(next)}`)
    })
  }

  // Call debug function on mount
  useEffect(() => {
    debugNextRun()
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{activeSchedule ? "Edit Schedule" : "Content Generation Schedule"}</CardTitle>
          <CardDescription>
            {activeSchedule
              ? "Edit your automated content generation and publishing schedule"
              : "Set up automated content generation and publishing"}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publishing Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>How often to generate and publish content</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("frequency") !== "daily" && (
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="tuesday">Tuesday</SelectItem>
                          <SelectItem value="wednesday">Wednesday</SelectItem>
                          <SelectItem value="thursday">Thursday</SelectItem>
                          <SelectItem value="friday">Friday</SelectItem>
                          <SelectItem value="saturday">Saturday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Which day to publish content</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormDescription>What time to publish content</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="topicKeywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic Keywords</FormLabel>
                    <FormControl>
                      <Input placeholder="wordpress, blogging, seo" {...field} />
                    </FormControl>
                    <FormDescription>Comma-separated keywords for content generation</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="advanced">
                  <AccordionTrigger>Advanced Options</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="contentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select content type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="blog-post">Blog Post</SelectItem>
                              <SelectItem value="how-to-guide">How-To Guide</SelectItem>
                              <SelectItem value="listicle">Listicle</SelectItem>
                              <SelectItem value="product-review">Product Review</SelectItem>
                              <SelectItem value="case-study">Case Study</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Type of content to generate</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="wordCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Word Count: {field.value}</FormLabel>
                          <FormControl>
                            <Slider
                              defaultValue={[field.value]}
                              min={300}
                              max={5000}
                              step={100}
                              onValueChange={(value) => field.onChange(value[0])}
                            />
                          </FormControl>
                          <FormDescription>Set your target word count for the content</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content Tone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select tone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="conversational">Conversational</SelectItem>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="formal">Formal</SelectItem>
                              <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                              <SelectItem value="authoritative">Authoritative</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Choose the tone of voice for your content</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="audience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Audience</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select audience" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="general">General Audience</SelectItem>
                              <SelectItem value="beginners">Beginners</SelectItem>
                              <SelectItem value="intermediate">Intermediate Users</SelectItem>
                              <SelectItem value="advanced">Advanced Users</SelectItem>
                              <SelectItem value="business">Business Professionals</SelectItem>
                              <SelectItem value="technical">Technical Audience</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Specify who your content is aimed at</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <FormField
                control={form.control}
                name="autoPublish"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Auto-Publish</FormLabel>
                      <FormDescription>Automatically publish generated content</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex flex-col space-y-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={() => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground",
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={date}
                            onSelect={(newDate) => {
                              if (newDate) {
                                setDate(newDate)
                                form.setValue("startDate", newDate)
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>When to start the content generation schedule</FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : activeSchedule ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Update Schedule
                  </>
                ) : (
                  "Save Schedule"
                )}
              </Button>

              {activeSchedule && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setActiveSchedule(null)
                    form.reset()
                  }}
                >
                  Cancel Editing
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Content</CardTitle>
          <CardDescription>Upcoming content generation and publishing</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No scheduled content yet. Set up a schedule to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium capitalize">{schedule.frequency}</div>
                          {schedule.frequency !== "daily" && schedule.dayOfWeek && (
                            <div className="text-xs text-muted-foreground capitalize">
                              {schedule.dayOfWeek}s at {schedule.time}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{schedule.topic}</TableCell>
                    <TableCell>
                      <div className="text-sm">{formatNextRun(schedule.nextRun)}</div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          schedule.status === "scheduled"
                            ? "bg-yellow-100 text-yellow-800"
                            : schedule.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : schedule.status === "in-progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800",
                        )}
                      >
                        {schedule.status}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs max-w-[200px] truncate">{schedule.result || "Waiting to run"}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editSchedule(schedule.id)}
                          disabled={isDeleting || schedule.status === "in-progress"}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => triggerScheduleNow(schedule.id)}
                          disabled={isDeleting || schedule.status === "in-progress"}
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span className="sr-only">Run Now</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSchedule(schedule.id)}
                          disabled={isDeleting || schedule.status === "in-progress"}
                        >
                          {isDeleting && activeSchedule === schedule.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">{schedules.length} scheduled posts</div>
          {schedules.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSchedules([])
                localStorage.removeItem("contentSchedules")
                toast({
                  title: "All schedules cleared",
                  description: "All scheduled content generation has been removed.",
                })
              }}
            >
              Clear All
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

