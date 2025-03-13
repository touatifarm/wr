"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Sparkles, RefreshCw, ArrowRight, Plus, Bookmark, AlertCircle, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateTrendingTopicsAction } from "@/lib/actions"
import { Skeleton } from "@/components/ui/skeleton"

const suggestionFormSchema = z.object({
  niche: z.string().min(1, { message: "Please select a niche" }),
  count: z.string().min(1, { message: "Please select the number of suggestions" }),
})

type ContentSuggestion = {
  id: string
  title: string
  description: string
  keywords: string[]
  difficulty: "easy" | "medium" | "hard"
  estimatedTime: string
  category: string
}

// Trending topics data
const trendingTopics = [
  { name: "WordPress", trend: "+15%" },
  { name: "Headless CMS", trend: "+32%" },
  { name: "AI Content", trend: "+65%" },
  { name: "Page Speed", trend: "+8%" },
  { name: "Security", trend: "+22%" },
]

// Function to get trending topics based on niche
function getTrendingTopicsForNiche(niche: string) {
  const allTrendingTopics = {
    // WordPress Ecosystem
    wordpress: [
      { name: "Block Editor", trend: "+28%" },
      { name: "Headless WP", trend: "+42%" },
      { name: "Performance", trend: "+15%" },
      { name: "Security", trend: "+22%" },
      { name: "FSE", trend: "+35%" },
    ],
    plugins: [
      { name: "Security Plugins", trend: "+31%" },
      { name: "SEO Plugins", trend: "+24%" },
      { name: "Performance Plugins", trend: "+38%" },
      { name: "E-commerce Plugins", trend: "+19%" },
      { name: "Form Plugins", trend: "+15%" },
    ],
    themes: [
      { name: "Block Themes", trend: "+47%" },
      { name: "Minimal Themes", trend: "+23%" },
      { name: "Responsive Design", trend: "+18%" },
      { name: "Theme Frameworks", trend: "+29%" },
      { name: "Custom Themes", trend: "+15%" },
    ],
    gutenberg: [
      { name: "Custom Blocks", trend: "+52%" },
      { name: "Block Patterns", trend: "+38%" },
      { name: "FSE Templates", trend: "+45%" },
      { name: "Block Extensions", trend: "+27%" },
      { name: "Block Libraries", trend: "+33%" },
    ],
    woocommerce: [
      { name: "Payment Gateways", trend: "+24%" },
      { name: "Product Display", trend: "+19%" },
      { name: "Checkout Optimization", trend: "+37%" },
      { name: "Subscriptions", trend: "+42%" },
      { name: "WooCommerce Blocks", trend: "+31%" },
    ],
    headlesswp: [
      { name: "Next.js + WP", trend: "+58%" },
      { name: "WP REST API", trend: "+32%" },
      { name: "GraphQL", trend: "+45%" },
      { name: "Jamstack", trend: "+39%" },
      { name: "Headless CMS", trend: "+41%" },
    ],

    // Web Development
    webdesign: [
      { name: "Minimalism", trend: "+27%" },
      { name: "Dark Mode", trend: "+35%" },
      { name: "Micro-interactions", trend: "+42%" },
      { name: "Glassmorphism", trend: "+19%" },
      { name: "3D Elements", trend: "+31%" },
    ],
    webdev: [
      { name: "Web Components", trend: "+37%" },
      { name: "Progressive Web Apps", trend: "+43%" },
      { name: "Serverless", trend: "+39%" },
      { name: "WebAssembly", trend: "+28%" },
      { name: "API-first", trend: "+32%" },
    ],
    performance: [
      { name: "Core Web Vitals", trend: "+48%" },
      { name: "Lazy Loading", trend: "+23%" },
      { name: "Image Optimization", trend: "+35%" },
      { name: "Caching Strategies", trend: "+29%" },
      { name: "CDN Usage", trend: "+21%" },
    ],
    security: [
      { name: "Two-factor Auth", trend: "+37%" },
      { name: "Content Security", trend: "+29%" },
      { name: "HTTPS Everywhere", trend: "+18%" },
      { name: "Security Headers", trend: "+42%" },
      { name: "Vulnerability Scanning", trend: "+33%" },
    ],

    // Digital Marketing
    marketing: [
      { name: "Content AI", trend: "+65%" },
      { name: "Video Marketing", trend: "+38%" },
      { name: "Personalization", trend: "+27%" },
      { name: "Marketing Automation", trend: "+19%" },
      { name: "Voice Search", trend: "+31%" },
    ],
    seo: [
      { name: "Core Web Vitals", trend: "+45%" },
      { name: "E-E-A-T", trend: "+33%" },
      { name: "AI Content", trend: "+58%" },
      { name: "Local SEO", trend: "+17%" },
      { name: "Mobile SEO", trend: "+22%" },
    ],
    contentmarketing: [
      { name: "Long-form Content", trend: "+32%" },
      { name: "Interactive Content", trend: "+47%" },
      { name: "Content Clusters", trend: "+38%" },
      { name: "User-generated Content", trend: "+25%" },
      { name: "Content Repurposing", trend: "+29%" },
    ],
    emailmarketing: [
      { name: "Personalization", trend: "+41%" },
      { name: "Automation Sequences", trend: "+37%" },
      { name: "Interactive Emails", trend: "+28%" },
      { name: "Mobile Optimization", trend: "+19%" },
      { name: "A/B Testing", trend: "+23%" },
    ],
    socialmedia: [
      { name: "Short-form Video", trend: "+62%" },
      { name: "Social Commerce", trend: "+48%" },
      { name: "Community Building", trend: "+35%" },
      { name: "Social Listening", trend: "+27%" },
      { name: "Influencer Marketing", trend: "+39%" },
    ],

    // Business
    ecommerce: [
      { name: "Headless Commerce", trend: "+39%" },
      { name: "AR Shopping", trend: "+47%" },
      { name: "Voice Commerce", trend: "+25%" },
      { name: "Subscription Models", trend: "+31%" },
      { name: "Mobile Checkout", trend: "+18%" },
    ],
    smallbusiness: [
      { name: "Digital Transformation", trend: "+37%" },
      { name: "Local SEO", trend: "+29%" },
      { name: "Social Commerce", trend: "+42%" },
      { name: "Remote Work Tools", trend: "+35%" },
      { name: "Customer Experience", trend: "+31%" },
    ],
    affiliate: [
      { name: "Niche Websites", trend: "+33%" },
      { name: "Product Reviews", trend: "+28%" },
      { name: "Comparison Content", trend: "+37%" },
      { name: "Affiliate Disclosure", trend: "+15%" },
      { name: "High-ticket Affiliate", trend: "+42%" },
    ],
    monetization: [
      { name: "Membership Sites", trend: "+45%" },
      { name: "Digital Products", trend: "+38%" },
      { name: "Sponsored Content", trend: "+27%" },
      { name: "Ad Optimization", trend: "+19%" },
      { name: "Paywalls", trend: "+32%" },
    ],

    // Content Creation
    blogging: [
      { name: "Niche Blogging", trend: "+31%" },
      { name: "Long-form Content", trend: "+27%" },
      { name: "Personal Branding", trend: "+42%" },
      { name: "Content Clusters", trend: "+35%" },
      { name: "Multimedia Content", trend: "+39%" },
    ],
    contentcreation: [
      { name: "AI Writing Tools", trend: "+57%" },
      { name: "Video Content", trend: "+43%" },
      { name: "Interactive Content", trend: "+35%" },
      { name: "Data Visualization", trend: "+29%" },
      { name: "Storytelling", trend: "+32%" },
    ],
    podcasting: [
      { name: "Niche Podcasts", trend: "+38%" },
      { name: "Video Podcasts", trend: "+45%" },
      { name: "Podcast SEO", trend: "+27%" },
      { name: "Podcast Monetization", trend: "+33%" },
      { name: "Interview Format", trend: "+21%" },
    ],
    aiwriting: [
      { name: "AI Content Tools", trend: "+67%" },
      { name: "Prompt Engineering", trend: "+53%" },
      { name: "Content Editing", trend: "+38%" },
      { name: "AI Ethics", trend: "+29%" },
      { name: "Human-AI Collaboration", trend: "+42%" },
    ],

    // Health & Wellness
    health: [
      { name: "Gut Health", trend: "+47%" },
      { name: "Immune Support", trend: "+38%" },
      { name: "Sleep Optimization", trend: "+42%" },
      { name: "Holistic Health", trend: "+29%" },
      { name: "Preventive Care", trend: "+33%" },
    ],
    nutrition: [
      { name: "Plant-based Diet", trend: "+52%" },
      { name: "Intermittent Fasting", trend: "+37%" },
      { name: "Gut Microbiome", trend: "+45%" },
      { name: "Anti-inflammatory", trend: "+31%" },
      { name: "Superfoods", trend: "+28%" },
    ],
    fitness: [
      { name: "Home Workouts", trend: "+39%" },
      { name: "HIIT Training", trend: "+33%" },
      { name: "Strength Training", trend: "+41%" },
      { name: "Functional Fitness", trend: "+37%" },
      { name: "Recovery Methods", trend: "+29%" },
    ],
    mentalhealth: [
      { name: "Mindfulness", trend: "+48%" },
      { name: "Digital Detox", trend: "+35%" },
      { name: "Stress Management", trend: "+42%" },
      { name: "Anxiety Relief", trend: "+39%" },
      { name: "Mental Wellness", trend: "+31%" },
    ],
    yoga: [
      { name: "Yoga for Beginners", trend: "+37%" },
      { name: "Yin Yoga", trend: "+29%" },
      { name: "Yoga for Stress", trend: "+43%" },
      { name: "Online Yoga Classes", trend: "+51%" },
      { name: "Yoga Props", trend: "+25%" },
    ],

    // Lifestyle
    lifestyle: [
      { name: "Minimalism", trend: "+38%" },
      { name: "Work-Life Balance", trend: "+45%" },
      { name: "Digital Nomad", trend: "+52%" },
      { name: "Sustainable Living", trend: "+41%" },
      { name: "Morning Routines", trend: "+33%" },
    ],
    fashion: [
      { name: "Sustainable Fashion", trend: "+47%" },
      { name: "Capsule Wardrobe", trend: "+35%" },
      { name: "Vintage Style", trend: "+29%" },
      { name: "Athleisure", trend: "+38%" },
      { name: "Minimalist Fashion", trend: "+31%" },
    ],
    travel: [
      { name: "Staycations", trend: "+43%" },
      { name: "Sustainable Travel", trend: "+39%" },
      { name: "Digital Nomad", trend: "+51%" },
      { name: "Off-Grid Travel", trend: "+33%" },
      { name: "Solo Travel", trend: "+37%" },
    ],
    food: [
      { name: "Plant-Based Recipes", trend: "+45%" },
      { name: "Air Fryer Recipes", trend: "+52%" },
      { name: "Meal Prep", trend: "+38%" },
      { name: "Global Cuisines", trend: "+31%" },
      { name: "Food Sustainability", trend: "+29%" },
    ],
    homedesign: [
      { name: "Biophilic Design", trend: "+41%" },
      { name: "Multifunctional Spaces", trend: "+47%" },
      { name: "Sustainable Decor", trend: "+39%" },
      { name: "Home Office Design", trend: "+53%" },
      { name: "Minimalist Interiors", trend: "+35%" },
    ],

    // Sports
    sports: [
      { name: "Home Fitness", trend: "+45%" },
      { name: "Sports Analytics", trend: "+37%" },
      { name: "Recovery Science", trend: "+33%" },
      { name: "Mental Training", trend: "+41%" },
      { name: "Sports Nutrition", trend: "+39%" },
    ],
    football: [
      { name: "Fantasy Football", trend: "+48%" },
      { name: "Football Analytics", trend: "+35%" },
      { name: "Training Techniques", trend: "+29%" },
      { name: "Player Development", trend: "+37%" },
      { name: "Football Tactics", trend: "+31%" },
    ],
    basketball: [
      { name: "Basketball Analytics", trend: "+42%" },
      { name: "Shooting Techniques", trend: "+35%" },
      { name: "Home Training", trend: "+39%" },
      { name: "Basketball Fitness", trend: "+31%" },
      { name: "Player Profiles", trend: "+27%" },
    ],
    running: [
      { name: "Trail Running", trend: "+43%" },
      { name: "Running Form", trend: "+37%" },
      { name: "Marathon Training", trend: "+31%" },
      { name: "Running Gear", trend: "+29%" },
      { name: "Recovery Methods", trend: "+35%" },
    ],
    outdoors: [
      { name: "Hiking Trails", trend: "+47%" },
      { name: "Camping Gear", trend: "+39%" },
      { name: "Outdoor Photography", trend: "+33%" },
      { name: "Adventure Travel", trend: "+41%" },
      { name: "Wilderness Skills", trend: "+35%" },
    ],

    // Education
    education: [
      { name: "Remote Learning", trend: "+53%" },
      { name: "Educational Tech", trend: "+47%" },
      { name: "Self-Education", trend: "+41%" },
      { name: "Learning Methods", trend: "+35%" },
      { name: "Educational Apps", trend: "+39%" },
    ],
    onlinecourses: [
      { name: "Course Creation", trend: "+49%" },
      { name: "Learning Platforms", trend: "+43%" },
      { name: "Certification Courses", trend: "+37%" },
      { name: "Interactive Learning", trend: "+41%" },
      { name: "Course Marketing", trend: "+35%" },
    ],
    languages: [
      { name: "Language Apps", trend: "+45%" },
      { name: "Immersion Learning", trend: "+39%" },
      { name: "Language Exchange", trend: "+33%" },
      { name: "Polyglot Methods", trend: "+37%" },
      { name: "Cultural Learning", trend: "+31%" },
    ],

    // Finance
    finance: [
      { name: "Financial Freedom", trend: "+47%" },
      { name: "Passive Income", trend: "+51%" },
      { name: "Debt Reduction", trend: "+43%" },
      { name: "Financial Literacy", trend: "+39%" },
      { name: "Money Management", trend: "+35%" },
    ],
    investing: [
      { name: "Index Investing", trend: "+43%" },
      { name: "Dividend Stocks", trend: "+39%" },
      { name: "Real Estate", trend: "+45%" },
      { name: "Retirement Planning", trend: "+33%" },
      { name: "Sustainable Investing", trend: "+37%" },
    ],
    crypto: [
      { name: "DeFi", trend: "+53%" },
      { name: "NFTs", trend: "+47%" },
      { name: "Blockchain Tech", trend: "+41%" },
      { name: "Crypto Security", trend: "+37%" },
      { name: "Crypto Regulation", trend: "+33%" },
    ],

    // Entertainment
    entertainment: [
      { name: "Streaming Content", trend: "+45%" },
      { name: "Home Entertainment", trend: "+39%" },
      { name: "Virtual Events", trend: "+43%" },
      { name: "Content Curation", trend: "+35%" },
      { name: "Entertainment Tech", trend: "+37%" },
    ],
    movies: [
      { name: "Streaming Releases", trend: "+49%" },
      { name: "Home Cinema", trend: "+43%" },
      { name: "Film Analysis", trend: "+37%" },
      { name: "Indie Films", trend: "+33%" },
      { name: "Documentary", trend: "+39%" },
    ],
    gaming: [
      { name: "Cloud Gaming", trend: "+51%" },
      { name: "Gaming Setups", trend: "+45%" },
      { name: "Indie Games", trend: "+39%" },
      { name: "Game Development", trend: "+43%" },
      { name: "Esports", trend: "+47%" },
    ],

    // Technology
    technology: [
      { name: "Smart Home", trend: "+47%" },
      { name: "AI Applications", trend: "+53%" },
      { name: "Privacy Tech", trend: "+41%" },
      { name: "Remote Work Tech", trend: "+49%" },
      { name: "Sustainable Tech", trend: "+37%" },
    ],
    ai: [
      { name: "AI Ethics", trend: "+45%" },
      { name: "Generative AI", trend: "+57%" },
      { name: "AI Tools", trend: "+51%" },
      { name: "Machine Learning", trend: "+43%" },
      { name: "AI Applications", trend: "+47%" },
    ],
    cybersecurity: [
      { name: "Home Security", trend: "+43%" },
      { name: "Password Managers", trend: "+37%" },
      { name: "Privacy Tools", trend: "+41%" },
      { name: "Security Awareness", trend: "+39%" },
      { name: "Data Protection", trend: "+45%" },
    ],
    default: trendingTopics,
  }

  return allTrendingTopics[niche as keyof typeof allTrendingTopics] || allTrendingTopics.default
}

