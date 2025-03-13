// WordPress REST API client

type WordPressCredentials = {
  siteUrl: string
  username: string
  password: string
}

type WordPressPost = {
  title: string
  content: string
  status: "draft" | "publish" | "future"
  date?: string
  categories?: number[]
  tags?: number[]
  featured_media?: number
}

export class WordPressClient {
  private credentials: WordPressCredentials

  constructor(credentials: WordPressCredentials) {
    this.credentials = credentials
  }

  private getAuthHeader() {
    const token = Buffer.from(`${this.credentials.username}:${this.credentials.password}`).toString("base64")
    return `Basic ${token}`
  }

  private getApiUrl(endpoint: string) {
    const baseUrl = this.credentials.siteUrl.replace(/\/$/, "")
    return `${baseUrl}/wp-json/wp/v2/${endpoint}`
  }

  static fromEnvironment() {
    const { WORDPRESS_SITE_URL, WORDPRESS_USERNAME, WORDPRESS_PASSWORD } = process.env

    if (!WORDPRESS_SITE_URL || !WORDPRESS_USERNAME || !WORDPRESS_PASSWORD) {
      throw new Error("WordPress environment variables are not properly configured")
    }

    return new WordPressClient({
      siteUrl: WORDPRESS_SITE_URL,
      username: WORDPRESS_USERNAME,
      password: WORDPRESS_PASSWORD,
    })
  }

  async getPosts(query: any = {}): Promise<any[]> {
    const queryParams = new URLSearchParams()

    // Add per_page and status by default
    queryParams.append("per_page", "100")
    queryParams.append("status", "draft,publish,future")

    // Add any additional query parameters
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    }

