import os
from google import genai
from google.genai import types
from PIL import Image

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

ref = Image.open("/Users/nc/weatherwear/logo-concepts/gemini/well-suited-v3/06-nothing-pure.jpg")

prompts = [
    {
        "name": "01-same-weight-italic",
        "prompt": """Redesign "Well Suited" as a wordmark where both words are the SAME weight.
No contrast between the two words — same size, same weight, same style. Both in elegant italic serif.
The beauty comes from the letterforms themselves, not from making one word lighter than the other.
Think of how "Celine" or "Saint Laurent" uses one consistent weight across the whole wordmark.
Warm charcoal (#3a3530) on off-white (#faf8f4). No period, no accent color, no decoration.
High-contrast Didot/Bodoni italic letterforms. Clean flat background."""
    },
    {
        "name": "02-same-weight-upright",
        "prompt": """Design "Well Suited" as an upright (non-italic) serif wordmark. Both words same weight.
A beautiful high-contrast modern serif — Didot or Bodoni style but upright, not slanted.
Both words identical in weight and size. The mark is perfectly balanced and symmetrical.
Warm charcoal (#3a3530) on off-white (#faf8f4). No period, no accent, no decoration.
Clean flat background. Think of how Vogue or Harper's Bazaar sets their masthead —
confident, uniform weight, the typeface does all the work."""
    },
    {
        "name": "03-all-caps-elegant",
        "prompt": """Design "WELL SUITED" in all capitals, same weight, elegant serif.
Both words in the same refined serif typeface at the same weight. Generous letter-spacing.
This should feel like a fashion house name engraved on a storefront — Cartier, Chanel, Hermès.
Warm charcoal (#3a3530) on off-white (#faf8f4). No period, no accent color.
Clean flat background. The elegance comes from the spacing and the quality of the letterforms,
not from mixing weights or adding decoration."""
    },
    {
        "name": "04-lowercase-same",
        "prompt": """Design "well suited" in all lowercase, same weight throughout.
A refined serif italic — same size, same weight for both words. Lowercase feels modern and approachable.
Think of how "céline" (old logo) or "the row" uses lowercase — quiet confidence.
Warm charcoal (#3a3530) on off-white (#faf8f4). No period, no accent, no decoration.
Clean flat background. The lowercase and the quality of the italic letterforms are the entire design."""
    },
    {
        "name": "05-one-word",
        "prompt": """Design "WellSuited" as ONE word — no space between Well and Suited.
Both parts same weight, same italic serif style. The capital S in the middle is the only visual break.
Think of how "YouTube" or "WordPress" join two words with a mid-cap.
Warm charcoal (#3a3530) on off-white (#faf8f4). No period, no accent.
Beautiful high-contrast italic serif letterforms. Clean flat background.
This reads as one brand name, not two separate words."""
    },
    {
        "name": "06-condensed-same",
        "prompt": """Design "Well Suited" in a condensed serif at the same weight for both words.
Slightly narrower letterforms than normal — condensed but still elegant, not compressed.
Both words identical weight and style. The condensed proportions give it a fashion-editorial feel.
Think of how magazine headlines use condensed serifs — they feel urgent and sophisticated.
Warm charcoal (#3a3530) on off-white (#faf8f4). No period, no accent, no decoration.
Clean flat background."""
    },
    {
        "name": "07-geometric-same",
        "prompt": """Design "Well Suited" in a geometric sans-serif at the same weight for both words.
Something clean and modern — Futura-esque or like the COS logo. Same weight, same size.
This is a different direction — less editorial serif, more minimalist fashion brand.
Warm charcoal (#3a3530) on off-white (#faf8f4). No period, no accent.
Clean flat background. Sometimes the most modern thing is a perfectly set sans-serif."""
    },
    {
        "name": "08-terracotta-ll-same-weight",
        "prompt": """Design "WellSuited" as one word in italic serif — same weight throughout.
The "ll" where the two words meet is in terracotta (#c4725c), everything else in charcoal (#3a3530).
Both halves of the word are the same weight and size — the terracotta ll is the only design element.
It's a subtle brand mark hidden inside the name — the bridge between Well and Suited.
Off-white (#faf8f4) background. Clean flat, no texture. Beautiful high-contrast italic serif."""
    },
]

os.makedirs("/Users/nc/weatherwear/logo-concepts/gemini/well-suited-v4", exist_ok=True)

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
                path = f"/Users/nc/weatherwear/logo-concepts/gemini/well-suited-v4/{p['name']}.jpg"
                img.save(path)
                print(f"  Saved: {path}")
            elif part.text:
                print(f"  Text: {part.text[:100]}")
    except Exception as e:
        print(f"  Error: {e}")

print("\nDone!")