export function ContentSuggestions() {
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedIdeas, setSavedIdeas] = useState<ContentSuggestion[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  // Add a state for the blog theme
  const [blogTheme, setBlogTheme] = useState<string>("wordpress")

  const form = useForm<z.infer<typeof suggestionFormSchema>>({
    resolver: zodResolver(suggestionFormSchema),
    defaultValues: {
      niche: "wordpress",
      count: "5",
    },
  })

  // Add this line after the form initialization
  const selectedNiche = form.watch("niche")

  // Add this effect to fetch the blog theme from settings
  useEffect(() => {
    async function fetchBlogTheme() {
      try {
        const response = await fetch("/api/settings")
        const data = await response.json()

        if (data.success && data.settings && data.settings.blogTheme) {
          setBlogTheme(data.settings.blogTheme)
          // Update the form with the blog theme
          form.setValue("niche", data.settings.blogTheme)
        }
      } catch (error) {
        console.error("Error fetching blog theme:", error)
      }
    }

    fetchBlogTheme()
  }, [form])

  // Load saved ideas from localStorage on component mount
  useEffect(() => {
    try {
      const savedIdeasJson = localStorage.getItem("savedContentIdeas")
      if (savedIdeasJson) {
        const parsedIdeas = JSON.parse(savedIdeasJson)
        if (Array.isArray(parsedIdeas)) {
          setSavedIdeas(parsedIdeas)
        }
      }
    } catch (error) {
      console.error("Error loading saved ideas:", error)
    }
    setIsInitialized(true)
  }, [])

  async function onSubmit(data: z.infer<typeof suggestionFormSchema>) {
    setIsGenerating(true)
    setError(null)

    try {
      // Call the server action to generate trending topics
      const topics = await generateTrendingTopicsAction(data.niche, Number.parseInt(data.count))

      setSuggestions(topics)

      toast({
        title: "Content suggestions generated",
        description: `Generated ${topics.length} content ideas based on trending topics.`,
      })
    } catch (error) {
      console.error("Error generating suggestions:", error)
      setError("Failed to generate content suggestions. Please try again.")

      toast({
        title: "Error generating suggestions",
        description: "Could not generate content suggestions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  function saveIdea(suggestion: ContentSuggestion) {
    // Check if already saved
    if (savedIdeas.some((idea) => idea.id === suggestion.id)) {
      toast({
        title: "Already saved",
        description: "This content idea is already in your saved ideas.",
      })
      return
    }

    const updatedSavedIdeas = [...savedIdeas, suggestion]
    setSavedIdeas(updatedSavedIdeas)

    // Save to localStorage
    localStorage.setItem("savedContentIdeas", JSON.stringify(updatedSavedIdeas))

    toast({
      title: "Idea saved",
      description: "Content idea has been saved to your list.",
    })
  }

  function removeSavedIdea(id: string) {
    const updatedSavedIdeas = savedIdeas.filter((idea) => idea.id !== id)
    setSavedIdeas(updatedSavedIdeas)

    // Update localStorage
    localStorage.setItem("savedContentIdeas", JSON.stringify(updatedSavedIdeas))

    toast({
      title: "Idea removed",
      description: "Content idea has been removed from your saved list.",
    })
  }

  function createPost(idea: ContentSuggestion) {
    // Store the idea in localStorage so the content generator can access it
    localStorage.setItem("currentContentIdea", JSON.stringify(idea))

    // Redirect to the content generator tab
    const tabLinks = document.querySelectorAll('[role="tab"]')
    const contentGeneratorTab = Array.from(tabLinks).find((tab) => tab.textContent?.includes("Content Generator")) as
      | HTMLElement
      | undefined

    if (contentGeneratorTab) {
      contentGeneratorTab.click()

      toast({
        title: "Creating post",
        description: `Creating a new post based on "${idea.title}"`,
      })
    } else {
      // Fallback if we can't find the tab
      toast({
        title: "Content idea ready",
        description: `Switch to the Content Generator tab to create "${idea.title}"`,
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Content Suggestions</h2>
          <p className="text-muted-foreground">Get AI-powered content ideas based on trending topics</p>
        </div>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate Ideas</TabsTrigger>
          <TabsTrigger value="saved">Saved Ideas ({savedIdeas.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Generate Content Ideas</CardTitle>
                <CardDescription>Get AI-powered content suggestions based on trending topics</CardDescription>
              </CardHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="niche"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content Niche</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a niche" />
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
                          {/* Update the FormDescription in the niche FormField */}
                          <FormDescription>
                            Choose the niche for your content ideas (defaults to your blog theme)
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
                          <FormLabel>Number of Suggestions</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select count" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="3">3 suggestions</SelectItem>
                              <SelectItem value="5">5 suggestions</SelectItem>
                              <SelectItem value="10">10 suggestions</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>How many content ideas to generate</FormDescription>
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
                    <Button type="submit" disabled={isGenerating}>
                      {isGenerating ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Ideas
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>

            <Card className="md:row-span-2">
              <CardHeader>
                <CardTitle>Trending Topics</CardTitle>
                <CardDescription>Popular topics in your selected niche</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getTrendingTopicsForNiche(form.watch("niche")).map((topic, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`
                          ${index === 0 ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : ""}
                          ${index === 1 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                          ${index === 2 ? "bg-purple-100 text-purple-800 hover:bg-purple-100" : ""}
                          ${index === 3 ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : ""}
                          ${index === 4 ? "bg-red-100 text-red-800 hover:bg-red-100" : ""}
                        `}
                      >
                        {topic.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{topic.trend} this week</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Content Suggestions</CardTitle>
              <CardDescription>AI-generated content ideas based on trending topics</CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="space-y-4">
                  {Array.from({ length: Number(form.getValues().count) || 5 }).map((_, index) => (
                    <div key={index} className="border rounded-md p-4 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-9 w-24" />
                          <Skeleton className="h-9 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>Generate content suggestions to see ideas here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion) => (
                    <div key={suggestion.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{suggestion.title}</h3>
                        <Badge variant="outline">{suggestion.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{suggestion.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {suggestion.keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <Badge
                              variant={
                                suggestion.difficulty === "easy"
                                  ? "outline"
                                  : suggestion.difficulty === "medium"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {suggestion.difficulty}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">Est. time: {suggestion.estimatedTime}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => saveIdea(suggestion)}>
                            <Bookmark className="mr-2 h-4 w-4" />
                            Save Idea
                          </Button>
                          <Button size="sm" onClick={() => createPost(suggestion)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Post
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle>Saved Content Ideas</CardTitle>
              <CardDescription>Your collection of saved content ideas</CardDescription>
            </CardHeader>
            <CardContent>
              {!isInitialized ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="border rounded-md p-4 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : savedIdeas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bookmark className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No saved content ideas yet</p>
                  <Button variant="outline" className="mt-4" onClick={() => form.handleSubmit(onSubmit)()}>
                    Generate Some Ideas
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedIdeas.map((idea) => (
                    <div key={idea.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{idea.title}</h3>
                        <Button variant="ghost" size="sm" onClick={() => removeSavedIdea(idea.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{idea.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {idea.keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-4">
                        <Button size="sm" onClick={() => createPost(idea)}>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Create Content
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