    const url = `${this.getApiUrl("posts")}?${queryParams.toString()}`

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: this.getAuthHeader(),
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching WordPress posts:", error)
      throw error
    }
  }

  async createPost(post: WordPressPost): Promise<any> {
    const url = this.getApiUrl("posts")

    try {
      // Create the request body
      const requestBody: any = {
        title: post.title,
        content: post.content,
        status: post.status,
      }

      // Only add optional fields if they exist
      if (post.date) requestBody.date = post.date
      if (post.categories && post.categories.length > 0) {
        requestBody.categories = post.categories
        console.log("Adding categories to post:", post.categories)
      }
      if (post.tags && post.tags.length > 0) requestBody.tags = post.tags
      if (post.featured_media) requestBody.featured_media = post.featured_media

      console.log("Creating post with data:", JSON.stringify(requestBody, null, 2))

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("WordPress API error:", errorText)
        throw new Error(`Failed to create post: ${response.statusText}. Details: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error creating WordPress post:", error)
      throw error
    }
  }

  async updatePost(id: string, post: Partial<WordPressPost>): Promise<any> {
    const url = this.getApiUrl(`posts/${id}`)

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(post),
      })

      if (!response.ok) {
        throw new Error(`Failed to update post: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error updating WordPress post:", error)
      throw error
    }
  }

  async deletePost(id: string): Promise<any> {
    const url = this.getApiUrl(`posts/${id}?force=true`)

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: this.getAuthHeader(),
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error deleting WordPress post:", error)
      throw error
    }
  }

  async getCategories(): Promise<any[]> {
    const url = this.getApiUrl("categories?per_page=100")

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: this.getAuthHeader(),
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching WordPress categories:", error)
      throw error
    }
  }

  async getTags(): Promise<any[]> {
    const url = this.getApiUrl("tags?per_page=100")

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: this.getAuthHeader(),
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching WordPress tags:", error)
      throw error
    }
  }

  async createCategory(category: { name: string; slug?: string; description?: string; parent?: number }): Promise<any> {
    const url = this.getApiUrl("categories")

    try {
      // Validate category name
      if (!category.name || category.name.trim() === "") {
        throw new Error("Category name cannot be empty")
      }

      // Create slug from name if not provided
      if (!category.slug) {
        category.slug = category.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
          .replace(/\s+/g, "-") // Replace spaces with hyphens
          .replace(/-+/g, "-") // Remove consecutive hyphens
      }

      // Ensure parent is a valid number
      if (category.parent !== undefined) {
        category.parent = Number(category.parent)
        if (isNaN(category.parent)) {
          category.parent = 0
        }
      }

      console.log("Creating category with data:", JSON.stringify(category, null, 2))

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(category),
      })

      const responseData = await response.text()
      console.log(`Category creation response status: ${response.status}`)

      if (!response.ok) {
        // Check if the error is because the category already exists
        if (responseData.includes("term_exists")) {
          // Parse the response to get the existing term ID
          try {
            const errorData = JSON.parse(responseData)
            if (errorData.data && errorData.data.term_id) {
              // Return the existing category instead of throwing an error
              console.log(`Category already exists with ID: ${errorData.data.term_id}`)

              // Fetch the existing category to return consistent data
              const existingCategory = await this.getCategory(errorData.data.term_id.toString())
              return existingCategory
            }
          } catch (parseError) {
            console.error("Error parsing term_exists response:", parseError)
          }
        }

        console.error("WordPress API error response:", responseData)
        throw new Error(`Failed to create category: ${response.statusText}. Response: ${responseData}`)
      }

      try {
        return JSON.parse(responseData)
      } catch (parseError) {
        console.error("Error parsing category response:", parseError)
        throw new Error(`Failed to parse category response: ${responseData}`)
      }
    } catch (error) {
      console.error("Error creating WordPress category:", error)
      // Throw a more detailed error
      if (error instanceof Error) {
        throw new Error(`Failed to create category: ${error.message}`)
      } else {
        throw new Error("Failed to create category due to an unknown error")
      }
    }
  }

  // Add a new method to get a category by ID
  async getCategory(id: string): Promise<any> {
    const url = this.getApiUrl(`categories/${id}`)

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: this.getAuthHeader(),
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch category: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching WordPress category:", error)
      throw error
    }
  }

  async createTag(tag: { name: string; slug?: string; description?: string }): Promise<any> {
    const url = this.getApiUrl("tags")

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(tag),
      })

      if (!response.ok) {
        throw new Error(`Failed to create tag: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error creating WordPress tag:", error)
      throw error
    }
  }

  async updateCategory(
    id: string,
    category: { name?: string; slug?: string; description?: string; parent?: number },
  ): Promise<any> {
    const url = this.getApiUrl(`categories/${id}`)

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(category),
      })

      if (!response.ok) {
        throw new Error(`Failed to update category: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error updating WordPress category:", error)
      throw error
    }
  }

  async updateTag(id: string, tag: { name?: string; slug?: string; description?: string }): Promise<any> {
    const url = this.getApiUrl(`tags/${id}`)

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(tag),
      })

      if (!response.ok) {
        throw new Error(`Failed to update tag: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error updating WordPress tag:", error)
      throw error
    }
  }

  async deleteCategory(id: string): Promise<any> {
    const url = this.getApiUrl(`categories/${id}?force=true`)

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: this.getAuthHeader(),
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete category: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error deleting WordPress category:", error)
      throw error
    }
  }

  async deleteTag(id: string): Promise<any> {
    const url = this.getApiUrl(`tags/${id}?force=true`)

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: this.getAuthHeader(),
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete tag: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error deleting WordPress tag:", error)
      throw error
    }
  }

  async uploadMedia(file: File): Promise<any> {
    const url = this.getApiUrl("media")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: this.getAuthHeader(),
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Failed to upload media: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error uploading media to WordPress:", error)
      throw error
    }
  }

  async getAnalytics(startDate: string, endDate: string): Promise<any> {
    // This method will need to be adapted based on the analytics plugin you're using
    // For example, if using Jetpack Stats:
    const url = this.getApiUrl(`jetpack/v4/stats/visits?start=${startDate}&end=${endDate}`)

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: this.getAuthHeader(),
        },
      })

      if (!response.ok) {
        // Log the error but return empty data instead of throwing
        console.log(`Analytics endpoint not available. Status: ${response.status}`)
        return {
          visits: [],
          hasData: false,
        }
      }

      return await response.json()
    } catch (error) {
      // Log the error but return empty data instead of throwing
      console.log("Error fetching WordPress analytics:", error)
      return {
        visits: [],
        hasData: false,
      }
    }
  }

  async getPostViews(postId: string): Promise<number> {
    try {
      // First, check if the site has Jetpack Stats installed
      const url = this.getApiUrl(`jetpack/v4/stats/post/${postId}`)

      const response = await fetch(url, {
        headers: {
          Authorization: this.getAuthHeader(),
        },
      })

      if (!response.ok) {
        // If the endpoint doesn't exist, return a default value instead of throwing
        console.log(`Post views endpoint not available for post ${postId}. Status: ${response.status}`)
        return 0
      }

      const data = await response.json()
      return data.views || 0
    } catch (error) {
      // Log the error but don't throw, just return 0
      console.log(`Could not fetch post views for post ${postId}:`, error)
      return 0
    }
  }

  async getReferrers(period = "month"): Promise<any[]> {
    // This method will need to be adapted based on the analytics plugin you're using
    try {
      const url = this.getApiUrl(`jetpack/v4/stats/referrers?period=${period}`)

      const response = await fetch(url, {
        headers: {
          Authorization: this.getAuthHeader(),
        },
      })

      if (!response.ok) {
        // Log the error but return empty data instead of throwing
        console.log(`Referrers endpoint not available. Status: ${response.status}`)
        return []
      }

      const data = await response.json()
      return data.referrers || []
    } catch (error) {
      // Log the error but return empty data instead of throwing
      console.log("Error fetching referrers:", error)
      return []
    }
  }
}

