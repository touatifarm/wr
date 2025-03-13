"use client"

import { useState, useEffect } from "react"
import {
  MessageSquare,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  MessageSquareText,
  Calendar,
  Edit,
  Trash2,
  Send,
} from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { format } from "date-fns"
import {
  fetchCommentsAction,
  approveCommentAction,
  replyToCommentAction,
  deleteCommentAction,
  updateCommentAction,
} from "@/lib/actions"

type Comment = {
  id: string
  author: string
  authorEmail: string
  authorAvatar?: string
  content: string
  date: string
  status: "approved" | "pending" | "spam" | "trash"
  postId: string
  postTitle: string
  parent?: string
  replies?: Comment[]
}

// Define schemas for our forms
const replyFormSchema = z.object({
  content: z.string().min(1, { message: "Reply cannot be empty" }),
})

const editFormSchema = z.object({
  content: z.string().min(1, { message: "Comment cannot be empty" }),
})

export function CommentManagement() {
  const [comments, setComments] = useState<Comment[]>([])
  const [filteredComments, setFilteredComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [isReplying, setIsReplying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedComments, setSelectedComments] = useState<string[]>([])
  const [isBulkActioning, setIsBulkActioning] = useState(false)

  // Setup forms with react-hook-form
  const replyForm = useForm<z.infer<typeof replyFormSchema>>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: {
      content: "",
    },
  })

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      content: "",
    },
  })

  useEffect(() => {
    loadComments()
  }, [])

  useEffect(() => {
    filterComments()
  }, [comments, searchTerm, statusFilter])

  async function loadComments() {
    setIsLoading(true)
    try {
      const fetchedComments = await fetchCommentsAction()
      setComments(fetchedComments)
    } catch (error) {
      console.error("Error loading comments:", error)
      toast({
        title: "Error loading comments",
        description: "Failed to load comments. Please try again.",
        variant: "destructive",
      })

      // Set sample comments for demonstration
      setComments(getSampleComments())
    } finally {
      setIsLoading(false)
    }
  }

  function getSampleComments(): Comment[] {
    return [
      {
        id: "1",
        author: "John Smith",
        authorEmail: "john@example.com",
        authorAvatar: "",
        content: "Great article! I found it very informative and well-written.",
        date: new Date(Date.now() - 86400000).toISOString(),
        status: "approved",
        postId: "101",
        postTitle: "10 Essential WordPress Plugins for 2023",
      },
      {
        id: "2",
        author: "Jane Doe",
        authorEmail: "jane@example.com",
        authorAvatar: "",
        content:
          "I have a question about the third plugin you mentioned. Does it work with the latest WordPress version?",
        date: new Date(Date.now() - 172800000).toISOString(),
        status: "approved",
        postId: "101",
        postTitle: "10 Essential WordPress Plugins for 2023",
        replies: [
          {
            id: "3",
            author: "Admin",
            authorEmail: "admin@example.com",
            authorAvatar: "",
            content: "Yes, all the plugins mentioned in the article are compatible with the latest WordPress version.",
            date: new Date(Date.now() - 86400000).toISOString(),
            status: "approved",
            postId: "101",
            postTitle: "10 Essential WordPress Plugins for 2023",
            parent: "2",
          },
        ],
      },
      {
        id: "4",
        author: "Spam Bot",
        authorEmail: "spam@example.com",
        authorAvatar: "",
        content: "Check out my website for amazing deals! [link removed]",
        date: new Date(Date.now() - 43200000).toISOString(),
        status: "spam",
        postId: "102",
        postTitle: "How to Speed Up Your WordPress Site",
      },
      {
        id: "5",
        author: "New Visitor",
        authorEmail: "visitor@example.com",
        authorAvatar: "",
        content: "I just implemented these tips and my site is much faster now. Thanks!",
        date: new Date().toISOString(),
        status: "pending",
        postId: "102",
        postTitle: "How to Speed Up Your WordPress Site",
      },
    ]
  }

  function filterComments() {
    let filtered = [...comments]

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((comment) => comment.status === statusFilter)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (comment) =>
          comment.author.toLowerCase().includes(term) ||
          comment.content.toLowerCase().includes(term) ||
          comment.postTitle.toLowerCase().includes(term),
      )
    }

    setFilteredComments(filtered)
  }

  async function handleApproveComment(id: string) {
    try {
      await approveCommentAction(id)

      // Update local state
      const updatedComments = comments.map((comment) => {
        if (comment.id === id) {
          return { ...comment, status: "approved" }
        }
        return comment
      })

      setComments(updatedComments)

      toast({
        title: "Comment approved",
        description: "The comment has been approved and is now visible on your site.",
      })
    } catch (error) {
      console.error("Error approving comment:", error)
      toast({
        title: "Error approving comment",
        description: "Failed to approve comment. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function handleSpamComment(id: string) {
    try {
      // In a real implementation, this would call an API

      // Update local state
      const updatedComments = comments.map((comment) => {
        if (comment.id === id) {
          return { ...comment, status: "spam" }
        }
        return comment
      })

      setComments(updatedComments)

      toast({
        title: "Comment marked as spam",
        description: "The comment has been marked as spam and is no longer visible on your site.",
      })
    } catch (error) {
      console.error("Error marking comment as spam:", error)
      toast({
        title: "Error marking comment as spam",
        description: "Failed to mark comment as spam. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function handleTrashComment(id: string) {
    try {
      // In a real implementation, this would call an API

      // Update local state
      const updatedComments = comments.map((comment) => {
        if (comment.id === id) {
          return { ...comment, status: "trash" }
        }
        return comment
      })

      setComments(updatedComments)

      toast({
        title: "Comment moved to trash",
        description: "The comment has been moved to the trash.",
      })
    } catch (error) {
      console.error("Error trashing comment:", error)
      toast({
        title: "Error trashing comment",
        description: "Failed to move comment to trash. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function onReplySubmit(data: z.infer<typeof replyFormSchema>) {
    if (!selectedComment) return

    setIsReplying(true)

    try {
      // In a real implementation, this would call an API
      await replyToCommentAction(selectedComment.id, data.content)

      // Create a new reply
      const newReply: Comment = {
        id: `reply-${Date.now()}`,
        author: "Admin",
        authorEmail: "admin@example.com",
        authorAvatar: "",
        content: data.content,
        date: new Date().toISOString(),
        status: "approved",
        postId: selectedComment.postId,
        postTitle: selectedComment.postTitle,
        parent: selectedComment.id,
      }

      // Update local state
      const updatedComments = comments.map((comment) => {
        if (comment.id === selectedComment.id) {
          return {
            ...comment,
            replies: comment.replies ? [...comment.replies, newReply] : [newReply],
          }
        }
        return comment
      })

      setComments(updatedComments)

      // Reset form
      replyForm.reset()
      setIsReplyDialogOpen(false)

      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully.",
      })
    } catch (error) {
      console.error("Error replying to comment:", error)
      toast({
        title: "Error posting reply",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsReplying(false)
    }
  }

  async function onEditSubmit(data: z.infer<typeof editFormSchema>) {
    if (!selectedComment) return

    setIsEditing(true)

    try {
      // In a real implementation, this would call an API
      await updateCommentAction(selectedComment.id, data.content)

      // Update local state
      const updatedComments = comments.map((comment) => {
        if (comment.id === selectedComment.id) {
          return { ...comment, content: data.content }
        }
        return comment
      })

      setComments(updatedComments)

      // Reset form
      editForm.reset()
      setIsEditDialogOpen(false)

      toast({
        title: "Comment updated",
        description: "The comment has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating comment:", error)
      toast({
        title: "Error updating comment",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEditing(false)
    }
  }

  async function handleDeleteComment() {
    if (!selectedComment) return

    setIsDeleting(true)

    try {
      // In a real implementation, this would call an API
      await deleteCommentAction(selectedComment.id)

      // Update local state
      const updatedComments = comments.filter((comment) => comment.id !== selectedComment.id)

      setComments(updatedComments)

      // Reset form
      setIsDeleteDialogOpen(false)

      toast({
        title: "Comment deleted",
        description: "The comment has been permanently deleted.",
      })
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Error deleting comment",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  function handleSelectComment(id: string) {
    if (selectedComments.includes(id)) {
      setSelectedComments(selectedComments.filter((commentId) => commentId !== id))
    } else {
      setSelectedComments([...selectedComments, id])
    }
  }

  function handleSelectAllComments(checked: boolean) {
    if (checked) {
      setSelectedComments(filteredComments.map((comment) => comment.id))
    } else {
      setSelectedComments([])
    }
  }

  async function handleBulkAction(action: string) {
    if (selectedComments.length === 0) return

    setIsBulkActioning(true)

    try {
      // In a real implementation, this would call an API

      // Update local state based on the action
      let updatedComments = [...comments]

      if (action === "approve") {
        updatedComments = comments.map((comment) => {
          if (selectedComments.includes(comment.id)) {
            return { ...comment, status: "approved" }
          }
          return comment
        })
      } else if (action === "spam") {
        updatedComments = comments.map((comment) => {
          if (selectedComments.includes(comment.id)) {
            return { ...comment, status: "spam" }
          }
          return comment
        })
      } else if (action === "trash") {
        updatedComments = comments.map((comment) => {
          if (selectedComments.includes(comment.id)) {
            return { ...comment, status: "trash" }
          }
          return comment
        })
      } else if (action === "delete") {
        updatedComments = comments.filter((comment) => !selectedComments.includes(comment.id))
      }

      setComments(updatedComments)

      // Reset selection
      setSelectedComments([])

      toast({
        title: "Bulk action completed",
        description: `${selectedComments.length} comments have been processed.`,
      })
    } catch (error) {
      console.error("Error performing bulk action:", error)
      toast({
        title: "Error performing bulk action",
        description: "Failed to process comments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsBulkActioning(false)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "approved":
        return <Badge variant="default">Approved</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "spam":
        return <Badge variant="destructive">Spam</Badge>
      case "trash":
        return <Badge variant="secondary">Trash</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Comment Management</h2>
          <p className="text-muted-foreground">Manage and respond to comments on your WordPress blog</p>
        </div>
        <Button onClick={loadComments} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setStatusFilter} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="spam">Spam</TabsTrigger>
            <TabsTrigger value="trash">Trash</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search comments..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => {}}>Recent comments</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => {}}>Comments with replies</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => {}}>Comments without replies</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No comments found</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedComments.length === filteredComments.length && filteredComments.length > 0}
                      onCheckedChange={handleSelectAllComments}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium">
                      Select All
                    </label>
                  </div>

                  {selectedComments.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{selectedComments.length} selected</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" disabled={isBulkActioning}>
                            {isBulkActioning ? (
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <ChevronDown className="mr-2 h-4 w-4" />
                            )}
                            Bulk Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleBulkAction("approve")}>
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleBulkAction("spam")}>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Mark as Spam
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleBulkAction("trash")}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Move to Trash
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => handleBulkAction("delete")}
                            className="text-destructive focus:text-destructive"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30px]"></TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>In Response To</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComments.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedComments.includes(comment.id)}
                            onCheckedChange={() => handleSelectComment(comment.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar>
                              <AvatarImage src={comment.authorAvatar} />
                              <AvatarFallback>{getInitials(comment.author)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{comment.author}</div>
                              <div className="text-sm text-muted-foreground">{comment.authorEmail}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <div className="line-clamp-2">{comment.content}</div>
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="mt-1 text-sm text-muted-foreground">
                                {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <a href="#" className="text-blue-500 hover:underline">
                            {comment.postTitle}
                          </a>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            {format(new Date(comment.date), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(comment.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {comment.status === "pending" && (
                              <Button variant="ghost" size="sm" onClick={() => handleApproveComment(comment.id)}>
                                <Check className="h-4 w-4" />
                                <span className="sr-only">Approve</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedComment(comment)
                                replyForm.reset()
                                setIsReplyDialogOpen(true)
                              }}
                            >
                              <MessageSquareText className="h-4 w-4" />
                              <span className="sr-only">Reply</span>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <ChevronDown className="h-4 w-4" />
                                  <span className="sr-only">More</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setSelectedComment(comment)
                                    editForm.setValue("content", comment.content)
                                    setIsEditDialogOpen(true)
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleSpamComment(comment.id)}>
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  Mark as Spam
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleTrashComment(comment.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Move to Trash
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setSelectedComment(comment)
                                    setIsDeleteDialogOpen(true)
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Delete Permanently
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Comment</DialogTitle>
            <DialogDescription>
              Reply to {selectedComment?.author}'s comment on "{selectedComment?.postTitle}"
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-md mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback>{selectedComment ? getInitials(selectedComment.author) : ""}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{selectedComment?.author}</span>
            </div>
            <p className="text-sm">{selectedComment?.content}</p>
          </div>
          <Form {...replyForm}>
            <form onSubmit={replyForm.handleSubmit(onReplySubmit)} className="space-y-4">
              <FormField
                control={replyForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your reply</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Write your reply..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsReplyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isReplying}>
                  {isReplying ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Replying...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Post Reply
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Comment</DialogTitle>
            <DialogDescription>
              Edit {selectedComment?.author}'s comment on "{selectedComment?.postTitle}"
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Edit comment</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Edit the comment..." className="min-h-[150px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditing}>
                  {isEditing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Update Comment
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this comment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                This will permanently delete the comment and any replies. This action cannot be undone.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteComment} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

