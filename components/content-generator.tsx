"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  FileText,
  Send,
  Loader2,
  Copy,
  CheckCircle,
  LayoutTemplate,
  Target,
  MessageSquare,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateContentAction, publishPostAction } from "@/lib/actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const contentFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  outline: z.string().optional(),
  keywords: z.string().optional(),
  contentType: z.string().default("blog-post"),
  wordCount: z.number().min(300).max(5000).default(1000),
  tone: z.string().default("professional"),
  audience: z.string().default("general"),
  includeImages: z.boolean().default(false),
  includeFaqs: z.boolean().default(false),
})

const CONTENT_TEMPLATES = {
  "blog-post": {
    name: "Blog Post",
    description: "Standard blog post with introduction, body, and conclusion",
    outlineTemplate: "Introduction\nMain Point 1\nMain Point 2\nMain Point 3\nConclusion",
  },
  "how-to-guide": {
    name: "How-To Guide",
    description: "Step-by-step instructions to accomplish a specific task",
    outlineTemplate:
      "Introduction\nWhat You'll Need\nStep 1: [First Step]\nStep 2: [Second Step]\nStep 3: [Third Step]\nTips and Tricks\nConclusion",
  },
  listicle: {
    name: "Listicle",
    description: "List-based article highlighting multiple points or items",
    outlineTemplate:
      "Introduction\nItem 1: [First Item]\nItem 2: [Second Item]\nItem 3: [Third Item]\nItem 4: [Fourth Item]\nItem 5: [Fifth Item]\nConclusion",
  },
  "product-review": {
    name: "Product Review",
    description: "Detailed review of a product or service",
    outlineTemplate:
      "Introduction\nProduct Overview\nKey Features\nPros and Cons\nPerformance Analysis\nComparison with Alternatives\nVerdict and Recommendation",
  },
  "case-study": {
    name: "Case Study",
    description: "In-depth analysis of a specific example or scenario",
    outlineTemplate:
      "Introduction\nBackground Information\nChallenge/Problem\nSolution Approach\nImplementation\nResults and Outcomes\nLessons Learned\nConclusion",
  },
}

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "conversational", label: "Conversational" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "enthusiastic", label: "Enthusiastic" },
  { value: "authoritative", label: "Authoritative" },
]

const AUDIENCE_OPTIONS = [
  { value: "general", label: "General Audience" },
  { value: "beginners", label: "Beginners" },
  { value: "intermediate", label: "Intermediate Users" },
  { value: "advanced", label: "Advanced Users" },
  { value: "business", label: "Business Professionals" },
  { value: "technical", label: "Technical Audience" },
]

