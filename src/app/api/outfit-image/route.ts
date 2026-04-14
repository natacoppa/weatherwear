import { NextRequest, NextResponse } from "next/server";
import { rateLimit, corsHeaders } from "@/lib/rate-limit";
import { requireApiKey } from "@/lib/api-auth";
import { AIShapeError, assertDayOutfit } from "@/lib/ai-shapes";
import type { DayOutfit } from "@/lib/types";

function describeWalkOutGarments(outfit: DayOutfit): string {
  const garments =
    outfit.walkOut.base.kind === "dress"
      ? [outfit.walkOut.base.dress]
      : [outfit.walkOut.base.top, outfit.walkOut.base.bottom];

  return [...garments, outfit.walkOut.layer, outfit.walkOut.shoes].filter(Boolean).join(", ");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseDayOutfitImageRequest(raw: unknown): { outfit: DayOutfit; location: string; temp: number } {
  if (!isObject(raw)) {
    throw new AIShapeError("image request body must be an object", raw);
  }

  const outfit = assertDayOutfit(raw.outfit);
  const location = typeof raw.location === "string" ? raw.location.trim() : "";
  const temp = typeof raw.temp === "number" ? raw.temp : NaN;

  if (!location || Number.isNaN(temp)) {
    throw new AIShapeError("image request requires location and numeric temp", raw);
  }

  return { outfit, location, temp };
}

export async function POST(req: NextRequest) {
  const unauthed = requireApiKey(req);
  if (unauthed) return unauthed;
  const limited = rateLimit(req);
  if (limited) return limited;
  try {
    const { outfit, location, temp } = parseDayOutfitImageRequest(await req.json());

    // Build the image prompt from the exact outfit recommendation
    const garments = describeWalkOutGarments(outfit);

    const accessories = (outfit.walkOut?.accessories || []).join(", ");
    const accString = accessories ? ` Accessories: ${accessories}.` : "";

    const imagePrompt = `High-end fashion editorial photograph. A woman walking on a ${location.split(",")[0]} street in ${Math.round(temp)}°F weather. The look belongs to the "${outfit.family}" outfit family. She is wearing exactly: ${garments}.${accString} The colors of the clothing should match exactly what is described — do NOT default to beige, camel, or cream unless the description specifically says those colors. Shot on 35mm film, natural light, shallow depth of field, street style editorial. Full body, urban setting. No logos visible.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: imagePrompt }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }
    );

    if (!geminiRes.ok) {
      throw new Error(`Gemini API error: ${geminiRes.status}`);
    }

    const data = await geminiRes.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(
      (part: unknown): part is { inlineData: { mimeType: string; data: string } } =>
        isObject(part)
        && "inlineData" in part
        && isObject(part.inlineData)
        && typeof part.inlineData.mimeType === "string"
        && typeof part.inlineData.data === "string",
    );

    if (!imagePart) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    // Return the base64 image directly
    return NextResponse.json({
      image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
    });
  } catch (error) {
    if (error instanceof AIShapeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Outfit image error:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
