import { NextResponse } from "next/server"
import { GeminiClient } from "@/lib/gemini-api"

export async function GET() {
  try {
    // The fromEnvironment method is now async, so we need to await it
    const geminiClient = await GeminiClient.fromEnvironment()
    const models = await geminiClient.listModels()

    // Filter to only include models that support text generation
    // and exclude any models that might be deprecated
    const textModels = models.filter(
      (model) =>
        model.supportedGenerationMethods?.includes("generateContent") &&
        // Prioritize newer models (1.5 series)
        !model.name.includes("gemini-1.0"), // Filter out deprecated 1.0 models
    )

    // If no 1.5 models are found, fall back to any available models
    const availableModels =
      textModels.length > 0
        ? textModels
        : models.filter((model) => model.supportedGenerationMethods?.includes("generateContent"))

    return NextResponse.json({
      success: true,
      models: availableModels.map((model) => ({
        name: model.name, // This is the full model name including the path
        displayName: model.displayName || model.name.split("/").pop(),
        description: model.description,
        supportedGenerationMethods: model.supportedGenerationMethods,
      })),
    })
  } catch (error) {
    console.error("Models API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

