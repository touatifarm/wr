// We'll use a simple in-memory cache with a fallback to environment variables
// This won't persist across deployments but will work for the duration of the server instance

let settingsCache: Settings | null = null

export type Settings = {
  modelName?: string
  postFrequency?: string
  categories?: string
  contentGuidelines?: string
  blogTheme?: string
  wordpress?: {
    siteUrl?: string
    username?: string
    password?: string
  }
  gemini?: {
    apiKey?: string
    modelName?: string
  }
  agent?: {
    postFrequency?: string
    categories?: string
    contentGuidelines?: string
    blogTheme?: string
  }
}

export async function getSettings(): Promise<Settings> {
  // If we have cached settings, return them
  if (settingsCache) {
    return { ...settingsCache }
  }

  // Otherwise, initialize with empty settings
  settingsCache = {}
  return { ...settingsCache }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    // Get existing settings
    const existingSettings = settingsCache || {}

    // Merge with new settings
    const updatedSettings = { ...existingSettings }

    // Handle top-level properties
    if (settings.modelName) updatedSettings.modelName = settings.modelName
    if (settings.postFrequency) updatedSettings.postFrequency = settings.postFrequency
    if (settings.categories) updatedSettings.categories = settings.categories
    if (settings.contentGuidelines) updatedSettings.contentGuidelines = settings.contentGuidelines
    if (settings.blogTheme) updatedSettings.blogTheme = settings.blogTheme

    // Special handling for nested objects
    if (settings.wordpress) {
      updatedSettings.wordpress = {
        ...(existingSettings.wordpress || {}),
        ...settings.wordpress,
      }
    }

    if (settings.gemini) {
      if (settings.gemini.modelName) {
        updatedSettings.modelName = settings.gemini.modelName
      }

      updatedSettings.gemini = {
        ...(existingSettings.gemini || {}),
        ...settings.gemini,
      }
    }

    if (settings.agent) {
      if (settings.agent.postFrequency) {
        updatedSettings.postFrequency = settings.agent.postFrequency
      }
      if (settings.agent.categories) {
        updatedSettings.categories = settings.agent.categories
      }
      if (settings.agent.contentGuidelines) {
        updatedSettings.contentGuidelines = settings.agent.contentGuidelines
      }
      if (settings.agent.blogTheme) {
        updatedSettings.blogTheme = settings.agent.blogTheme
      }

      updatedSettings.agent = {
        ...(existingSettings.agent || {}),
        ...settings.agent,
      }
    }

    // Update the cache
    settingsCache = updatedSettings

    // Log the settings for debugging
    console.log("Settings saved:", JSON.stringify(updatedSettings, null, 2))
  } catch (error) {
    console.error("Error saving settings:", error)
    throw new Error("Failed to save settings")
  }
}

