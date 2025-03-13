// Gemini API client for content generation
export class GeminiClient {
  private apiKey: string
  private modelName: string

  constructor(apiKey: string, modelName?: string) {
    this.apiKey = apiKey
    // Update default model to a newer version
    this.modelName = modelName || "models/gemini-1.5-flash-latest"
  }

  static async fromEnvironment() {
    const { GEMINI_API_KEY } = process.env

    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key environment variable is not properly configured")
    }

    // Create a client with the API key
    const client = new GeminiClient(GEMINI_API_KEY)

    try {
      // Try to get the model from settings
      const { getSettings } = await import("./settings")
      const settings = await getSettings()

      if (settings.modelName) {
        client.setModel(settings.modelName)
      }
    } catch (error) {
      // If we can't get the model from settings, just use the default
      console.warn("Could not get model from settings, using default model")
    }

    return client
  }

  // List available models
  async listModels() {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${this.apiKey}`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Gemini API error when listing models:", errorData)
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.models || []
    } catch (error) {
      console.error("Error listing Gemini models:", error)
      throw error
    }
  }

  // Set the model to use
  setModel(modelName: string) {
    this.modelName = modelName
    console.log(`Model set to: ${modelName}`)
  }

  // Get a suitable model for text generation
  async getTextGenerationModel() {
    // If we have a model name from settings, use it
    if (this.modelName) {
      console.log(`Using model from settings: ${this.modelName}`)
      return this.modelName
    }

    try {
      // Get available models
      const models = await this.listModels()

      // Filter for models that support text generation
      const textModels = models.filter((model) => model.supportedGenerationMethods?.includes("generateContent"))

      if (textModels.length === 0) {
        throw new Error("No suitable Gemini text generation models found for your API key")
      }

      // Prioritize models in this order:
      // 1. gemini-1.5-flash (good balance of speed and quality)
      // 2. gemini-1.5-pro (high quality but slower)
      // 3. Any other available model

      // Look for preferred models
      const flash = textModels.find((model) => model.name.includes("gemini-1.5-flash"))
      if (flash) {
        this.setModel(flash.name)
        return flash.name
      }

      const pro = textModels.find((model) => model.name.includes("gemini-1.5-pro"))
      if (pro) {
        this.setModel(pro.name)
        return pro.name
      }

      // Fall back to first available model
      this.setModel(textModels[0].name)
      return textModels[0].name
    } catch (error) {
      console.error("Error finding suitable model:", error)
      // Fall back to default model
      return "models/gemini-1.5-flash-latest"
    }
  }

  // Fix the generateBlogTopics method to ensure it returns valid topics
  async generateBlogTopics(keyword: string, count = 5): Promise<string[]> {
    try {
      // Get a suitable model for text generation
      const modelToUse = await this.getTextGenerationModel()
      console.log(`Using Gemini model for topics: ${modelToUse}`)

      // Add a timestamp to ensure different results each time
      const timestamp = new Date().toISOString()
      const seed = Math.floor(Date.now() / 1000)

      // Create a more specific prompt with clear formatting instructions
      const prompt = `Generate ${count} unique, specific, and engaging blog post topic ideas related to "${keyword}".
      
      Requirements:
      - Each topic should be a complete, ready-to-use blog post title
      - Topics should be 40-60 characters long
      - Include numbers, how-tos, or questions where appropriate
      - Make topics specific and actionable (not generic)
      - Optimize for search intent and SEO
      - Format as a simple array of strings (just the titles)
      
      Example format:
      [
        "10 Essential WordPress Security Plugins for 2023",
        "How to Speed Up Your WordPress Site in 5 Steps",
        "The Ultimate Guide to WordPress SEO in 2023",
        "7 WordPress Mistakes That Are Hurting Your Traffic",
        "Why Your WordPress Site Needs a CDN (And How to Set One Up)"
      ]
      
      Return ONLY the array of topic strings, with no additional text.
      Current time: ${timestamp} (use this as a seed for randomness)`

      // Use the discovered model name in the API call
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/${modelToUse}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
            seed: seed,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Gemini API error:", errorData)
        throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      console.log("Raw Gemini response:", data)

      // Check if the response has the expected structure
      if (
        !data.candidates ||
        !data.candidates.length ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts.length
      ) {
        console.error("Unexpected Gemini API response structure:", data)
        throw new Error("Unexpected response structure from Gemini API")
      }

      const text = data.candidates[0].content.parts[0].text
      console.log("Raw text response:", text)

      // Try to parse the response as JSON first
      try {
        // Look for JSON array in the response
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const jsonArray = JSON.parse(jsonMatch[0])
          if (Array.isArray(jsonArray) && jsonArray.length > 0) {
            return jsonArray.slice(0, count)
          }
        }
      } catch (e) {
        console.log("Could not parse as JSON, falling back to text parsing")
      }

      // If JSON parsing fails, parse the response as text
      const lines = text.split("\n").filter((line) => line.trim().length > 0)

      // Process the lines to extract topics
      const topics = lines
        .map((line) => {
          // Remove numbering, quotes, and other formatting
          return line.replace(/^(\d+\.|-|•|\*|"|'|`)/g, "").trim()
        })
        .filter((topic) => topic.length > 0 && !topic.startsWith("[") && !topic.startsWith("]"))
        .slice(0, count)

      // If we couldn't extract any topics, throw an error
      if (topics.length === 0) {
        console.error("Could not extract topics from Gemini response:", text)
        // Fallback to some generic topics based on the keyword
        return [
          `10 Best Practices for ${keyword}`,
          `How to Get Started with ${keyword}`,
          `The Ultimate Guide to ${keyword}`,
          `5 Common Mistakes to Avoid with ${keyword}`,
          `Why ${keyword} Matters for Your Business`,
        ].slice(0, count)
      }

      return topics
    } catch (error) {
      console.error("Error generating blog topics with Gemini:", error)
      throw error
    }
  }

  async generateBlogContent(
    title: string,
    outline?: string,
    keywords?: string,
    options?: {
      contentType?: string
      wordCount?: number
      tone?: string
      audience?: string
      includeImages?: boolean
      includeFaqs?: boolean
    },
  ): Promise<string> {
    try {
      // Get a suitable model for text generation
      const modelToUse = await this.getTextGenerationModel()
      console.log(`Using Gemini model for content: ${modelToUse}`)

      // Add a timestamp to ensure different results each time
      const timestamp = new Date().toISOString()

      // Default options
      const {
        contentType = "blog-post",
        wordCount = 1000,
        tone = "professional",
        audience = "general",
        includeImages = false,
        includeFaqs = false,
      } = options || {}

      // Build a more detailed prompt based on the enhanced parameters
      let prompt = `Write a comprehensive, engaging, and SEO-friendly ${contentType} with the title: "${title}".`

      // Add content type specific instructions
      switch (contentType) {
        case "how-to-guide":
          prompt += `
This should be a detailed step-by-step guide that helps the reader accomplish a specific task.`
          break
        case "listicle":
          prompt += `
This should be a list-based article with clear, numbered sections for each item.`
          break
        case "product-review":
          prompt += `
This should be a balanced review that discusses both pros and cons, with a clear recommendation.`
          break
        case "case-study":
          prompt += `
This should be an in-depth analysis of a specific example, with clear problem, solution, and results sections.`
          break
      }

      // Add word count target
      prompt += `
The content should be approximately ${wordCount} words in length.`

      // Add tone instructions
      prompt += `
Use a ${tone} tone throughout the content.`

      // Add audience targeting
      prompt += `
The content should be written for a ${audience} audience.`

      // Add outline if provided
      if (outline) {
        prompt += `
Follow this outline for the content structure:
${outline}`
      }

      // Add keywords if provided
      if (keywords) {
        prompt += `
Incorporate these SEO keywords naturally throughout the content: ${keywords}`
      }

      // Add image placement suggestions if requested
      if (includeImages) {
        prompt += `
Include [IMAGE] placeholders with brief descriptions of recommended images at appropriate points in the content.`
      }

      // Add FAQ section if requested
      if (includeFaqs) {
        prompt += `
Include a FAQ section at the end with 3-5 common questions and answers related to the topic.`
      }

      // General formatting and quality instructions
      prompt += `
The content should be:
- Well-structured with proper HTML headings (<h2>, <h3>) and paragraphs (<p>)
- Formatted in HTML compatible with WordPress
- Include proper HTML formatting like <strong> for emphasis, <ul>/<li> for lists
- Use <h2> for main sections and <h3> for subsections
- Include an engaging introduction, main content sections, and a conclusion
- Professional but conversational in style
- Informative and provide value to readers
- Include proper spacing between paragraphs and sections
- DO NOT include markdown code block markers like \`\`\`html or \`\`\` in the output
Current time: ${timestamp} (use this as a seed for randomness)`

      // Use the discovered model name in the API call
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/${modelToUse}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.85,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
            seed: Math.floor(Date.now() / 1000),
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Gemini API error:", errorData)
        throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()

      // Check if the response has the expected structure
      if (
        !data.candidates ||
        !data.candidates.length ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts.length
      ) {
        console.error("Unexpected Gemini API response structure:", data)

        // If there's an error in the response, log it and throw a more specific error
        if (data.error) {
          console.error("Gemini API returned an error:", data.error)
          throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`)
        }

        throw new Error("Unexpected response structure from Gemini API")
      }

      let generatedContent = data.candidates[0].content.parts[0].text

      // Remove markdown code block markers
      generatedContent = generatedContent.replace(/```html/g, "")
      generatedContent = generatedContent.replace(/```/g, "")

      // If the content appears to be in Markdown format, convert it to HTML
      if (generatedContent.includes("#") && !generatedContent.includes("<h2>")) {
        generatedContent = this.markdownToHtml(generatedContent)
      }

      return generatedContent
    } catch (error) {
      console.error("Error generating blog content with Gemini:", error)
      throw error
    }
  }

  async optimizeForSeo(content: string, keywords: string): Promise<string> {
    try {
      const modelToUse = await this.getTextGenerationModel()
      console.log(`Using Gemini model for SEO optimization: ${modelToUse}`)

      const prompt = `Optimize the following content for SEO, focusing on these keywords: ${keywords}.

Make the following improvements:
1. Improve keyword density without keyword stuffing
2. Add appropriate HTML headings (<h2>, <h3>) and structure
3. Optimize meta description
4. Improve readability with shorter paragraphs and bullet points where appropriate
5. Add internal linking suggestions using proper <a href="#"> tags
6. Format in HTML compatible with WordPress

Original content:
${content}`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/${modelToUse}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Gemini API error:", errorData)
        throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()

      if (
        !data.candidates ||
        !data.candidates.length ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts.length
      ) {
        console.error("Unexpected Gemini API response structure:", data)
        throw new Error("Unexpected response structure from Gemini API")
      }

      return data.candidates[0].content.parts[0].text
    } catch (error) {
      console.error("Error optimizing content for SEO:", error)
      throw error
    }
  }

  async generateMetaDescription(title: string, content: string): Promise<string> {
    try {
      const modelToUse = await this.getTextGenerationModel()

      const prompt = `Generate an SEO-optimized meta description for a blog post with the following title and content. 
The meta description should be compelling, include relevant keywords, and be between 150-160 characters.

Title: ${title}

Content: ${content.substring(0, 1000)}...`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/${modelToUse}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Gemini API error:", errorData)
        throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()

      if (
        !data.candidates ||
        !data.candidates.length ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts.length
      ) {
        console.error("Unexpected Gemini API response structure:", data)
        throw new Error("Unexpected response structure from Gemini API")
      }

      const metaDescription = data.candidates[0].content.parts[0].text.trim()

      // Ensure it's not too long
      return metaDescription.length > 160 ? metaDescription.substring(0, 157) + "..." : metaDescription
    } catch (error) {
      console.error("Error generating meta description:", error)
      throw error
    }
  }

  async improveContent(title: string, content: string, improvementType: string): Promise<string> {
    try {
      // Get a suitable model for text generation
      const modelToUse = await this.getTextGenerationModel()

      // Create a prompt based on the improvement type
      let prompt = `Improve the following content titled "${title}" for ${improvementType}.

`

      switch (improvementType) {
        case "readability":
          prompt += `Make the content more readable by:
- Breaking down complex sentences
- Using simpler language where appropriate
- Improving paragraph structure
- Adding clear headings and subheadings
- Ensuring a logical flow of ideas

Original content:
${content}

Return the improved content in HTML format compatible with WordPress.`
          break

        case "seo":
          prompt += `Optimize the content for search engines by:
- Improving keyword usage (without keyword stuffing)
- Adding proper heading structure (H1, H2, H3)
- Enhancing meta description
- Improving content structure for better crawlability
- Adding internal linking suggestions

Original content:
${content}

Return the improved content in HTML format compatible with WordPress.`
          break

        case "engagement":
          prompt += `Make the content more engaging by:
- Adding questions to involve the reader
- Including calls to action
- Using more engaging language
- Adding quotes or highlighted sections
- Improving the introduction and conclusion

Original content:
${content}

Return the improved content in HTML format compatible with WordPress.`
          break

        case "clarity":
          prompt += `Improve the clarity and conciseness by:
- Removing redundant phrases
- Simplifying complex explanations
- Ensuring each paragraph focuses on one idea
- Using more precise language
- Improving overall structure

Original content:
${content}

Return the improved content in HTML format compatible with WordPress.`
          break

        case "grammar":
          prompt += `Improve the grammar and style by:
- Fixing grammatical errors
- Correcting punctuation
- Ensuring consistent tense and voice
- Improving word choice
- Fixing formatting issues

Original content:
${content}

Return the improved content in HTML format compatible with WordPress.`
          break

        default:
          prompt += `Improve the overall quality of the content while maintaining its original meaning and intent.

Original content:
${content}

Return the improved content in HTML format compatible with WordPress.`
      }

      // Use the discovered model name in the API call
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/${modelToUse}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Gemini API error:", errorData)
        throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()

      // Check if the response has the expected structure
      if (
        !data.candidates ||
        !data.candidates.length ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts.length
      ) {
        console.error("Unexpected Gemini API response structure:", data)
        throw new Error("Unexpected response structure from Gemini API")
      }

      return data.candidates[0].content.parts[0].text
    } catch (error) {
      console.error("Error improving content with Gemini:", error)
      throw error
    }
  }

  async analyzeContentImprovement(
    originalContent: string,
    improvedContent: string,
    improvementType: string,
  ): Promise<any> {
    try {
      // Get a suitable model for text generation
      const modelToUse = await this.getTextGenerationModel()

      // Create a prompt to analyze the improvements
      const prompt = `Analyze the following original content and its improved version that was optimized for ${improvementType}.

Original content:
${originalContent}

Improved content:
${improvedContent}

Provide a detailed analysis in JSON format with the following structure:
{
"improvements": [
{"type": "string", "description": "string"},
{"type": "string", "description": "string"},
{"type": "string", "description": "string"}
],
"readabilityScore": {
"before": number, // 1-10 scale
"after": number // 1-10 scale
},
"seoScore": {
"before": number, // 1-10 scale
"after": number // 1-10 scale
}
}

Ensure the JSON is valid and properly formatted.`

      // Use the discovered model name in the API call
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/${modelToUse}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2, // Lower temperature for more deterministic output
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Gemini API error:", errorData)
        throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()

      // Check if the response has the expected structure
      if (
        !data.candidates ||
        !data.candidates.length ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts.length
      ) {
        console.error("Unexpected Gemini API response structure:", data)
        throw new Error("Unexpected response structure from Gemini API")
      }

      const analysisText = data.candidates[0].content.parts[0].text

      // Extract the JSON from the response - Fix the regex patterns
      const jsonMatch = this.extractJsonFromText(analysisText)

      if (!jsonMatch) {
        console.error("Could not extract JSON from Gemini response:", analysisText)
        throw new Error("Could not extract analysis data from Gemini response")
      }

      try {
        return JSON.parse(jsonMatch)
      } catch (parseError) {
        console.error("Error parsing JSON from Gemini response:", parseError, jsonMatch)

        // Fallback to a default structure if parsing fails
        return {
          improvements: [
            { type: "Content Structure", description: "Improved overall content structure" },
            { type: "Language Quality", description: "Enhanced language quality and readability" },
            { type: "Format Optimization", description: "Optimized formatting for better presentation" },
          ],
          readabilityScore: {
            before: 5,
            after: 8,
          },
          seoScore: {
            before: 4,
            after: 7,
          },
        }
      }
    } catch (error) {
      console.error("Error analyzing content improvement with Gemini:", error)
      throw error
    }
  }

  async analyzeSeo(title: string, content: string, keywords: string): Promise<any> {
    try {
      // Get a suitable model for text generation
      const modelToUse = await this.getTextGenerationModel()

      // Create a prompt for SEO analysis
      const prompt = `Analyze the following content for SEO optimization. The title is "${title}" and the target keywords are "${keywords}".

Content:
${content}

Provide a detailed SEO analysis in JSON format with the following structure:
{
"score": number, // Overall SEO score from 0-100
"recommendations": [
{"type": "success" | "warning" | "error", "message": "string"},
{"type": "success" | "warning" | "error", "message": "string"},
{"type": "success" | "warning" | "error", "message": "string"}
],
"keywordDensity": {
"keyword1": number, // percentage
"keyword2": number
},
"readabilityScore": number, // 0-10
"metaTagsScore": number, // 0-10
"contentLengthScore": number // 0-10
}

Ensure the JSON is valid and properly formatted. Use "success" for good aspects, "warning" for areas that need improvement, and "error" for critical issues.`

      // Use the discovered model name in the API call
      const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/${modelToUse}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2, // Lower temperature for more deterministic output
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      })

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json()
        console.error("Gemini API error:", errorData)
        throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`)
      }

      const seoData = await apiResponse.json()

      // Check if the response has the expected structure
      if (
        !seoData.candidates ||
        !seoData.candidates.length ||
        !seoData.candidates[0].content ||
        !seoData.candidates[0].content.parts ||
        !seoData.candidates[0].content.parts.length
      ) {
        console.error("Unexpected Gemini API response structure:", seoData)
        throw new Error("Unexpected response structure from Gemini API")
      }

      const seoAnalysisText = seoData.candidates[0].content.parts[0].text

      // Extract the JSON from the response - Fix the regex patterns
      const jsonStr = this.extractJsonFromText(seoAnalysisText)

      if (!jsonStr) {
        console.error("Could not extract JSON from Gemini response:", seoAnalysisText)
        throw new Error("Could not extract analysis data from Gemini response")
      }

      try {
        return JSON.parse(jsonStr)
      } catch (parseError) {
        console.error("Error parsing JSON from Gemini response:", parseError, jsonStr)

        // Calculate some basic metrics manually as a fallback
        const contentLength = content.length
        const keywordsArray = keywords.split(",").map((k) => k.trim().toLowerCase())

        // Calculate keyword density
        const keywordDensity = {}
        keywordsArray.forEach((keyword) => {
          const regex = new RegExp(keyword, "gi")
          const matches = content.match(regex) || []
          const density = (matches.length / (contentLength / 100)) * 10
          keywordDensity[keyword] = Math.min(density, 5) // Cap at 5%
        })

        // Generate recommendations
        const recommendations = []

        if (title.length < 40) {
          recommendations.push({
            type: "warning",
            message: "Title is too short. Aim for 50-60 characters for optimal SEO.",
          })
        } else {
          recommendations.push({
            type: "success",
            message: "Title length is good for SEO.",
          })
        }

        if (contentLength < 300) {
          recommendations.push({
            type: "error",
            message: "Content is too short. Aim for at least 1000 words for better SEO.",
          })
        } else if (contentLength < 1000) {
          recommendations.push({
            type: "warning",
            message: "Content length is moderate. Consider expanding to 1500+ words for better SEO.",
          })
        } else {
          recommendations.push({
            type: "success",
            message: "Content length is good for SEO.",
          })
        }

        const keywordInTitle = keywordsArray.some((keyword) => title.toLowerCase().includes(keyword))

        if (!keywordInTitle) {
          recommendations.push({
            type: "warning",
            message: "Primary keyword not found in title. Include your main keyword in the title.",
          })
        } else {
          recommendations.push({
            type: "success",
            message: "Primary keyword found in title.",
          })
        }

        // Calculate scores
        const readabilityScore = Math.min(Math.floor(contentLength / 200), 10)
        const metaTagsScore = title.length > 40 ? 8 : 5
        const contentLengthScore = Math.min(Math.floor(contentLength / 150), 10)

        // Calculate overall score
        const score = Math.floor(
          ((readabilityScore + metaTagsScore + contentLengthScore) / 3) * 10 + (keywordInTitle ? 10 : 0),
        )

        return {
          score,
          recommendations,
          keywordDensity,
          readabilityScore,
          metaTagsScore,
          contentLengthScore,
        }
      }
    } catch (error) {
      console.error("Error analyzing SEO with Gemini:", error)
      throw error
    }
  }

  async generateTrendingTopics(prompt: string): Promise<any[]> {
    try {
      // Get a suitable model for text generation
      const modelToUse = await this.getTextGenerationModel()

      // Use the discovered model name in the API call
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/${modelToUse}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Gemini API error:", errorData)
        throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()

      // Check if the response has the expected structure
      if (
        !data.candidates ||
        !data.candidates.length ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts.length
      ) {
        console.error("Unexpected Gemini API response structure:", data)
        throw new Error("Unexpected response structure from Gemini API")
      }

      const responseText = data.candidates[0].content.parts[0].text

      // Extract the JSON from the response - Fix the regex patterns
      const jsonStr = this.extractJsonFromText(responseText)

      if (!jsonStr) {
        console.error("Could not extract JSON from Gemini response:", responseText)
        throw new Error("Could not extract topic suggestions from Gemini response")
      }

      try {
        const topics = JSON.parse(jsonStr)

        // Validate the structure of each topic
        return topics.map((topic: any, index: number) => ({
          id: (index + 1).toString(),
          title: topic.title || `Topic ${index + 1}`,
          description: topic.description || "No description provided.",
          keywords: Array.isArray(topic.keywords) ? topic.keywords : ["wordpress"],
          difficulty: ["easy", "medium", "hard"].includes(topic.difficulty) ? topic.difficulty : "medium",
          estimatedTime: topic.estimatedTime || "3-4 hours",
          category: topic.category || "general",
        }))
      } catch (parseError) {
        console.error("Error parsing JSON from Gemini response:", parseError, jsonStr)
        throw new Error("Error parsing topic suggestions from Gemini response")
      }
    } catch (error) {
      console.error("Error generating trending topics with Gemini:", error)
      throw error
    }
  }

  // Helper method to extract JSON from text responses
  private extractJsonFromText(text: string): string | null {
    try {
      // Try different patterns to extract JSON
      // 1. Look for JSON in code blocks with json tag
      const jsonCodeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonCodeBlockMatch && jsonCodeBlockMatch[1]) {
        return jsonCodeBlockMatch[1].trim()
      }

      // 2. Look for JSON in regular code blocks
      const codeBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/)
      if (codeBlockMatch && codeBlockMatch[1]) {
        return codeBlockMatch[1].trim()
      }

      // 3. Look for JSON object pattern
      const jsonObjectMatch = text.match(/{[\s\S]*?}/)
      if (jsonObjectMatch) {
        return jsonObjectMatch[0].trim()
      }

      // 4. Look for JSON array pattern
      const jsonArrayMatch = text.match(/\[\s*{[\s\S]*?}\s*\]/)
      if (jsonArrayMatch) {
        return jsonArrayMatch[0].trim()
      }

      return null
    } catch (error) {
      console.error("Error extracting JSON from text:", error)
      return null
    }
  }

  // Helper method to convert Markdown to HTML
  private markdownToHtml(markdown: string): string {
    // First, remove any markdown code block markers
    let html = markdown
    html = html.replace(/```html/g, "")
    html = html.replace(/```/g, "")

    // Convert headings
    html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>")
    html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>")
    html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>")
    html = html.replace(/^#### (.*$)/gm, "<h4>$1</h4>")
    html = html.replace(/^##### (.*$)/gm, "<h5>$1</h5>")

    // Convert bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")

    // Convert lists
    html = html.replace(/^\* (.*$)/gm, "<ul><li>$1</li></ul>")
    html = html.replace(/^- (.*$)/gm, "<ul><li>$1</li></ul>")
    html = html.replace(/^\d+\. (.*$)/gm, "<ol><li>$1</li></ol>")

    // Fix consecutive list items
    html = html.replace(/<\/ul>\s*<ul>/g, "")
    html = html.replace(/<\/ol>\s*<ol>/g, "")

    // Convert links
    html = html.replace(/\[(.*?)\]$$(.*?)$$/g, '<a href="$2">$1</a>')

    // Convert paragraphs (any line that doesn't start with a tag)
    const paragraphs = html.split("\n\n")
    html = paragraphs
      .map((p) => {
        if (p.trim() && !p.trim().startsWith("<")) {
          return `<p>${p.trim()}</p>`
        }
        return p
      })
      .join("\n\n")

    return html
  }

  async suggestCategories(
    title: string,
    content: string,
    keywords?: string,
  ): Promise<{ name: string; parent?: string }[]> {
    try {
      console.log("Suggesting categories for:", title)

      // Get a suitable model for text generation
      const modelToUse = await this.getTextGenerationModel()

      // Create a more specific prompt for suggesting categories
      const prompt = `
      Based on the following blog post title, content, and keywords, suggest appropriate WordPress categories and subcategories.
      
      Title: ${title}
      
      ${keywords ? `Keywords: ${keywords}` : ""}
      
      Content excerpt: ${content.substring(0, 1000)}... (truncated)
      
      Please suggest 2-4 specific, relevant categories that would be appropriate for this content. If applicable, organize them as main categories and subcategories.
      
      Rules for categories:
      1. Be specific and relevant to the content topic
      2. Use common WordPress blog categories when appropriate (e.g., "Marketing", "Technology", "Business")
      3. Include at least one main category and optionally subcategories
      4. DO NOT suggest "Uncategorized" unless the content truly doesn't fit any category
      5. Categories should be concise (1-3 words)
      
      Format your response as a JSON array with this structure:
      [
        {
          "name": "Main Category Name"
        },
        {
          "name": "Subcategory Name",
          "parent": "Main Category Name"
        }
      ]
      
      Only include the JSON array in your response, nothing else.
      `

      // Call the Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/${modelToUse}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3, // Lower temperature for more deterministic output
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Gemini API error when suggesting categories:", errorData)
        throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()

      // Check if the response has the expected structure
      if (
        !data.candidates ||
        !data.candidates.length ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts.length
      ) {
        console.error("Unexpected Gemini API response structure for categories:", data)
        return [{ name: "Uncategorized" }]
      }

      const responseText = data.candidates[0].content.parts[0].text
      console.log("Raw category suggestion response:", responseText)

      // Extract the JSON from the response
      const jsonStr = this.extractJsonFromText(responseText)

      if (!jsonStr) {
        console.error("Could not extract JSON from category suggestion response:", responseText)
        return [{ name: "Uncategorized" }]
      }

      try {
        const categories = JSON.parse(jsonStr)

        if (!Array.isArray(categories) || categories.length === 0) {
          console.error("Invalid categories format or empty array:", categories)
          return [{ name: "Uncategorized" }]
        }

        console.log("Parsed categories:", categories)

        // Validate each category has at least a name
        const validCategories = categories.filter(
          (cat) => cat && typeof cat.name === "string" && cat.name.trim() !== "",
        )

        if (validCategories.length === 0) {
          console.error("No valid categories found after filtering")
          return [{ name: "Uncategorized" }]
        }

        return validCategories
      } catch (parseError) {
        console.error("Error parsing JSON from category suggestion response:", parseError, jsonStr)
        return [{ name: "Uncategorized" }]
      }
    } catch (error) {
      console.error("Error suggesting categories:", error)
      // Return a default category if there's an error
      return [{ name: "Uncategorized" }]
    }
  }

  private async generateText(prompt: string): Promise<string> {
    try {
      // Get a suitable model for text generation
      const modelToUse = await this.getTextGenerationModel()

      // Use the discovered model name in the API call
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/${modelToUse}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Gemini API error:", errorData)
        throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()

      // Check if the response has the expected structure
      if (
        !data.candidates ||
        !data.candidates.length ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts.length
      ) {
        console.error("Unexpected Gemini API response structure:", data)
        throw new Error("Unexpected response structure from Gemini API")
      }

      return data.candidates[0].content.parts[0].text
    } catch (error) {
      console.error("Error generating text with Gemini:", error)
      throw error
    }
  }
}

