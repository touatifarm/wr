"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, Plus, Edit, Trash2, Clock } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { fetchPostsAction } from "@/lib/actions"

type CalendarEvent = {
  id: string
  title: string
  date: Date
  status: "draft" | "scheduled" | "published" | "idea"
  type: "post" | "idea"
  description?: string
  category?: string
}

export function ContentCalendar() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: "",
    description: "",
    type: "idea",
    status: "idea",
    category: "uncategorized",
  })
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isViewEventOpen, setIsViewEventOpen] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [currentMonth])

  async function loadEvents() {
    setIsLoading(true)
    try {
      // Fetch WordPress posts
      const posts = await fetchPostsAction()

      // Convert WordPress posts to calendar events
      const postEvents = posts.map((post: any) => ({
        id: post.id.toString(),
        title: post.title.rendered,
        date: new Date(post.date),
        status: post.status as "draft" | "scheduled" | "published",
        type: "post",
        description: post.excerpt?.rendered || "",
      }))

      // Combine with any local events (ideas)
      // In a real app, these would be stored in a database
      const localEvents: CalendarEvent[] = JSON.parse(localStorage.getItem("contentIdeas") || "[]")

      setEvents([...postEvents, ...localEvents])
    } catch (error) {
      console.error("Error loading events:", error)
      toast({
        title: "Error loading events",
        description: "Could not load all scheduled posts and content ideas.",
        variant: "destructive",
      })

      // Set some sample events for demonstration
      setEvents(getSampleEvents())
    } finally {
      setIsLoading(false)
    }
  }

  function getSampleEvents(): CalendarEvent[] {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    return [
      {
        id: "sample-1",
        title: "WordPress Security Best Practices",
        date: tomorrow,
        status: "scheduled",
        type: "post",
        description: "A comprehensive guide to securing your WordPress site.",
        category: "security",
      },
      {
        id: "sample-2",
        title: "Content Marketing Strategy",
        date: nextWeek,
        status: "idea",
        type: "idea",
        description: "Ideas for developing an effective content marketing strategy.",
        category: "marketing",
      },
    ]
  }

  function handlePreviousMonth() {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  function handleNextMonth() {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  function handleDateSelect(date: Date | undefined) {
    setSelectedDate(date)

    // If there are events on this date, open the event view dialog
    const eventsOnDate = events.filter((event) => date && isSameDay(new Date(event.date), date))
    if (eventsOnDate.length === 1) {
      setSelectedEvent(eventsOnDate[0])
      setIsViewEventOpen(true)
    } else if (eventsOnDate.length > 1) {
      // If multiple events, just select the date but don't open any dialog
      // The events will be shown in the sidebar
    } else {
      // If no events, prepare to add a new event
      if (date) {
        setNewEvent({
          ...newEvent,
          date: date,
        })
        setIsAddEventOpen(true)
      }
    }
  }

  function handleAddEvent() {
    if (!newEvent.title || !newEvent.date) {
      toast({
        title: "Missing information",
        description: "Please provide a title and date for the event.",
        variant: "destructive",
      })
      return
    }

    const event: CalendarEvent = {
      id: `idea-${Date.now()}`,
      title: newEvent.title || "",
      date: newEvent.date as Date,
      status: newEvent.status as "draft" | "scheduled" | "published" | "idea",
      type: newEvent.type as "post" | "idea",
      description: newEvent.description,
      category: newEvent.category,
    }

    // Add the new event
    const updatedEvents = [...events, event]
    setEvents(updatedEvents)

    // Save ideas to localStorage (in a real app, save to database)
    if (event.type === "idea") {
      const ideas = updatedEvents.filter((e) => e.type === "idea")
      localStorage.setItem("contentIdeas", JSON.stringify(ideas))
    }

    // Reset form and close dialog
    setNewEvent({
      title: "",
      description: "",
      type: "idea",
      status: "idea",
      category: "uncategorized",
    })
    setIsAddEventOpen(false)

    toast({
      title: "Event added",
      description: `"${event.title}" has been added to your content calendar.`,
    })
  }

  function handleDeleteEvent(id: string) {
    const eventToDelete = events.find((event) => event.id === id)
    if (!eventToDelete) return

    if (
      eventToDelete.type === "post" &&
      (eventToDelete.status === "published" || eventToDelete.status === "scheduled")
    ) {
      toast({
        title: "Cannot delete",
        description:
          "Published or scheduled posts cannot be deleted from the calendar. Use the Publishing Queue instead.",
        variant: "destructive",
      })
      return
    }

    const updatedEvents = events.filter((event) => event.id !== id)
    setEvents(updatedEvents)

    // Update localStorage if it's an idea
    if (eventToDelete.type === "idea") {
      const ideas = updatedEvents.filter((e) => e.type === "idea")
      localStorage.setItem("contentIdeas", JSON.stringify(ideas))
    }

    setIsViewEventOpen(false)

    toast({
      title: "Event deleted",
      description: `"${eventToDelete.title}" has been removed from your content calendar.`,
    })
  }

  // Get events for the selected date
  const selectedDateEvents = selectedDate ? events.filter((event) => isSameDay(new Date(event.date), selectedDate)) : []

  // Get all days in the current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Content Calendar</h2>
          <p className="text-muted-foreground">Plan and schedule your content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreviousMonth}>
            Previous
          </Button>
          <h3 className="text-lg font-medium px-2">{format(currentMonth, "MMMM yyyy")}</h3>
          <Button variant="outline" onClick={handleNextMonth}>
            Next
          </Button>
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Content Idea
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Content Idea</DialogTitle>
                <DialogDescription>Add a new content idea or planned post to your calendar.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Enter content title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newEvent.date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newEvent.date ? format(newEvent.date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newEvent.date}
                        onSelect={(date) => setNewEvent({ ...newEvent, date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Content Idea</SelectItem>
                      <SelectItem value="post">Planned Post</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newEvent.category}
                    onValueChange={(value) => setNewEvent({ ...newEvent, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uncategorized">Uncategorized</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="seo">SEO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Brief description of the content"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEvent}>Add to Calendar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <div className="md:col-span-5">
          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="text-center py-8">Loading calendar...</div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center font-medium text-sm py-2">
                      {day}
                    </div>
                  ))}

                  {/* Fill in empty cells for days of the week before the first day of the month */}
                  {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, index) => (
                    <div key={`empty-start-${index}`} className="h-24 border rounded-md bg-muted/20"></div>
                  ))}

                  {/* Calendar days */}
                  {daysInMonth.map((day) => {
                    const dayEvents = events.filter((event) => isSameDay(new Date(event.date), day))
                    const isSelected = selectedDate && isSameDay(day, selectedDate)

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "h-24 border rounded-md p-1 overflow-hidden",
                          isToday(day) && "bg-muted/50 border-primary",
                          isSelected && "border-primary border-2",
                          "hover:bg-muted/30 cursor-pointer transition-colors",
                        )}
                        onClick={() => handleDateSelect(day)}
                      >
                        <div className="flex justify-between items-start">
                          <span className={cn("text-sm font-medium", isToday(day) && "text-primary")}>
                            {format(day, "d")}
                          </span>
                          {dayEvents.length > 0 && <Badge variant="outline">{dayEvents.length}</Badge>}
                        </div>
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "text-xs truncate rounded px-1 py-0.5",
                                event.status === "published" && "bg-green-100 text-green-800",
                                event.status === "scheduled" && "bg-blue-100 text-blue-800",
                                event.status === "draft" && "bg-yellow-100 text-yellow-800",
                                event.status === "idea" && "bg-purple-100 text-purple-800",
                              )}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-muted-foreground">+{dayEvents.length - 2} more</div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Fill in empty cells for days of the week after the last day of the month */}
                  {Array.from({ length: 6 - endOfMonth(currentMonth).getDay() }).map((_, index) => (
                    <div key={`empty-end-${index}`} className="h-24 border rounded-md bg-muted/20"></div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}</CardTitle>
              <CardDescription>
                {selectedDateEvents.length === 0
                  ? "No content planned for this date"
                  : `${selectedDateEvents.length} item${selectedDateEvents.length > 1 ? "s" : ""} planned`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>Select a date with content or add a new content idea</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border rounded-md p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedEvent(event)
                        setIsViewEventOpen(true)
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{event.title}</h4>
                        <Badge
                          variant="outline"
                          className={cn(
                            event.status === "published" && "bg-green-100 text-green-800 hover:bg-green-100",
                            event.status === "scheduled" && "bg-blue-100 text-blue-800 hover:bg-blue-100",
                            event.status === "draft" && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                            event.status === "idea" && "bg-purple-100 text-purple-800 hover:bg-purple-100",
                          )}
                        >
                          {event.status}
                        </Badge>
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {event.description.replace(/<\/?[^>]+(>|$)/g, "")}
                        </p>
                      )}
                      {event.category && (
                        <div className="mt-2">
                          <Badge variant="secondary">{event.category}</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  if (selectedDate) {
                    setNewEvent({
                      ...newEvent,
                      date: selectedDate,
                    })
                    setIsAddEventOpen(true)
                  }
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Content for {selectedDate ? format(selectedDate, "MMM d") : "This Date"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* View Event Dialog */}
      <Dialog open={isViewEventOpen} onOpenChange={setIsViewEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              Scheduled for {selectedEvent?.date ? format(new Date(selectedEvent.date), "MMMM d, yyyy") : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge
                variant="outline"
                className={cn(
                  selectedEvent?.status === "published" && "bg-green-100 text-green-800",
                  selectedEvent?.status === "scheduled" && "bg-blue-100 text-blue-800",
                  selectedEvent?.status === "draft" && "bg-yellow-100 text-yellow-800",
                  selectedEvent?.status === "idea" && "bg-purple-100 text-purple-800",
                )}
              >
                {selectedEvent?.status}
              </Badge>
              {selectedEvent?.category && <Badge variant="secondary">{selectedEvent.category}</Badge>}
              <Badge variant="outline">{selectedEvent?.type}</Badge>
            </div>

            {selectedEvent?.description && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.description.replace(/<\/?[^>]+(>|$)/g, "")}
                </p>
              </div>
            )}

            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              Added {format(new Date(), "MMMM d, yyyy")}
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
              disabled={
                selectedEvent?.type === "post" &&
                (selectedEvent?.status === "published" || selectedEvent?.status === "scheduled")
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <div>
              <Button variant="outline" onClick={() => setIsViewEventOpen(false)} className="mr-2">
                Close
              </Button>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <span>Published</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
              <span>Scheduled</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
              <span>Draft</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-purple-500 mr-2"></div>
              <span>Content Idea</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

