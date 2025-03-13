import { NextResponse } from "next/server"
import { GeminiClient } from "@/lib/gemini-api"
import { getSettings } from "@/lib/settings"

export async function GET() {
  try {
    const geminiClient = await GeminiClient.fromEnvironment()
    const models = await geminiClient.listModels()
    const settings = await getSettings()
    const currentModel = await geminiClient.getTextGenerationModel()

    return NextResponse.json({
      success: true,
      models: models,
      settings: {
        modelName: settings.modelName,
      },
      currentModel: currentModel,
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

