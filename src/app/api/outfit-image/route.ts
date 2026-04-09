import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { outfit, location, temp } = await req.json();

    if (!outfit || !location) {
      return NextResponse.json({ error: "Missing outfit or location" }, { status: 400 });
    }

    // Build the image prompt from the exact outfit recommendation
    const garments = [
      outfit.walkOut?.top,
      outfit.walkOut?.layer,
      outfit.walkOut?.bottom,
      outfit.walkOut?.shoes,
    ].filter(Boolean).join(", ");

    const accessories = (outfit.walkOut?.accessories || []).join(", ");
    const accString = accessories ? ` Accessories: ${accessories}.` : "";

    const imagePrompt = `High-end fashion editorial photograph. A woman walking on a ${location.split(",")[0]} street in ${Math.round(temp)}°F weather. She is wearing: ${garments}.${accString} Style references: The Row, Khaite, Totême, Lemaire — quiet luxury, minimal, elevated basics, tonal dressing, impeccable tailoring, relaxed but intentional silhouettes. Muted earth tones and neutrals. Shot on 35mm film, natural light, shallow depth of field, street style editorial. Full body, urban setting. No logos visible.`;

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
    const imagePart = parts.find((p: Record<string, unknown>) => "inlineData" in p);

    if (!imagePart) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    // Return the base64 image directly
    return NextResponse.json({
      image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
    });
  } catch (error) {
    console.error("Outfit image error:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
