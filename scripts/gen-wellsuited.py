import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

prompts = [
    {
        "name": "01-editorial-serif",
        "prompt": """Design a brandmark/wordmark logo for "Well Suited" — a fashion-meets-weather styling app.
The words "Well Suited" must be clearly legible. This should feel like a high-end fashion brand, not a tech product.
Think Aesop, The Row, COS, Celine — editorial, warm, sophisticated.
Use a refined serif typeface with custom letterforms. Warm charcoal (#3a3530) on off-white (#faf8f4).
Can include a subtle terracotta (#c4725c) accent — a dot, a stroke, or on one letter.
No icons, no illustrations. Pure beautiful typography with personality and craft.
Clean off-white (#faf8f4) background. The logo should work at both large hero scale and small nav size."""
    },
    {
        "name": "02-stacked-caps",
        "prompt": """Design a stacked wordmark logo: "WELL" on top, "SUITED" below.
This is for a premium fashion/weather styling brand called "Well Suited".
Both words in uppercase but with elegant, refined serif letterforms — think Didot, Bodoni, or a custom high-contrast serif.
Generous letter-spacing on "WELL", tighter on "SUITED" so they align visually.
Deep warm charcoal (#3a3530) on clean off-white (#faf8f4).
A single terracotta (#c4725c) accent detail — maybe a dot, a line between the words, or a subtle color on one letter.
No icons. This should look like it belongs on the cover of a fashion magazine or embossed on leather goods."""
    },
    {
        "name": "03-mixed-weight",
        "prompt": """Create a wordmark for "Well Suited" that mixes two contrasting type styles.
"Well" in a light, refined sans-serif. "Suited" in a bold, elegant serif with high stroke contrast.
The weight difference creates visual tension and hierarchy — the word "Suited" is the star.
Colors: warm charcoal (#3a3530) with a terracotta (#c4725c) accent somewhere subtle.
On clean off-white (#faf8f4) background.
This is a fashion/lifestyle brand, not a tech company. Think of how Celine or Saint Laurent approach their wordmarks.
No icons, no imagery — just masterful typography."""
    },
    {
        "name": "04-lowercase-connected",
        "prompt": """Design a wordmark for "well suited" in all lowercase with custom connected letterforms.
The letters should flow together with intentional ligatures — maybe the "ll" connects elegantly,
or the "s" and "u" in suited share a stroke.
This should feel bespoke and crafted, like hand-drawn lettering refined into a logo.
Warm charcoal (#3a3530) on off-white (#faf8f4). A terracotta (#c4725c) accent on one detail.
No icons. Think of how brands like totême, ssense, or acne studios approach lowercase wordmarks —
modern, distinctive, effortlessly cool. This is a fashion brand, not a weather app."""
    },
    {
        "name": "05-italic-elegant",
        "prompt": """Create an elegant italic wordmark for "Well Suited".
The entire mark in a beautiful italic serif — like Garamond italic or a custom Didot italic.
The italic angle gives it movement and energy, like stepping out the door.
"Well" slightly lighter weight, "Suited" slightly bolder, but both in the same typeface.
Warm charcoal (#3a3530) on off-white (#faf8f4). Terracotta (#c4725c) on the period at the end: "Well Suited."
No icons, no imagery. This should feel like a luxury brand signature — something you'd see
on a garment tag or the back of a fashion magazine."""
    },
    {
        "name": "06-monogram-lockup",
        "prompt": """Design a brandmark that combines a "WS" monogram with the words "Well Suited".
The monogram should be elegant and intertwined — the W and S sharing strokes or overlapping gracefully.
Next to or below the monogram, "Well Suited" in a clean, refined typeface.
The monogram can work on its own (for an app icon or favicon) and with the text (for the full brand).
Warm charcoal (#3a3530) on off-white (#faf8f4). Terracotta (#c4725c) accent on the monogram or a detail.
Fashion-luxury aesthetic — think Yves Saint Laurent's YSL monogram but warmer and more modern.
No weather symbols, no clothing icons."""
    },
    {
        "name": "07-split-color",
        "prompt": """Create a wordmark for "Well Suited" where the two words are in different colors.
"Well" in terracotta/rust (#c4725c), "Suited" in deep warm charcoal (#3a3530).
Or reversed — experiment with which word gets the color.
Use a single elegant typeface — a high-contrast modern serif like Didot or a refined transitional serif.
The color split should feel intentional and sophisticated, not playful.
On clean off-white (#faf8f4) background.
No icons. This is a fashion brand — think of how Saint Laurent, Celine, or Bottega Veneta approach branding."""
    },
    {
        "name": "08-condensed-poster",
        "prompt": """Design a bold condensed wordmark for "WELL SUITED" in all caps.
This should have poster energy — like a fashion editorial headline or a luxury campaign.
Ultra-condensed serif or slab-serif letterforms, tightly set.
The words can be on one line or stacked.
Warm charcoal (#3a3530) on off-white (#faf8f4) with an optional terracotta (#c4725c) accent.
Think of how fashion brands like VOGUE, BAZAAR, or W MAGAZINE treat their mastheads —
bold, confident, unapologetic. But warmer and more refined than a news magazine.
No icons, no imagery."""
    },
]

os.makedirs("/Users/nc/weatherwear/logo-concepts/gemini/well-suited", exist_ok=True)

for p in prompts:
    print(f"Generating: {p['name']}...")
    try:
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[p["prompt"]],
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
                path = f"/Users/nc/weatherwear/logo-concepts/gemini/well-suited/{p['name']}.jpg"
                img.save(path)
                print(f"  Saved: {path}")
            elif part.text:
                print(f"  Text: {part.text[:100]}")
    except Exception as e:
        print(f"  Error: {e}")

print("\nDone!")
