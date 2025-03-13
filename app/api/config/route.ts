import { NextResponse } from "next/server"
import { env } from "@/lib/env"
import { getSettings } from "@/lib/settings"

export async function GET() {
  const settings = await getSettings()

  return NextResponse.json({
    wordpress: {
      siteUrl: env.WORDPRESS_SITE_URL || "",
      username: env.WORDPRESS_USERNAME || "",
      password: env.WORDPRESS_PASSWORD ? true : false,
    },
    gemini: {
      apiKey: env.GEMINI_API_KEY ? true : false,
    },
    settings: settings,
  })
}

