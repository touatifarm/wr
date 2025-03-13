"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Search, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { analyzeSeoAction } from "@/lib/actions"

const seoFormSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }).optional(),
  title: z.string().min(1, { message: "Title is required" }),
  content: z.string().min(1, { message: "Content is required" }),
  keywords: z.string().min(1, { message: "Keywords are required" }),
})

type SeoAnalysisResult = {
  score: number
  recommendations: Array<{
    type: "success" | "warning" | "error"
    message: string
  }>
  keywordDensity: Record<string, number>
  readabilityScore: number
  metaTagsScore: number
  contentLengthScore: number
}

export function SeoAnalyzer() {
  const [result, setResult] = useState<SeoAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof seoFormSchema>>({
    resolver: zodResolver(seoFormSchema),
    defaultValues: {
      url: "",
      title: "",
      content: "",
      keywords: "",
    },
  })

  async function onSubmit(data: z.infer<typeof seoFormSchema>) {
    setIsAnalyzing(true)
    setError(null)

    try {
      const analysisResult = await analyzeSeoAction(data)
      setResult(analysisResult)

      toast({
        title: "SEO analysis complete",
        description: `Your content scored ${analysisResult.score}/100.`,
      })
    } catch (error) {
      console.error("Error analyzing SEO:", error)
      const errorMessage =
        error instanceof Error ? error.message : "There was an error analyzing your content. Please try again."
      setError(errorMessage)

      toast({
        title: "Error analyzing SEO",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>SEO Analyzer</CardTitle>
          <CardDescription>Analyze and optimize your content for search engines</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourblog.com/post-slug" {...field} />
                    </FormControl>
                    <FormDescription>Enter a URL to analyze an existing post</FormDescription>
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
                    <FormDescription>Enter the content of your blog post</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Keywords</FormLabel>
                    <FormControl>
                      <Input placeholder="wordpress plugins, business website, security plugin" {...field} />
                    </FormControl>
                    <FormDescription>Comma-separated keywords to target</FormDescription>
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
              <Button type="submit" disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Analyze SEO
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO Analysis Results</CardTitle>
          <CardDescription>Recommendations to improve your content's SEO</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!result ? (
            <div className="text-center py-8 text-muted-foreground">
              No analysis results yet. Submit content to analyze.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Overall SEO Score</h3>
                  <span className="text-sm font-bold">{result.score}/100</span>
                </div>
                <Progress value={result.score} className="h-2" />
              </div>

              <div className="space-y-4 mt-4">
                <h3 className="text-sm font-medium">Recommendations</h3>
                <div className="space-y-2">
                  {result.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start">
                      {recommendation.type === "success" ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      ) : recommendation.type === "warning" ? (
                        <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                      )}
                      <p className="text-sm">{recommendation.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <h3 className="text-sm font-medium">Keyword Density</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(result.keywordDensity).map(([keyword, density]) => (
                    <div key={keyword} className="flex justify-between items-center p-2 bg-muted rounded-md">
                      <span className="text-xs font-medium">{keyword}</span>
                      <span className="text-xs">{density.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <h3 className="text-sm font-medium">Content Metrics</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                    <span className="text-xs text-muted-foreground">Readability</span>
                    <span className="text-sm font-bold">{result.readabilityScore}/10</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                    <span className="text-xs text-muted-foreground">Meta Tags</span>
                    <span className="text-sm font-bold">{result.metaTagsScore}/10</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                    <span className="text-xs text-muted-foreground">Content Length</span>
                    <span className="text-sm font-bold">{result.contentLengthScore}/10</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          {result && (
            <Button variant="outline" onClick={() => setResult(null)}>
              Clear Results
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

