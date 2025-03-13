"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  X,
  Calendar,
  Clock,
  AlertCircle,
  Settings,
  LinkIcon,
  TrendingUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchPostsAction, saveSocialSettingsAction, scheduleSocialPostAction } from "@/lib/actions"

const socialAccountFormSchema = z.object({
  platform: z.string().min(1, { message: "Platform is required" }),
  accountName: z.string().min(1, { message: "Account name is required" }),
  accessToken: z.string().min(1, { message: "Access token is required" }),
  autoShare: z.boolean().default(false),
})

const socialPostFormSchema = z.object({
  postId: z.string().min(1, { message: "Post is required" }),
  platforms: z.array(z.string()).min(1, { message: "At least one platform is required" }),
  message: z.string().min(1, { message: "Message is required" }),
  includeImage: z.boolean().default(true),
  includeLink: z.boolean().default(true),
  scheduleDate: z.date().optional(),
  scheduleTime: z.string().optional(),
})

type SocialAccount = {
  id: string
  platform: string
  accountName: string
  accessToken: string
  autoShare: boolean
  connected: boolean
}

type SocialPost = {
  id: string
  postId: string
  postTitle: string
  platforms: string[]
  message: string
  includeImage: boolean
  includeLink: boolean
  scheduledFor?: Date
  status: "scheduled" | "published" | "failed"
  result?: string
}

const PLATFORM_ICONS = {
  twitter: <Twitter className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
}

