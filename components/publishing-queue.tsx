"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Edit, ExternalLink, MoreHorizontal, Trash2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { fetchPostsAction, publishPostNowAction, deletePostAction } from "@/lib/actions"

type QueueItem = {
  id: string
  title: string
  status: "draft" | "scheduled" | "published"
  date: string
  time?: string
}

export function PublishingQueue() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    setIsLoading(true)
    try {
      const posts = await fetchPostsAction()

      // Transform WordPress posts to our format
      const formattedPosts = posts.map((post: any) => {
        const date = new Date(post.date)
        return {
          id: post.id.toString(),
          title: post.title.rendered,
          status: post.status,
          date: date.toISOString().split("T")[0],
          time: date.toTimeString().split(" ")[0].substring(0, 5),
        }
      })

      setQueueItems(formattedPosts)
    } catch (error) {
      console.error("Error loading posts:", error)
      toast({
        title: "Error loading posts",
        description: "There was an error loading your posts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function deleteItem(id: string) {
    try {
      await deletePostAction(id)
      setQueueItems(queueItems.filter((item) => item.id !== id))
      toast({
        title: "Item removed",
        description: "The item has been removed from the queue.",
      })
    } catch (error) {
      toast({
        title: "Error removing item",
        description: "There was an error removing the item. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function publishNow(id: string) {
    try {
      await publishPostNowAction(id)
      setQueueItems(
        queueItems.map((item) =>
          item.id === id
            ? { ...item, status: "published" as const, date: new Date().toISOString().split("T")[0] }
            : item,
        ),
      )
      toast({
        title: "Item published",
        description: "The item has been published to your WordPress site.",
      })
    } catch (error) {
      toast({
        title: "Error publishing item",
        description: "There was an error publishing the item. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Publishing Queue</CardTitle>
          <CardDescription>Manage your content publishing schedule</CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={loadPosts} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading posts...
                </TableCell>
              </TableRow>
            ) : queueItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No items in the publishing queue
                </TableCell>
              </TableRow>
            ) : (
              queueItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div
                        className={`h-2 w-2 rounded-full mr-2 ${
                          item.status === "publish"
                            ? "bg-green-500"
                            : item.status === "future"
                              ? "bg-blue-500"
                              : "bg-yellow-500"
                        }`}
                      />
                      <span className="capitalize">{item.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {item.date}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.time && (
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        {item.time}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast({ title: "Edit", description: "Editing content" })}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {item.status !== "publish" && (
                          <DropdownMenuItem onClick={() => publishNow(item.id)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Publish Now
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => deleteItem(item.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

