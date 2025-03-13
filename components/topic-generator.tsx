"use client"

import { useState, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Search, Plus, Trash2, AlertCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { generateTopicsAction } from "@/lib/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define categories and subcategories
const CATEGORIES = {
  "WordPress & CMS": [
    "WordPress Themes",
    "WordPress Plugins",
    "WordPress Security",
    "WordPress Performance",
    "WordPress SEO",
    "WordPress Development",
    "WordPress Hosting",
    "WordPress Tutorials",
    "Headless WordPress",
    "WordPress Multisite",
    "WooCommerce",
    "Other CMS Platforms",
  ],
  "Web Development": [
    "Frontend Development",
    "Backend Development",
    "Full Stack Development",
    "JavaScript Frameworks",
    "CSS Frameworks",
    "Web Design",
    "Responsive Design",
    "Web Performance",
    "Web Accessibility",
    "Web Security",
    "API Development",
    "Static Site Generators",
  ],
  "Digital Marketing": [
    "SEO",
    "Content Marketing",
    "Social Media Marketing",
    "Email Marketing",
    "Affiliate Marketing",
    "PPC Advertising",
    "Marketing Automation",
    "Influencer Marketing",
    "Video Marketing",
    "Analytics & Reporting",
    "Conversion Optimization",
  ],
  "Health & Wellness": [
    "Nutrition",
    "Fitness",
    "Mental Health",
    "Yoga",
    "Meditation",
    "Weight Loss",
    "Healthy Recipes",
    "Alternative Medicine",
    "Sleep Health",
    "Wellness Routines",
    "Stress Management",
  ],
  Lifestyle: [
    "Fashion",
    "Beauty",
    "Travel",
    "Food & Cooking",
    "Home Design",
    "DIY & Crafts",
    "Parenting",
    "Relationships",
    "Self Improvement",
    "Minimalism",
    "Sustainable Living",
  ],
  Sports: [
    "Football",
    "Basketball",
    "Soccer",
    "Baseball",
    "Tennis",
    "Golf",
    "Running",
    "Cycling",
    "Outdoor Activities",
    "Sports Training",
    "Sports Nutrition",
    "Sports Equipment",
  ],
  Education: [
    "Online Courses",
    "Language Learning",
    "Student Life",
    "Teaching Resources",
    "E-Learning",
    "Educational Technology",
    "Homeschooling",
    "Higher Education",
    "Professional Development",
    "Study Tips",
  ],
  Finance: [
    "Personal Finance",
    "Investing",
    "Budgeting",
    "Retirement Planning",
    "Cryptocurrency",
    "Tax Planning",
    "Financial Independence",
    "Debt Management",
    "Real Estate Investing",
    "Stock Market",
  ],
  Entertainment: [
    "Movies",
    "TV Shows",
    "Music",
    "Books & Reading",
    "Gaming",
    "Streaming Services",
    "Podcasts",
    "Celebrity News",
    "Entertainment Reviews",
    "Hobbies",
  ],
  Technology: [
    "Gadgets & Devices",
    "Artificial Intelligence",
    "Cybersecurity",
    "Mobile Apps",
    "Programming",
    "Data Science",
    "Cloud Computing",
    "IoT",
    "Tech Reviews",
    "Future Technology",
  ],
  Business: [
    "Entrepreneurship",
    "Small Business",
    "Startups",
    "E-commerce",
    "Remote Work",
    "Business Strategy",
    "Leadership",
    "Productivity",
    "Business Tools",
    "Freelancing",
  ],
}

const topicFormSchema = z.object({
  keyword: z.string().min(1, { message: "Keyword is required" }),
  count: z.string().min(1, { message: "Number of topics is required" }),
  category: z.string().optional(),
  subcategory: z.string().optional(),
})

export function TopicGenerator() {
  const [topics, setTopics] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appendResults, setAppendResults] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [subcategories, setSubcategories] = useState<string[]>([])

  const form = useForm<z.infer<typeof topicFormSchema>>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      keyword: "",
      count: "5",
      category: "",
      subcategory: "",
    },
  })

  // Update subcategories when category changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setSubcategories(CATEGORIES[category as keyof typeof CATEGORIES] || [])
    form.setValue("category", category)
    form.setValue("subcategory", "")

    // Update the keyword field with the category
    form.setValue("keyword", category)
  }

  // Update keyword when subcategory changes
  const handleSubcategoryChange = (subcategory: string) => {
    form.setValue("subcategory", subcategory)

    // Update the keyword field with the subcategory
    if (selectedCategory) {
      form.setValue("keyword", `${selectedCategory} ${subcategory}`)
    } else {
      form.setValue("keyword", subcategory)
    }
  }

  async function onSubmit(data: z.infer<typeof topicFormSchema>) {
    setIsGenerating(true)
    setError(null)

    try {
      // Call the server action to generate real topics
      const newTopics = await generateTopicsAction(data.keyword, Number.parseInt(data.count))

      if (!newTopics || newTopics.length === 0) {
        throw new Error("No topics were generated. Please try again with a different keyword.")
      }

      // Either append to existing topics or replace them based on user preference
      if (appendResults) {
        setTopics([...topics, ...newTopics])
      } else {
        setTopics(newTopics)
      }

      toast({
        title: "Topics generated",
        description: `Generated ${newTopics.length} new topic ideas.`,
      })
    } catch (error) {
      console.error("Error in topic generation:", error)
      const errorMessage =
        error instanceof Error ? error.message : "There was an error generating topics. Please try again."
      setError(errorMessage)

      toast({
        title: "Error generating topics",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  function removeTopic(index: number) {
    const newTopics = [...topics]
    newTopics.splice(index, 1)
    setTopics(newTopics)
  }

  function clearAllTopics() {
    setTopics([])
    toast({
      title: "Topics cleared",
      description: "All topic ideas have been cleared.",
    })
  }

  // Update the useTopicForContent function to properly navigate to the content generator
  const useTopicForContent = useCallback((topic: string) => {
    // Store the selected topic in localStorage
    localStorage.setItem(
      "currentContentIdea",
      JSON.stringify({
        title: topic,
        keywords: topic.split(" ").filter((word) => word.length > 3),
        description: `Content based on the topic: ${topic}`,
      }),
    )

    // Redirect to the content generator tab
    const tabLinks = document.querySelectorAll('[role="tab"]')
    const contentGeneratorTab = Array.from(tabLinks).find((tab) => tab.textContent?.includes("Content Generator")) as
      | HTMLElement
      | undefined

    if (contentGeneratorTab) {
      contentGeneratorTab.click()

      toast({
        title: "Topic selected",
        description: `Creating content for "${topic}"`,
      })
    } else {
      // Fallback if we can't find the tab
      toast({
        title: "Topic selected",
        description: `Switch to the Content Generator tab to create content for "${topic}"`,
      })
    }
  }, [])

  const handleTopicSelection = (topic: string) => {
    useTopicForContent(topic)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Generate Topic Ideas</CardTitle>
          <CardDescription>Use AI to generate blog topic ideas based on keywords</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={handleCategoryChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.keys(CATEGORIES).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Choose a main category</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subcategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory</FormLabel>
                      <Select onValueChange={handleSubcategoryChange} value={field.value} disabled={!selectedCategory}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={selectedCategory ? "Select a subcategory" : "Select a category first"}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subcategories.map((subcategory) => (
                            <SelectItem key={subcategory} value={subcategory}>
                              {subcategory}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Choose a specific subcategory</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="keyword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keyword or Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="WordPress security" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter a keyword or topic to generate ideas around (auto-filled from category selection)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Ideas</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="10" {...field} />
                    </FormControl>
                    <FormDescription>How many topic ideas to generate (1-10)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2">
                <Switch id="append-mode" checked={appendResults} onCheckedChange={setAppendResults} />
                <label
                  htmlFor="append-mode"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Append new topics to existing ones
                </label>
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
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Generate Topics
                  </>
                )}
              </Button>
              {topics.length > 0 && (
                <Button type="button" variant="outline" onClick={clearAllTopics}>
                  Clear All
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Topic Ideas</CardTitle>
          <CardDescription>Your generated topic ideas for blog posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topics.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No topics generated yet. Use the form to generate some ideas.
              </div>
            ) : (
              <div className="space-y-2">
                {topics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between group">
                    <div className="flex-1">{topic}</div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          handleTopicSelection(topic)
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">Add to content queue</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeTopic(index)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove topic</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground">{topics.length} topic ideas available</div>
        </CardFooter>
      </Card>
    </div>
  )
}

