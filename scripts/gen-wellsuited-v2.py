import os
from google import genai
from google.genai import types
from PIL import Image

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# Load #5 as reference
ref = Image.open("/Users/nc/weatherwear/logo-concepts/gemini/well-suited/05-italic-elegant.jpg")

prompts = [
    {
        "name": "v2a-refined",
        "prompt": """Here is a brandmark concept I like for "Well Suited." — a fashion/weather styling brand.
I want to refine it. Keep the elegant italic serif style and the terracotta period.
Make the letterforms more refined and distinctive — sharper contrast between thick and thin strokes.
"Well" should be lighter/more delicate, "Suited" slightly bolder. The period stays terracotta (#c4725c).
Clean off-white (#faf8f4) background. No mockup, just the logo flat on the background.
Make it feel like a luxury fashion house wordmark — Celine, The Row, or Saint Laurent level polish."""
    },
    {
        "name": "v2b-tighter",
        "prompt": """Refine this brandmark for "Well Suited." — keep the italic serif style but make it tighter and more compact.
Reduce the spacing between letters slightly. The italic angle should be consistent and elegant.
"Well" in a lighter weight italic, "Suited" in a medium-weight italic. Terracotta (#c4725c) period at the end.
All in warm charcoal (#3a3530) on off-white (#faf8f4).
Flat logo, no mockup, no paper texture, no shadows. Just the wordmark centered on a clean background.
This needs to work in a website nav bar at small size and as a hero logo at large size."""
    },
    {
        "name": "v2c-high-contrast",
        "prompt": """Refine this "Well Suited." brandmark. Keep the italic serif direction but push the contrast higher.
Ultra-thin hairlines on the upstrokes, thick bold strokes on the downstrokes — like Didot or Bodoni italic.
This should look like it was custom-drawn by a type designer for a luxury fashion brand.
"Well" and "Suited" in warm charcoal (#3a3530), terracotta (#c4725c) period.
Clean flat off-white (#faf8f4) background, no mockup or texture.
The letterforms should be beautiful enough to frame — every curve intentional."""
    },
    {
        "name": "v2d-with-period",
        "prompt": """Redesign this "Well Suited." brandmark. Same italic serif direction.
This time make the terracotta period larger and more prominent — it should feel like a design element, not just punctuation.
The period is the brand's signature mark, like a warm sun or a button.
Beautiful italic serif letterforms in warm charcoal (#3a3530).
Clean off-white (#faf8f4) background, flat design, no mockup.
Fashion editorial quality — this logo belongs on a garment tag or embossed on a leather case."""
    },
    {
        "name": "v2e-stacked-italic",
        "prompt": """Take the italic serif style from this reference and create a stacked version:
"Well" on the first line, "Suited." on the second line, both in elegant italic serif.
"Well" slightly smaller or lighter. "Suited." larger and bolder with a terracotta (#c4725c) period.
Warm charcoal (#3a3530) on off-white (#faf8f4). Clean flat background, no mockup.
The stacking should create a nice visual block — compact and balanced.
This is for a fashion/weather brand that should feel like Kinfolk or Cereal magazine."""
    },
    {
        "name": "v2f-script-serif",
        "prompt": """Reimagine this "Well Suited." brandmark with "Well" in an elegant flowing script
that transitions into "Suited." in a refined upright or italic serif.
The script "Well" should flow naturally into the serif "Suited" — connected or nearly touching.
The contrast between the loose script and the structured serif creates tension and beauty.
Warm charcoal (#3a3530), terracotta (#c4725c) period. Off-white (#faf8f4) background, flat, no mockup.
Think of a fashion designer's signature next to their brand name."""
    },
]

os.makedirs("/Users/nc/weatherwear/logo-concepts/gemini/well-suited-v2", exist_ok=True)

for p in prompts:
    print(f"Generating: {p['name']}...")
    try:
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[p["prompt"], ref],
            config=types.GenerateContentConfig(
                response_modalities=['TEXT', 'IMAGE'],
                image_config=types.ImageConfig(
                    aspect_ratio="3:2",
                    image_size="2K"
                ),
            ),
        )
        for part in response.parts:
            if part.inline_data:
                img = part.as_image()
                path = f"/Users/nc/weatherwear/logo-concepts/gemini/well-suited-v2/{p['name']}.jpg"
                img.save(path)
                print(f"  Saved: {path}")
            elif part.text:
                print(f"  Text: {part.text[:100]}")
    except Exception as e:
        print(f"  Error: {e}")

print("\nDone!")
