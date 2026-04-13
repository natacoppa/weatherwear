import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

prompts = [
    {
        "name": "elegant-wordmark",
        "prompt": """Design a brandmark/wordmark logo for "What to Weather" — a fashion-meets-weather app.
The words "What to Weather" must be clearly readable. This should feel like a high-end fashion brand logo, not a weather app.
Think Aesop, COS, or The Row — editorial, warm, sophisticated.
Use warm earth tones: charcoal (#3a3530), terracotta (#c4725c), and warm cream (#faf8f4).
The text should have some design treatment — custom letterforms, ligatures, or subtle visual flourish — not just a plain font.
Clean background, no icons, no weather symbols, no clothing illustrations. Pure typography with character.
Deliver on a clean off-white (#faf8f4) background."""
    },
    {
        "name": "custom-lettering",
        "prompt": """Create a hand-lettered style wordmark for "What to Weather".
This is a premium fashion/weather lifestyle brand. The lettering should feel bespoke and crafted —
like it was drawn by a type designer, not generated from a font.
Mix of weights: "what to" lighter/smaller, "Weather" bolder/larger.
Color palette: deep warm charcoal and terracotta/rust accent.
No icons, no illustrations — pure lettering craft.
On a clean off-white cream background.
Think of how brands like Kinfolk, Cereal magazine, or Aesop approach their wordmarks."""
    },
    {
        "name": "modern-serif",
        "prompt": """Design a modern serif wordmark logo that says "What to Weather".
The logo should feel like a luxury editorial brand — similar to how Vogue or W Magazine treats their masthead.
"What to" should be secondary (smaller, lighter), and "Weather" should be the hero word with distinctive serif letterforms.
Include a subtle terracotta (#c4725c) accent — maybe a dot, a stroke, or a color on one letter.
The rest in deep warm charcoal (#3a3530).
Background: clean cream/off-white (#faf8f4).
No imagery, no icons. This is a wordmark that could go on a tote bag or the cover of a magazine."""
    },
    {
        "name": "stacked-editorial",
        "prompt": """Design a stacked wordmark logo: "WHAT TO" on top, "Weather" below, bigger.
This is for a fashion-forward weather styling app.
The design should feel editorial and premium — imagine it printed on the cover of a style guide or embossed on leather.
"WHAT TO" in a clean, spaced-out uppercase. "Weather" in an elegant serif with personality.
Use warm charcoal (#3a3530) with a terracotta rust (#c4725c) accent somewhere subtle.
Clean off-white (#faf8f4) background. No icons or illustrations.
Think Kinfolk meets Monocle magazine branding."""
    },
    {
        "name": "condensed-bold",
        "prompt": """Create a bold, condensed wordmark for "What to Weather" — all on one line.
This is a fashion/lifestyle brand, not a weather app. The type should have presence and personality.
Mix condensed and regular widths, or mix serif and sans-serif in an intentional way.
Warm earth tones: primary in charcoal (#3a3530), with terracotta (#c4725c) used on one word or element.
The wordmark should work at both large scale (hero section) and small (nav bar).
Clean off-white (#faf8f4) background. No icons, no imagery — just beautiful type design."""
    },
    {
        "name": "lowercase-refined",
        "prompt": """Design a refined lowercase wordmark: "what to weather".
All lowercase, but with custom letterforms that give it soul — maybe the 'w' has a distinctive shape,
or the 't' crosses connect, or there's a subtle ligature.
This is for an upscale fashion/weather styling brand. Think of how brands like 'ssense' or 'cos' or 'totême'
use lowercase wordmarks with distinctive character.
Warm charcoal (#3a3530) with a single terracotta (#c4725c) accent detail.
On clean off-white (#faf8f4) background. No icons, no imagery."""
    },
]

os.makedirs("/Users/nc/weatherwear/logo-concepts/gemini", exist_ok=True)

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
                path = f"/Users/nc/weatherwear/logo-concepts/gemini/{p['name']}.jpg"
                img = part.as_image()
                img.save(path)
                print(f"  Saved: {path}")
            elif part.text:
                print(f"  Text: {part.text[:100]}")
    except Exception as e:
        print(f"  Error: {e}")

print("\nDone!")
