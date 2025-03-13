"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Wand, RefreshCw, AlertCircle, CheckCircle, Copy, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { improveContentAction } from "@/lib/actions"

const contentFormSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }).optional(),
  title: z.string().min(1, { message: "Title is required" }),
  content: z.string().min(1, { message: "Content is required" }),
  improvementType: z.string().min(1, { message: "Improvement type is required" }),
})

type ImprovementResult = {
  originalContent: string
  improvedContent: string
  improvements: Array<{
    type: string
    description: string
  }>
  readabilityScore: {
    before: number
    after: number
  }
  seoScore: {
    before: number
    after: number
  }
}

export function ContentImprover() {
  const [result, setResult] = useState<ImprovementResult | null>(null)
  const [isImproving, setIsImproving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("original")

  const form = useForm<z.infer<typeof contentFormSchema>>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      url: "",
      title: "",
      content: "",
      improvementType: "readability",
    },
  })

  async function onSubmit(data: z.infer<typeof contentFormSchema>) {
    setIsImproving(true)
    setError(null)

    try {
      const improvementResult = await improveContentAction(data)
      setResult(improvementResult)
      setActiveTab("improved")

      toast({
        title: "Content improved",
        description: `Your content has been improved for ${data.improvementType}.`,
      })
    } catch (error) {
      console.error("Error improving content:", error)

      // Show a more specific error message
      if (error instanceof Error) {
        setError(error.message)
        toast({
          title: "Error improving content",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setError("There was an error improving your content. Please try again.")
        toast({
          title: "Error improving content",
          description: "There was an error improving your content. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsImproving(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied to clipboard",
          description: "The content has been copied to your clipboard.",
        })
      },
      (err) => {
        console.error("Could not copy text: ", err)
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard. Please try again.",
          variant: "destructive",
        })
      },
    )
  }

  function downloadContent() {
    if (!result) return

    try {
      const dataStr = `# ${form.getValues().title}\n\n${result.improvedContent}`
      const dataUri = "data:text/markdown;charset=utf-8," + encodeURIComponent(dataStr)

      const exportFileDefaultName = `improved-content-${new Date().toISOString().split("T")[0]}.md`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()

      toast({
        title: "Content downloaded",
        description: "Your improved content has been downloaded as a Markdown file.",
      })
    } catch (error) {
      console.error("Error downloading content:", error)
      toast({
        title: "Download failed",
        description: "Could not download content. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Content Improver</CardTitle>
          <CardDescription>Use AI to improve your existing blog content</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WordPress Post URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourblog.com/post-slug" {...field} />
                    </FormControl>
                    <FormDescription>Enter a URL to fetch an existing post</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Title</FormLabel>
                    <FormControl>
                      <Input placeholder="10 Essential WordPress Plugins for Business Websites" {...field} />
                    </FormControl>
                    <FormDescription>Enter the title of your blog post</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your blog post content here..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Enter the content you want to improve</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="improvementType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Improvement Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select improvement type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="readability">Readability</SelectItem>
                        <SelectItem value="seo">SEO Optimization</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="clarity">Clarity & Conciseness</SelectItem>
                        <SelectItem value="grammar">Grammar & Style</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>What aspect of your content do you want to improve?</FormDescription>
                    <FormMessage />
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
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isImproving}>
                {isImproving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Improving...
                  </>
                ) : (
                  <>
                    <Wand className="mr-2 h-4 w-4" />
                    Improve Content
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Improvement Results</CardTitle>
          <CardDescription>Compare original and improved content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!result ? (
            <div className="text-center py-8 text-muted-foreground">
              No improvement results yet. Submit content to improve.
            </div>
          ) : (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="original">Original</TabsTrigger>
                  <TabsTrigger value="improved">Improved</TabsTrigger>
                </TabsList>
                <TabsContent value="original">
                  <div className="relative mt-4">
                    <Textarea value={result.originalContent} readOnly className="min-h-[300px] font-mono text-sm" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(result.originalContent)}
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy original content</span>
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="improved">
                  <div className="relative mt-4">
                    <Textarea value={result.improvedContent} readOnly className="min-h-[300px] font-mono text-sm" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(result.improvedContent)}
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy improved content</span>
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-4 mt-6">
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium">Improvements Made</h3>
                  <Button variant="outline" size="sm" onClick={downloadContent}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Improved Content
                  </Button>
                </div>
                <div className="space-y-2">
                  {result.improvements.map((improvement, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{improvement.type}</p>
                        <p className="text-sm text-muted-foreground">{improvement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Readability Score</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Before:</span>
                    <span className="text-sm font-medium">{result.readabilityScore.before}/10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">After:</span>
                    <span className="text-sm font-medium">{result.readabilityScore.after}/10</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">SEO Score</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Before:</span>
                    <span className="text-sm font-medium">{result.seoScore.before}/10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">After:</span>
                    <span className="text-sm font-medium">{result.seoScore.after}/10</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