export function SocialMediaIntegration() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [scheduledPosts, setScheduledPosts] = useState<SocialPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<string>("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)

  const accountForm = useForm<z.infer<typeof socialAccountFormSchema>>({
    resolver: zodResolver(socialAccountFormSchema),
    defaultValues: {
      platform: "",
      accountName: "",
      accessToken: "",
      autoShare: false,
    },
  })

  const postForm = useForm<z.infer<typeof socialPostFormSchema>>({
    resolver: zodResolver(socialPostFormSchema),
    defaultValues: {
      postId: "",
      platforms: [],
      message: "",
      includeImage: true,
      includeLink: true,
    },
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      // In a real implementation, fetch accounts from API/database
      // For demo purposes, we'll use mock data
      const mockAccounts: SocialAccount[] = [
        {
          id: "1",
          platform: "twitter",
          accountName: "@wordpressblog",
          accessToken: "••••••••••••••••",
          autoShare: true,
          connected: true,
        },
        {
          id: "2",
          platform: "facebook",
          accountName: "WordPress Blog",
          accessToken: "••••••••••••••••",
          autoShare: false,
          connected: true,
        },
      ]

      setAccounts(mockAccounts)

      // Fetch WordPress posts
      const fetchedPosts = await fetchPostsAction()
      setPosts(fetchedPosts)

      // In a real implementation, fetch scheduled posts from API/database
      // For demo purposes, we'll use mock data
      const mockScheduledPosts: SocialPost[] = [
        {
          id: "1",
          postId: "101",
          postTitle: "10 Essential WordPress Plugins for 2023",
          platforms: ["twitter", "facebook"],
          message: "Check out our latest blog post on essential WordPress plugins! #WordPress #Plugins",
          includeImage: true,
          includeLink: true,
          scheduledFor: new Date(Date.now() + 86400000), // Tomorrow
          status: "scheduled",
        },
        {
          id: "2",
          postId: "102",
          postTitle: "How to Speed Up Your WordPress Site",
          platforms: ["twitter", "linkedin"],
          message: "Learn how to make your WordPress site lightning fast! #WordPress #Performance",
          includeImage: true,
          includeLink: true,
          scheduledFor: new Date(Date.now() - 86400000), // Yesterday
          status: "published",
          result: "Posted successfully to Twitter and LinkedIn",
        },
      ]

      setScheduledPosts(mockScheduledPosts)
    } catch (error) {
      console.error("Error loading social media data:", error)
      setError("Failed to load social media data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  async function onAccountSubmit(data: z.infer<typeof socialAccountFormSchema>) {
    setIsConnecting(true)
    setError(null)

    try {
      // In a real implementation, this would call an API to save the account
      // For demo purposes, we'll simulate a delay and add to the local state
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newAccount: SocialAccount = {
        id: `account-${Date.now()}`,
        platform: data.platform,
        accountName: data.accountName,
        accessToken: data.accessToken,
        autoShare: data.autoShare,
        connected: true,
      }

      setAccounts([...accounts, newAccount])

      // Save settings to server
      await saveSocialSettingsAction({
        accounts: [...accounts, newAccount],
      })

      toast({
        title: "Account connected",
        description: `Your ${data.platform} account has been connected successfully.`,
      })

      // Reset form and close dialog
      accountForm.reset()
      setIsAddAccountOpen(false)
    } catch (error) {
      console.error("Error connecting account:", error)
      setError("Failed to connect account. Please check your credentials and try again.")

      toast({
        title: "Error connecting account",
        description: "Failed to connect social media account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  async function onPostSubmit(data: z.infer<typeof socialPostFormSchema>) {
    setIsScheduling(true)
    setError(null)

    try {
      // Find the selected post title
      const post = posts.find((p) => p.id.toString() === data.postId)
      const postTitle = post ? post.title.rendered : "Unknown Post"

      // Create a new scheduled post
      const newPost: SocialPost = {
        id: `post-${Date.now()}`,
        postId: data.postId,
        postTitle: postTitle,
        platforms: data.platforms,
        message: data.message,
        includeImage: data.includeImage,
        includeLink: data.includeLink,
        scheduledFor: data.scheduleDate,
        status: "scheduled",
      }

      // In a real implementation, this would call an API to schedule the post
      await scheduleSocialPostAction(newPost)

      // Add to local state
      setScheduledPosts([...scheduledPosts, newPost])

      toast({
        title: "Post scheduled",
        description: `Your post has been scheduled for sharing on ${data.platforms.length} platform(s).`,
      })

      // Reset form
      postForm.reset()
      setSelectedPlatforms([])
    } catch (error) {
      console.error("Error scheduling post:", error)
      setError("Failed to schedule post. Please try again.")

      toast({
        title: "Error scheduling post",
        description: "Failed to schedule social media post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsScheduling(false)
    }
  }

  function disconnectAccount(id: string) {
    const account = accounts.find((a) => a.id === id)
    if (!account) return

    // In a real implementation, this would call an API to disconnect the account
    const updatedAccounts = accounts.filter((a) => a.id !== id)
    setAccounts(updatedAccounts)

    toast({
      title: "Account disconnected",
      description: `Your ${account.platform} account has been disconnected.`,
    })
  }

  function cancelScheduledPost(id: string) {
    const post = scheduledPosts.find((p) => p.id === id)
    if (!post || post.status === "published") return

    // In a real implementation, this would call an API to cancel the scheduled post
    const updatedPosts = scheduledPosts.filter((p) => p.id !== id)
    setScheduledPosts(updatedPosts)

    toast({
      title: "Post canceled",
      description: "The scheduled social media post has been canceled.",
    })
  }

  function toggleAutoShare(id: string) {
    const updatedAccounts = accounts.map((account) => {
      if (account.id === id) {
        return { ...account, autoShare: !account.autoShare }
      }
      return account
    })

    setAccounts(updatedAccounts)

    // In a real implementation, this would call an API to update the setting
    toast({
      title: "Auto-share setting updated",
      description: "Your auto-share setting has been updated.",
    })
  }

  function getPlatformIcon(platform: string) {
    return PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS] || <Share2 className="h-4 w-4" />
  }

  function getPlatformColor(platform: string) {
    switch (platform) {
      case "twitter":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "facebook":
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100"
      case "linkedin":
        return "bg-sky-100 text-sky-800 hover:bg-sky-100"
      case "instagram":
        return "bg-pink-100 text-pink-800 hover:bg-pink-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  function handlePostSelect(postId: string) {
    setSelectedPost(postId)
    postForm.setValue("postId", postId)

    // Find the post and generate a default message
    const post = posts.find((p) => p.id.toString() === postId)
    if (post) {
      const title = post.title.rendered
      postForm.setValue("message", `Check out our latest blog post: ${title} #WordPress`)
    }
  }

  function handlePlatformSelect(platform: string) {
    let updatedPlatforms: string[]

    if (selectedPlatforms.includes(platform)) {
      // Remove platform if already selected
      updatedPlatforms = selectedPlatforms.filter((p) => p !== platform)
    } else {
      // Add platform if not already selected
      updatedPlatforms = [...selectedPlatforms, platform]
    }

    setSelectedPlatforms(updatedPlatforms)
    postForm.setValue("platforms", updatedPlatforms)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Social Media Integration</h2>
          <p className="text-muted-foreground">Connect and share your content on social media platforms</p>
        </div>
      </div>

      <Tabs defaultValue="share" className="space-y-4">
        <TabsList>
          <TabsTrigger value="share">Share Content</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Posts</TabsTrigger>
          <TabsTrigger value="accounts">Connected Accounts</TabsTrigger>
          <TabsTrigger value="analytics">Social Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="share" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Share to Social Media</CardTitle>
                <CardDescription>Create and schedule social media posts for your WordPress content</CardDescription>
              </CardHeader>
              <Form {...postForm}>
                <form onSubmit={postForm.handleSubmit(onPostSubmit)}>
                  <CardContent className="space-y-4">
                    {accounts.length === 0 ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No accounts connected</AlertTitle>
                        <AlertDescription>
                          You need to connect at least one social media account before you can share content.
                          <Button
                            variant="link"
                            className="p-0 h-auto font-normal"
                            onClick={() => setIsAddAccountOpen(true)}
                          >
                            Connect an account
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <FormField
                          control={postForm.control}
                          name="postId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Content</FormLabel>
                              <Select onValueChange={(value) => handlePostSelect(value)}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a post to share" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {posts.map((post) => (
                                    <SelectItem key={post.id} value={post.id.toString()}>
                                      {post.title.rendered}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>Choose a WordPress post to share on social media</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={postForm.control}
                          name="platforms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Platforms</FormLabel>
                              <FormControl>
                                <div className="flex flex-wrap gap-2">
                                  {accounts.map((account) => (
                                    <Badge
                                      key={account.id}
                                      variant="outline"
                                      className={cn(
                                        "cursor-pointer",
                                        selectedPlatforms.includes(account.platform)
                                          ? getPlatformColor(account.platform)
                                          : "bg-muted",
                                      )}
                                      onClick={() => handlePlatformSelect(account.platform)}
                                    >
                                      {getPlatformIcon(account.platform)}
                                      <span className="ml-1">{account.platform}</span>
                                    </Badge>
                                  ))}
                                </div>
                              </FormControl>
                              <FormDescription>Select the platforms where you want to share this post</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={postForm.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Write your social media message here..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>Write the message that will be shared on social media</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={postForm.control}
                          name="includeImage"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Include Featured Image</FormLabel>
                                <FormDescription>
                                  Attach the post's featured image to the social media post
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={postForm.control}
                          name="includeLink"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Include Link</FormLabel>
                                <FormDescription>Include a link back to the original post</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="space-y-2">
                          <FormLabel>Schedule (Optional)</FormLabel>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={postForm.control}
                              name="scheduleDate"
                              render={({ field }) => (
                                <FormItem>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground",
                                          )}
                                        >
                                          <Calendar className="mr-2 h-4 w-4" />
                                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <CalendarComponent
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormDescription>Date to publish the social media post</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={postForm.control}
                              name="scheduleTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="flex items-center">
                                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                      <Input type="time" placeholder="Select time" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormDescription>Time to publish the social media post</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {error && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isScheduling || accounts.length === 0} className="w-full">
                      {isScheduling ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <Share2 className="mr-2 h-4 w-4" />
                          {postForm.getValues().scheduleDate ? "Schedule Post" : "Share Now"}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Media Preview</CardTitle>
                <CardDescription>Preview how your post will look on social media</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPost ? (
                  <div className="space-y-4">
                    <div className="border rounded-md p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                        <div>
                          <p className="font-medium">WordPress Blog</p>
                          <p className="text-sm text-muted-foreground">@wordpressblog</p>
                        </div>
                      </div>
                      <p className="mb-3">{postForm.getValues().message || "Your message will appear here"}</p>
                      {postForm.getValues().includeImage && (
                        <div className="w-full h-48 bg-gray-200 rounded-md mb-3 flex items-center justify-center text-muted-foreground">
                          Featured Image
                        </div>
                      )}
                      {postForm.getValues().includeLink && (
                        <div className="border rounded-md overflow-hidden">
                          <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-muted-foreground">
                            Link Preview Image
                          </div>
                          <div className="p-3">
                            <p className="font-medium truncate">
                              {posts.find((p) => p.id.toString() === selectedPost)?.title.rendered || "Post Title"}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">yourblog.com</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>
                        This is a preview of how your post might appear on social media platforms. Actual appearance may
                        vary.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Select a post and customize your message to see a preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Social Media Posts</CardTitle>
              <CardDescription>Manage your scheduled social media posts</CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No scheduled social media posts</p>
                  <Button variant="outline" className="mt-4" onClick={() => postForm.reset()}>
                    Create a New Post
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Post</TableHead>
                      <TableHead>Platforms</TableHead>
                      <TableHead>Scheduled For</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">{post.postTitle}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {post.platforms.map((platform) => (
                              <Badge key={platform} variant="outline" className={getPlatformColor(platform)}>
                                {getPlatformIcon(platform)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {post.scheduledFor ? (
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                              {format(new Date(post.scheduledFor), "PPP p")}
                            </div>
                          ) : (
                            "Immediate"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              post.status === "published"
                                ? "default"
                                : post.status === "scheduled"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {post.status === "published" && <Check className="mr-1 h-3 w-3" />}
                            {post.status === "failed" && <X className="mr-1 h-3 w-3" />}
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {post.status === "scheduled" ? (
                            <Button variant="ghost" size="sm" onClick={() => cancelScheduledPost(post.id)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Cancel</span>
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" disabled>
                              <Check className="h-4 w-4" />
                              <span className="sr-only">Completed</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Connected Social Media Accounts</h3>
            <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Connect Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect Social Media Account</DialogTitle>
                  <DialogDescription>
                    Connect your social media account to share your WordPress content.
                  </DialogDescription>
                </DialogHeader>
                <Form {...accountForm}>
                  <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-4">
                    <FormField
                      control={accountForm.control}
                      name="platform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Platform</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select platform" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="twitter">Twitter</SelectItem>
                              <SelectItem value="facebook">Facebook</SelectItem>
                              <SelectItem value="linkedin">LinkedIn</SelectItem>
                              <SelectItem value="instagram">Instagram</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Select the social media platform to connect</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accountForm.control}
                      name="accountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input placeholder="@youraccount" {...field} />
                          </FormControl>
                          <FormDescription>Your account name or handle on the platform</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accountForm.control}
                      name="accessToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Access Token</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••••••••••" {...field} />
                          </FormControl>
                          <FormDescription>
                            The API access token for your account
                            <Button variant="link" className="p-0 h-auto font-normal ml-1">
                              How to get this?
                            </Button>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accountForm.control}
                      name="autoShare"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Auto-Share New Posts</FormLabel>
                            <FormDescription>Automatically share new WordPress posts on this platform</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddAccountOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isConnecting}>
                        {isConnecting ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          "Connect Account"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No social media accounts connected</p>
                  <Button onClick={() => setIsAddAccountOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Connect Account
                  </Button>
                </CardContent>
              </Card>
            ) : (
              accounts.map((account) => (
                <Card key={account.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                            getPlatformColor(account.platform),
                          )}
                        >
                          {getPlatformIcon(account.platform)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{account.accountName}</CardTitle>
                          <CardDescription>{account.platform}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={account.connected ? "default" : "destructive"}>
                        {account.connected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center">
                        <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Auto-share new posts</span>
                      </div>
                      <Switch checked={account.autoShare} onCheckedChange={() => toggleAutoShare(account.id)} />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => disconnectAccount(account.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Analytics</CardTitle>
              <CardDescription>Track the performance of your social media posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p className="text-muted-foreground mb-4">Social media analytics coming soon</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  We're working on integrating analytics for your social media posts. This feature will be available in
                  a future update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

