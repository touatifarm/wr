"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save, RefreshCw } from "lucide-react"
import { InfoIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const wordpressFormSchema = z.object({
  siteUrl: z.string().url({ message: "Please enter a valid URL" }),
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password or application password is required" }),
})

const geminiFormSchema = z.object({
  apiKey: z.string().min(1, { message: "API key is required" }),
  modelName: z.string().optional(),
})

// Add a new schema for blog theme in the agentFormSchema
const agentFormSchema = z.object({
  postFrequency: z.string().min(1, { message: "Post frequency is required" }),
  categories: z.string(),
  contentGuidelines: z.string(),
  blogTheme: z.string().min(1, { message: "Blog theme is required" }),
})

type GeminiModel = {
  name: string
  displayName: string
  description?: string
}

// Define a mapping of blog themes to suggested categories
const themeToCategoriesMap: Record<string, string> = {
  // WordPress Ecosystem
  wordpress: "wordpress, cms, blogging, web publishing",
  plugins: "wordpress plugins, plugin development, site functionality, extensions",
  themes: "wordpress themes, theme development, design, customization",
  gutenberg: "gutenberg, block editor, content blocks, page builder",
  wpdev: "wordpress development, php, hooks, custom post types",
  woocommerce: "woocommerce, ecommerce, online store, digital products",
  multisite: "wordpress multisite, network, multiple sites, site management",
  headlesswp: "headless wordpress, rest api, jamstack, decoupled cms",

  // Web Development
  webdesign: "web design, ui design, ux design, visual design",
  webdev: "web development, coding, programming, web technologies",
  frontend: "frontend development, html, css, javascript",
  javascript: "javascript, js frameworks, react, vue",
  php: "php, backend development, server-side programming",
  jamstack: "jamstack, static sites, serverless, headless cms",
  accessibility: "web accessibility, a11y, inclusive design, wcag",
  performance: "website performance, speed optimization, core web vitals",
  hosting: "web hosting, servers, cloud hosting, managed hosting",
  security: "website security, hardening, firewalls, malware protection",

  // Digital Marketing
  seo: "seo, search engine optimization, rankings, organic traffic",
  contentmarketing: "content marketing, content strategy, audience engagement",
  emailmarketing: "email marketing, newsletters, email automation, list building",
  socialmedia: "social media marketing, social platforms, engagement, community",
  analytics: "web analytics, data analysis, metrics, reporting",
  ppc: "ppc, paid advertising, google ads, facebook ads",
  conversionrate: "conversion rate optimization, a/b testing, user experience",
  localmarketing: "local marketing, local seo, google business profile, local listings",

  // Business
  ecommerce: "ecommerce, online store, product listings, shopping cart",
  smallbusiness: "small business, entrepreneurship, local business, business growth",
  startups: "startups, venture capital, scaling, innovation",
  saas: "saas, software as a service, subscription business, cloud software",
  freelancing: "freelancing, self-employment, client work, service business",
  affiliate: "affiliate marketing, passive income, commission, product promotion",
  monetization: "blog monetization, revenue streams, advertising, sponsored content",
  productivity: "productivity tools, efficiency, workflow, time management",

  // Content Creation
  blogging: "blogging, blog writing, content creation, blog strategy",
  contentcreation: "content creation, content strategy, audience engagement",
  podcasting: "podcasting, audio content, interviews, podcast production",
  videocontent: "video content, youtube, video production, video marketing",
  storytelling: "digital storytelling, brand narrative, content structure",
  contenttools: "content creation tools, writing software, content management",
  aiwriting: "ai writing, ai content, generative ai, content automation",
  contentplanning: "content planning, editorial calendar, content schedule",

  // Health & Wellness
  health: "health, wellness, wellbeing, healthy lifestyle",
  nutrition: "nutrition, healthy eating, diet, food science",
  fitness: "fitness, exercise, workouts, physical activity",
  mentalhealth: "mental health, psychology, emotional wellbeing, mindfulness",
  yoga: "yoga, yoga practice, poses, meditation",
  meditation: "meditation, mindfulness, stress reduction, mental clarity",
  weightloss: "weight loss, healthy weight, diet plans, fitness",
  healthyrecipes: "healthy recipes, nutritious food, meal planning, cooking",

  // Lifestyle
  lifestyle: "lifestyle, daily living, life improvement, modern living",
  fashion: "fashion, style, clothing, accessories",
  beauty: "beauty, skincare, makeup, personal care",
  travel: "travel, destinations, adventures, tourism",
  food: "food, cooking, recipes, culinary arts",
  homedesign: "home design, interior design, decoration, home improvement",
  diy: "diy, crafts, handmade, projects",
  parenting: "parenting, child development, family, childcare",
  relationships: "relationships, dating, marriage, interpersonal connections",
  selfimprovement: "self improvement, personal development, growth, habits",

  // Sports
  sports: "sports, athletics, competition, physical activity",
  football: "football, nfl, college football, teams",
  basketball: "basketball, nba, college basketball, teams",
  soccer: "soccer, football, world cup, leagues",
  baseball: "baseball, mlb, teams, statistics",
  tennis: "tennis, tournaments, players, equipment",
  golf: "golf, tournaments, players, courses",
  running: "running, marathons, training, gear",
  cycling: "cycling, biking, races, equipment",
  outdoors: "outdoor activities, hiking, camping, adventure sports",

  // Education
  education: "education, learning, teaching, academic",
  onlinecourses: "online courses, e-learning, digital education, course creation",
  languages: "language learning, linguistics, foreign languages, bilingualism",
  studentlife: "student life, college, university, academic success",
  teaching: "teaching resources, education methods, classroom, instruction",
  elearning: "e-learning, online education, digital learning, educational technology",

  // Finance
  finance: "personal finance, money management, financial planning",
  investing: "investing, stocks, mutual funds, investment strategy",
  budgeting: "budgeting, saving money, financial planning, frugal living",
  retirement: "retirement planning, retirement savings, pension, 401k",
  crypto: "cryptocurrency, bitcoin, blockchain, digital assets",
  taxes: "tax planning, tax preparation, tax deductions, tax strategy",

  // Entertainment
  entertainment: "entertainment, media, leisure activities, amusement",
  movies: "movies, film, cinema, film reviews",
  tvshows: "tv shows, television, streaming series, episodes",
  music: "music, artists, albums, genres",
  books: "books, reading, literature, book reviews",
  gaming: "gaming, video games, esports, game reviews",
  streaming: "streaming services, netflix, disney+, content platforms",

  // Technology
  technology: "technology, tech news, innovation, digital trends",
  gadgets: "gadgets, devices, consumer electronics, tech reviews",
  ai: "artificial intelligence, machine learning, neural networks, ai applications",
  cybersecurity: "cybersecurity, online security, privacy, data protection",
  mobileapps: "mobile apps, app development, ios, android",
  programming: "programming, coding, software development, computer science",
  datascience: "data science, big data, analytics, data visualization",
}

export function ConfigurationForm() {
  const [activeTab, setActiveTab] = useState("wordpress")
  const [models, setModels] = useState<GeminiModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const [userModifiedCategories, setUserModifiedCategories] = useState(false)

  const wordpressForm = useForm<z.infer<typeof wordpressFormSchema>>({
    resolver: zodResolver(wordpressFormSchema),
    defaultValues: {
      siteUrl: "",
      username: "",
      password: "",
    },
  })

  const geminiForm = useForm<z.infer<typeof geminiFormSchema>>({
    resolver: zodResolver(geminiFormSchema),
    defaultValues: {
      apiKey: "",
      modelName: "",
    },
  })

  // In the agentForm defaultValues, add the blogTheme field
  const agentForm = useForm<z.infer<typeof agentFormSchema>>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      postFrequency: "weekly",
      categories: "technology, marketing, business",
      contentGuidelines: "Create informative, SEO-friendly content with 1500-2000 words per post.",
      blogTheme: "wordpress",
    },
  })

  // Watch for changes to the blogTheme field
  const selectedBlogTheme = agentForm.watch("blogTheme")

  // Update categories when blog theme changes
  useEffect(() => {
    if (selectedBlogTheme && themeToCategoriesMap[selectedBlogTheme] && !userModifiedCategories) {
      agentForm.setValue("categories", themeToCategoriesMap[selectedBlogTheme])
    }
  }, [selectedBlogTheme, agentForm, userModifiedCategories])

  // Track when user manually changes the categories
  const handleCategoriesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserModifiedCategories(true)
  }

  useEffect(() => {
    // Fetch environment variables and settings from the server
    const fetchEnvVars = async () => {
      try {
        // Fetch environment variables
        const configResponse = await fetch("/api/config")
        const configData = await configResponse.json()

        if (configData.wordpress) {
          wordpressForm.setValue("siteUrl", configData.wordpress.siteUrl || "")
          wordpressForm.setValue("username", configData.wordpress.username || "")
          wordpressForm.setValue("password", configData.wordpress.password ? "••••••••" : "")
        }

        if (configData.gemini) {
          geminiForm.setValue("apiKey", configData.gemini.apiKey ? "••••••••" : "")
        }

        // Fetch settings
        const settingsResponse = await fetch("/api/settings")
        const settingsData = await settingsResponse.json()

        if (settingsData.success && settingsData.settings) {
          const settings = settingsData.settings

          // Set model name if available
          if (settings.modelName) {
            geminiForm.setValue("modelName", settings.modelName)
          }

          // Set agent settings if available
          if (settings.postFrequency) {
            agentForm.setValue("postFrequency", settings.postFrequency)
          }

          if (settings.categories) {
            agentForm.setValue("categories", settings.categories)
            // Don't auto-update categories if they were already set
            setUserModifiedCategories(true)
          }

          if (settings.contentGuidelines) {
            agentForm.setValue("contentGuidelines", settings.contentGuidelines)
          }

          // In the useEffect where settings are loaded, add the blogTheme field
          if (settings.blogTheme) {
            agentForm.setValue("blogTheme", settings.blogTheme)

            // If categories aren't set but blog theme is, set categories based on theme
            if (!settings.categories && settings.blogTheme && themeToCategoriesMap[settings.blogTheme]) {
              agentForm.setValue("categories", themeToCategoriesMap[settings.blogTheme])
            }
          }

          // If we have an API key, fetch available models
          if (configData.gemini.apiKey) {
            fetchModels()
          }
        }
      } catch (error) {
        console.error("Error fetching configuration:", error)
      }
    }

    fetchEnvVars()
  }, [wordpressForm, geminiForm, agentForm])

  const fetchModels = async () => {
    setIsLoadingModels(true)
    setModelError(null)

    try {
      const response = await fetch("/api/models")
      const data = await response.json()

      if (data.success && data.models) {
        setModels(data.models)

        // If we have models but no model is selected, select the first one
        if (data.models.length > 0 && !geminiForm.getValues().modelName) {
          geminiForm.setValue("modelName", data.models[0].name)
        }
      } else {
        setModelError(data.error || "Failed to load models")
      }
    } catch (error) {
      console.error("Error fetching models:", error)
      setModelError("Failed to load models. Please check your API key and try again.")
    } finally {
      setIsLoadingModels(false)
    }
  }

  async function onWordpressSubmit(data: z.infer<typeof wordpressFormSchema>) {
    try {
      // Use the API endpoint instead of the server action
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wordpress: {
            siteUrl: data.siteUrl,
            username: data.username,
            password: data.password,
          },
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to save settings")
      }

      toast({
        title: "WordPress settings saved",
        description: "Your WordPress connection settings have been updated.",
      })
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  async function onGeminiSubmit(data: z.infer<typeof geminiFormSchema>) {
    try {
      // Use the API endpoint instead of the server action
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gemini: {
            apiKey: data.apiKey !== "••••••••" ? data.apiKey : undefined,
            modelName: data.modelName,
          },
          // Also save at the top level for easier access
          modelName: data.modelName,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to save settings")
      }

      toast({
        title: "Gemini API settings saved",
        description: "Your Gemini API settings have been updated.",
      })

      // Refresh models if API key was updated
      if (data.apiKey && data.apiKey !== "••••••••") {
        fetchModels()
      }
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  // In the onAgentSubmit function, add the blogTheme field to the data being saved
  async function onAgentSubmit(data: z.infer<typeof agentFormSchema>) {
    try {
      // Use the API endpoint instead of the server action
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent: {
            postFrequency: data.postFrequency,
            categories: data.categories,
            contentGuidelines: data.contentGuidelines,
            blogTheme: data.blogTheme,
          },
          // Also save at the top level for easier access
          postFrequency: data.postFrequency,
          categories: data.categories,
          contentGuidelines: data.contentGuidelines,
          blogTheme: data.blogTheme,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to save settings")
      }

      toast({
        title: "Agent settings saved",
        description: "Your agent configuration has been updated.",
      })

      // Reset the userModifiedCategories flag after saving
      setUserModifiedCategories(false)
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  // Function to reset categories to theme default
  const resetCategoriesToThemeDefault = () => {
    if (selectedBlogTheme && themeToCategoriesMap[selectedBlogTheme]) {
      agentForm.setValue("categories", themeToCategoriesMap[selectedBlogTheme])
      setUserModifiedCategories(false)

      toast({
        title: "Categories reset",
        description: "Categories have been reset to the default for the selected theme.",
      })
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="wordpress">WordPress</TabsTrigger>
        <TabsTrigger value="gemini">Gemini API</TabsTrigger>
        <TabsTrigger value="agent">Agent Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="wordpress">
        <Card>
          <CardHeader>
            <CardTitle>WordPress Configuration</CardTitle>
            <CardDescription>Connect your WordPress site using the REST API</CardDescription>
          </CardHeader>
          <Form {...wordpressForm}>
            <form onSubmit={wordpressForm.handleSubmit(onWordpressSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={wordpressForm.control}
                  name="siteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WordPress Site URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourblog.com" {...field} />
                      </FormControl>
                      <FormDescription>The URL of your WordPress site</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={wordpressForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="admin" {...field} />
                      </FormControl>
                      <FormDescription>Your WordPress username</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={wordpressForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormDescription>Use an application password for better security</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Environment variables detected. These settings are configured through your Vercel project.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Save WordPress Settings
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </TabsContent>

      <TabsContent value="gemini">
        <Card>
          <CardHeader>
            <CardTitle>Gemini API Configuration</CardTitle>
            <CardDescription>Configure your Gemini API settings for content generation</CardDescription>
          </CardHeader>
          <Form {...geminiForm}>
            <form onSubmit={geminiForm.handleSubmit(onGeminiSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={geminiForm.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gemini API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormDescription>Your Gemini API key from Google AI Studio</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2">
                  <FormField
                    control={geminiForm.control}
                    name="modelName"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Gemini Model</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoadingModels || models.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {models.map((model) => (
                              <SelectItem key={model.name} value={model.name}>
                                {model.displayName || model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="flex items-center gap-1">
                          <InfoIcon className="h-4 w-4 text-blue-500" />
                          Gemini 1.0 models are deprecated. Use Gemini 1.5 models for best results.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-8"
                    onClick={fetchModels}
                    disabled={isLoadingModels}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingModels ? "animate-spin" : ""}`} />
                    {isLoadingModels ? "Loading..." : "Refresh Models"}
                  </Button>
                </div>

                {modelError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{modelError}</AlertDescription>
                  </Alert>
                )}

                <div className="mt-4 p-4 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Environment variables detected. These settings are configured through your Vercel project.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Save Gemini Settings
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </TabsContent>

      <TabsContent value="agent">
        <Card>
          <CardHeader>
            <CardTitle>Agent Configuration</CardTitle>
            <CardDescription>Configure how your autonomous blog agent operates</CardDescription>
          </CardHeader>
          <Form {...agentForm}>
            <form onSubmit={agentForm.handleSubmit(onAgentSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={agentForm.control}
                  name="postFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post Frequency</FormLabel>
                      <FormControl>
                        <Input placeholder="weekly" {...field} />
                      </FormControl>
                      <FormDescription>How often to publish (e.g., daily, weekly, 3 times per week)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Add the blogTheme field to the form in the Agent Settings tab */}
                <FormField
                  control={agentForm.control}
                  name="blogTheme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blog Theme</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select blog theme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* WordPress Ecosystem */}
                          <SelectItem value="wordpress">WordPress Core</SelectItem>
                          <SelectItem value="plugins">WordPress Plugins</SelectItem>
                          <SelectItem value="themes">WordPress Themes</SelectItem>
                          <SelectItem value="gutenberg">Gutenberg & Block Editor</SelectItem>
                          <SelectItem value="wpdev">WordPress Development</SelectItem>
                          <SelectItem value="woocommerce">WooCommerce</SelectItem>
                          <SelectItem value="multisite">WordPress Multisite</SelectItem>
                          <SelectItem value="headlesswp">Headless WordPress</SelectItem>

                          {/* Web Development */}
                          <SelectItem value="webdesign">Web Design</SelectItem>
                          <SelectItem value="webdev">Web Development</SelectItem>
                          <SelectItem value="frontend">Frontend Development</SelectItem>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="php">PHP Development</SelectItem>
                          <SelectItem value="jamstack">Jamstack</SelectItem>
                          <SelectItem value="accessibility">Web Accessibility</SelectItem>
                          <SelectItem value="performance">Website Performance</SelectItem>
                          <SelectItem value="hosting">Web Hosting</SelectItem>
                          <SelectItem value="security">Website Security</SelectItem>

                          {/* Digital Marketing */}
                          <SelectItem value="seo">SEO</SelectItem>
                          <SelectItem value="contentmarketing">Content Marketing</SelectItem>
                          <SelectItem value="emailmarketing">Email Marketing</SelectItem>
                          <SelectItem value="socialmedia">Social Media Marketing</SelectItem>
                          <SelectItem value="analytics">Web Analytics</SelectItem>
                          <SelectItem value="ppc">PPC & Paid Advertising</SelectItem>
                          <SelectItem value="conversionrate">Conversion Rate Optimization</SelectItem>
                          <SelectItem value="localmarketing">Local Marketing</SelectItem>

                          {/* Business */}
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="smallbusiness">Small Business</SelectItem>
                          <SelectItem value="startups">Startups</SelectItem>
                          <SelectItem value="saas">SaaS Business</SelectItem>
                          <SelectItem value="freelancing">Freelancing</SelectItem>
                          <SelectItem value="affiliate">Affiliate Marketing</SelectItem>
                          <SelectItem value="monetization">Blog Monetization</SelectItem>
                          <SelectItem value="productivity">Productivity Tools</SelectItem>

                          {/* Content Creation */}
                          <SelectItem value="blogging">Blogging</SelectItem>
                          <SelectItem value="contentcreation">Content Creation</SelectItem>
                          <SelectItem value="podcasting">Podcasting</SelectItem>
                          <SelectItem value="videocontent">Video Content</SelectItem>
                          <SelectItem value="storytelling">Digital Storytelling</SelectItem>
                          <SelectItem value="contenttools">Content Creation Tools</SelectItem>
                          <SelectItem value="aiwriting">AI-Assisted Writing</SelectItem>
                          <SelectItem value="contentplanning">Content Planning</SelectItem>

                          {/* Health & Wellness */}
                          <SelectItem value="health">Health & Wellness</SelectItem>
                          <SelectItem value="nutrition">Nutrition</SelectItem>
                          <SelectItem value="fitness">Fitness</SelectItem>
                          <SelectItem value="mentalhealth">Mental Health</SelectItem>
                          <SelectItem value="yoga">Yoga</SelectItem>
                          <SelectItem value="meditation">Meditation</SelectItem>
                          <SelectItem value="weightloss">Weight Loss</SelectItem>
                          <SelectItem value="healthyrecipes">Healthy Recipes</SelectItem>

                          {/* Lifestyle */}
                          <SelectItem value="lifestyle">Lifestyle</SelectItem>
                          <SelectItem value="fashion">Fashion</SelectItem>
                          <SelectItem value="beauty">Beauty</SelectItem>
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="food">Food & Cooking</SelectItem>
                          <SelectItem value="homedesign">Home Design</SelectItem>
                          <SelectItem value="diy">DIY & Crafts</SelectItem>
                          <SelectItem value="parenting">Parenting</SelectItem>
                          <SelectItem value="relationships">Relationships</SelectItem>
                          <SelectItem value="selfimprovement">Self Improvement</SelectItem>

                          {/* Sports */}
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="football">Football</SelectItem>
                          <SelectItem value="basketball">Basketball</SelectItem>
                          <SelectItem value="soccer">Soccer</SelectItem>
                          <SelectItem value="baseball">Baseball</SelectItem>
                          <SelectItem value="tennis">Tennis</SelectItem>
                          <SelectItem value="golf">Golf</SelectItem>
                          <SelectItem value="running">Running</SelectItem>
                          <SelectItem value="cycling">Cycling</SelectItem>
                          <SelectItem value="outdoors">Outdoor Activities</SelectItem>

                          {/* Education */}
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="onlinecourses">Online Courses</SelectItem>
                          <SelectItem value="languages">Language Learning</SelectItem>
                          <SelectItem value="studentlife">Student Life</SelectItem>
                          <SelectItem value="teaching">Teaching Resources</SelectItem>
                          <SelectItem value="elearning">E-Learning</SelectItem>

                          {/* Finance */}
                          <SelectItem value="finance">Personal Finance</SelectItem>
                          <SelectItem value="investing">Investing</SelectItem>
                          <SelectItem value="budgeting">Budgeting</SelectItem>
                          <SelectItem value="retirement">Retirement Planning</SelectItem>
                          <SelectItem value="crypto">Cryptocurrency</SelectItem>
                          <SelectItem value="taxes">Tax Planning</SelectItem>

                          {/* Entertainment */}
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="movies">Movies</SelectItem>
                          <SelectItem value="tvshows">TV Shows</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="books">Books & Reading</SelectItem>
                          <SelectItem value="gaming">Gaming</SelectItem>
                          <SelectItem value="streaming">Streaming Services</SelectItem>

                          {/* Technology */}
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="gadgets">Gadgets & Devices</SelectItem>
                          <SelectItem value="ai">Artificial Intelligence</SelectItem>
                          <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                          <SelectItem value="mobileapps">Mobile Apps</SelectItem>
                          <SelectItem value="programming">Programming</SelectItem>
                          <SelectItem value="datascience">Data Science</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>The primary theme/focus of your blog content</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={agentForm.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Content Categories</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={resetCategoriesToThemeDefault}
                          className="h-8 px-2 text-xs"
                        >
                          Reset to Theme Default
                        </Button>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="technology, marketing, business"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            handleCategoriesChange(e)
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        {userModifiedCategories
                          ? "Custom categories (manually edited)"
                          : "Categories based on selected blog theme"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={agentForm.control}
                  name="contentGuidelines"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Guidelines</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Create informative, SEO-friendly content..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Guidelines for the AI to follow when creating content</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Save Agent Settings
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