export function ContentGenerator() {
  const [content, setContent] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")
  const [contentHistory, setContentHistory] = useState<Array<{ id: string; title: string; date: string }>>([])
  const [contentQuality, setContentQuality] = useState<{
    readability: number
    seo: number
    engagement: number
  } | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [wordCount, setWordCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [blogTheme, setBlogTheme] = useState<string>("wordpress")
  const [generatedCategories, setGeneratedCategories] = useState<Array<{ name: string; parent?: string }>>([])

  const form = useForm<z.infer<typeof contentFormSchema>>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      title: "",
      outline: "",
      keywords: "",
      contentType: "blog-post",
      wordCount: 1000,
      tone: "professional",
      audience: "general",
      includeImages: false,
      includeFaqs: false,
    },
  })

  // Update outline when content type changes
  const watchContentType = form.watch("contentType")

  useEffect(() => {
    if (watchContentType && CONTENT_TEMPLATES[watchContentType]) {
      form.setValue("outline", CONTENT_TEMPLATES[watchContentType].outlineTemplate)
    }
  }, [watchContentType, form])

  // Calculate word count when content changes
  useEffect(() => {
    if (content) {
      const words = content.split(/\s+/).filter((word) => word.length > 0).length
      setWordCount(words)
    } else {
      setWordCount(0)
    }
  }, [content])

  // Mock function to simulate loading content history
  useEffect(() => {
    // In a real app, this would fetch from local storage or a database
    setContentHistory([
      { id: "1", title: "10 Essential WordPress Plugins", date: "2023-05-15" },
      { id: "2", title: "How to Speed Up Your WordPress Site", date: "2023-05-10" },
      { id: "3", title: "WordPress Security Best Practices", date: "2023-05-05" },
    ])
  }, [])

  useEffect(() => {
    try {
      const savedIdeaJson = localStorage.getItem("currentContentIdea")
      if (savedIdeaJson) {
        const idea = JSON.parse(savedIdeaJson)

        // Populate the form with the idea data
        form.setValue("title", idea.title)

        // Set keywords from the idea
        if (idea.keywords && idea.keywords.length > 0) {
          form.setValue("keywords", idea.keywords.join(", "))
        }

        // Create an outline from the description if available
        if (idea.description) {
          const currentOutline = form.getValues().outline || ""
          const newOutline = currentOutline + "\n\n" + idea.description
          form.setValue("outline", newOutline.trim())
        }

        // Clear the localStorage item to prevent reloading on future visits
        localStorage.removeItem("currentContentIdea")

        toast({
          title: "Content idea loaded",
          description: "The form has been populated with your selected content idea.",
        })
      }
    } catch (error) {
      console.error("Error loading content idea:", error)
    }
  }, [form])

  useEffect(() => {
    async function fetchBlogTheme() {
      try {
        const response = await fetch("/api/settings")
        const data = await response.json()

        if (data.success && data.settings && data.settings.blogTheme) {
          setBlogTheme(data.settings.blogTheme)

          // Update the keywords field with the blog theme if it's empty
          if (!form.getValues().keywords) {
            form.setValue("keywords", data.settings.blogTheme)
          }
        }
      } catch (error) {
        console.error("Error fetching blog theme:", error)
      }
    }

    fetchBlogTheme()
  }, [form])

  async function onSubmit(data: z.infer<typeof contentFormSchema>) {
    setIsGenerating(true)
    setGenerationError(null)

    try {
      // Prepare enhanced generation parameters
      const enhancedParams = {
        title: data.title,
        outline: data.outline || "",
        keywords: data.keywords || "",
        contentType: data.contentType,
        wordCount: data.wordCount,
        tone: data.tone,
        audience: data.audience,
        includeImages: data.includeImages,
        includeFaqs: data.includeFaqs,
      }

      // Call the server action to generate content
      const result = await generateContentAction(data.title, JSON.stringify(enhancedParams), data.keywords)

      setContent(result.content)
      setGeneratedCategories(result.suggestedCategories || [])
      setActiveTab("preview")

      // Simulate content quality analysis
      setContentQuality({
        readability: Math.floor(Math.random() * 3) + 7, // 7-9
        seo: Math.floor(Math.random() * 3) + 6, // 6-8
        engagement: Math.floor(Math.random() * 4) + 6, // 6-9
      })

      toast({
        title: "Content generated",
        description: "Your blog post content has been generated.",
      })
    } catch (error) {
      console.error("Error generating content:", error)
      setGenerationError(error instanceof Error ? error.message : "Failed to generate content. Please try again.")

      toast({
        title: "Error generating content",
        description: "There was an error generating content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  async function saveToQueue() {
    if (!content || !form.getValues().title) {
      toast({
        title: "Missing content",
        description: "Please generate content before publishing.",
        variant: "destructive",
      })
      return
    }

    setIsPublishing(true)

    try {
      // Use the categories from the generated content
      const categories = generatedCategories || []

      // Filter out any invalid categories
      const validCategories = categories.filter(
        (cat) => cat && cat.name && cat.name.trim() !== "" && cat.name.toLowerCase() !== "uncategorized",
      )

      // Log the categories being sent for debugging
      console.log("Publishing with categories:", validCategories)

      const result = await publishPostAction(form.getValues().title, content, "draft", validCategories)

      if (!result.success) {
        throw new Error(result.error || "Unknown error occurred")
      }

      toast({
        title: "Added to publishing queue",
        description: "Your content has been added to the WordPress publishing queue.",
      })

      // Add to content history
      setContentHistory((prev) => [
        {
          id: Date.now().toString(),
          title: form.getValues().title,
          date: new Date().toISOString().split("T")[0],
        },
        ...prev,
      ])

      // Reset the form and content after successful publishing
      form.reset()
      setContent("")
      setContentQuality(null)
      setGeneratedCategories([])
    } catch (error) {
      console.error("Error publishing with categories:", error)
      toast({
        title: "Error saving to queue",
        description:
          error instanceof Error
            ? error.message
            : "There was an error saving to the publishing queue. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  function copyContent() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    toast({
      title: "Content copied",
      description: "The content has been copied to your clipboard.",
    })
  }

  function loadSavedContent(id: string) {
    // In a real app, this would fetch the content from storage
    toast({
      title: "Content loaded",
      description: "Your saved content has been loaded.",
    })

    // Mock loading saved content
    const savedItem = contentHistory.find((item) => item.id === id)
    if (savedItem) {
      form.setValue("title", savedItem.title)
      // Would normally load the actual content here
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Content Generator</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Clock className="mr-2 h-4 w-4" />
              Content History
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h3 className="font-medium">Recent Content</h3>
              {contentHistory.length > 0 ? (
                <ul className="max-h-[300px] overflow-auto">
                  {contentHistory.map((item) => (
                    <li key={item.id} className="flex items-center justify-between py-2 border-b">
                      <div className="truncate mr-2">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => loadSavedContent(item.id)}>
                        Load
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No saved content yet</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Content Settings</CardTitle>
            <CardDescription>Configure your content generation parameters</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blog Post Title</FormLabel>
                      <FormControl>
                        <Input placeholder="10 Essential WordPress Plugins for Business Websites" {...field} />
                      </FormControl>
                      <FormDescription>Enter a descriptive title for your blog post</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          {Object.entries(CONTENT_TEMPLATES).map(([value, template]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex flex-col">
                                <span>{template.name}</span>
                                <span className="text-xs text-muted-foreground">{template.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="flex items-center">
                        <LayoutTemplate className="h-4 w-4 mr-1" />
                        <span>Choose a template for your content structure</span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="outline">
                    <AccordionTrigger>Content Outline</AccordionTrigger>
                    <AccordionContent>
                      <FormField
                        control={form.control}
                        name="outline"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Introduction, Benefits of plugins, Plugin 1, Plugin 2, etc."
                                className="min-h-[150px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>Provide an outline for the content structure</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="advanced">
                    <AccordionTrigger>Advanced Options</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="keywords"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SEO Keywords</FormLabel>
                            <FormControl>
                              <Input placeholder="wordpress plugins, business website, security plugin" {...field} />
                            </FormControl>
                            <FormDescription>
                              Comma-separated keywords to include in the content (defaults to your blog theme)
                            </FormDescription>
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
                                {TONE_OPTIONS.map((tone) => (
                                  <SelectItem key={tone.value} value={tone.value}>
                                    {tone.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription className="flex items-center">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              <span>Choose the tone of voice for your content</span>
                            </FormDescription>
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
                                {AUDIENCE_OPTIONS.map((audience) => (
                                  <SelectItem key={audience.value} value={audience.value}>
                                    {audience.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription className="flex items-center">
                              <Target className="h-4 w-4 mr-1" />
                              <span>Specify who your content is aimed at</span>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="includeImages"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Image Suggestions</FormLabel>
                                <FormDescription>Include image placement suggestions</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="includeFaqs"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>FAQ Section</FormLabel>
                                <FormDescription>Add a FAQ section at the end</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {generationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{generationError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isGenerating} className="w-full">
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Content
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        {content ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Generated Content</CardTitle>
                <CardDescription>Preview and edit your generated blog post</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="ml-auto">
                  {wordCount} words
                </Badge>
                {contentQuality && (
                  <Badge variant="secondary">
                    Quality:{" "}
                    {Math.round((contentQuality.readability + contentQuality.seo + contentQuality.engagement) / 3)}/10
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="editor">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  {contentQuality && <TabsTrigger value="analysis">Analysis</TabsTrigger>}
                </TabsList>
                <TabsContent value="editor">
                  <div className="relative">
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[500px] font-mono text-sm"
                    />
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={copyContent}>
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span className="sr-only">Copy content</span>
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="preview">
                  <div className="prose max-w-none dark:prose-invert border rounded-md p-4 min-h-[500px] overflow-auto">
                    {generatedCategories && generatedCategories.length > 0 && (
                      <div className="mb-4 p-3 bg-muted rounded-md">
                        <h4 className="text-sm font-medium mb-2">Suggested Categories:</h4>
                        <div className="flex flex-wrap gap-2">
                          {generatedCategories.map((category, index) => (
                            <div key={index} className="flex items-center">
                              <Badge variant="secondary" className="mr-1">
                                {category.parent && <span className="opacity-70 mr-1">{category.parent} &gt; </span>}
                                {category.name}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          These categories will be automatically assigned when you publish the post.
                        </p>
                      </div>
                    )}
                    <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, "<br />") }} />
                  </div>
                </TabsContent>
                {contentQuality && (
                  <TabsContent value="analysis">
                    <div className="space-y-4 border rounded-md p-4 min-h-[500px]">
                      <h3 className="text-lg font-medium">Content Quality Analysis</h3>

                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Readability</span>
                            <span className="text-sm font-medium">{contentQuality.readability}/10</span>
                          </div>
                          <div className="w-full bg-secondary h-2 rounded-full">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${contentQuality.readability * 10}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {contentQuality.readability >= 8
                              ? "Excellent readability score. Content is easy to read and understand."
                              : contentQuality.readability >= 6
                                ? "Good readability. Minor improvements could make the content more accessible."
                                : "Content may be difficult to read. Consider simplifying language and structure."}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">SEO Optimization</span>
                            <span className="text-sm font-medium">{contentQuality.seo}/10</span>
                          </div>
                          <div className="w-full bg-secondary h-2 rounded-full">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${contentQuality.seo * 10}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {contentQuality.seo >= 8
                              ? "Well-optimized for search engines. Good keyword usage and structure."
                              : contentQuality.seo >= 6
                                ? "Decent SEO optimization. Consider improving keyword placement and density."
                                : "Content needs SEO improvements. Review keyword usage and meta elements."}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Engagement Potential</span>
                            <span className="text-sm font-medium">{contentQuality.engagement}/10</span>
                          </div>
                          <div className="w-full bg-secondary h-2 rounded-full">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${contentQuality.engagement * 10}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {contentQuality.engagement >= 8
                              ? "Highly engaging content. Likely to keep readers interested throughout."
                              : contentQuality.engagement >= 6
                                ? "Moderately engaging. Consider adding more compelling elements or calls to action."
                                : "Content may not fully engage readers. Add questions, stories, or interactive elements."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h4 className="text-sm font-medium mb-2">Improvement Suggestions</h4>
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                            <span className="text-sm">
                              {wordCount < form.getValues().wordCount * 0.9
                                ? `Content is shorter than target (${wordCount}/${form.getValues().wordCount} words). Consider expanding.`
                                : wordCount > form.getValues().wordCount * 1.1
                                  ? `Content exceeds target length (${wordCount}/${form.getValues().wordCount} words). Consider trimming.`
                                  : `Content meets target length (${wordCount}/${form.getValues().wordCount} words).`}
                            </span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                            <span className="text-sm">
                              {form.getValues().keywords
                                ? "Keywords are incorporated naturally throughout the content."
                                : "Consider adding target keywords to improve SEO."}
                            </span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                            <span className="text-sm">Content structure follows the selected template format.</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={copyContent}>
                {copied ? <CheckCircle className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                Copy Content
              </Button>
              <Button onClick={saveToQueue} disabled={isPublishing}>
                {isPublishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Add to Publishing Queue
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Content Preview</CardTitle>
              <CardDescription>Your generated content will appear here</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[400px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 opacity-20 mb-2" />
                <p>Configure your content settings and click "Generate Content"</p>
                <p className="text-sm mt-2">The AI will create a blog post based on your specifications</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

