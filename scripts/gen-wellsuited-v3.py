import os
from google import genai
from google.genai import types
from PIL import Image

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# Load v2c (high contrast) as the base reference — best letterforms
ref = Image.open("/Users/nc/weatherwear/logo-concepts/gemini/well-suited-v2/v2c-high-contrast.jpg")

prompts = [
    {
        "name": "01-no-period-clean",
        "prompt": """Refine this "Well Suited" brandmark. Remove the terracotta period entirely.
Just the two words in this beautiful high-contrast italic serif — no punctuation, no accent marks, no extra elements.
Let the letterforms speak for themselves. The thick/thin contrast of the Didot-style italic is the brand.
"Well" slightly lighter weight, "Suited" slightly bolder. All in warm charcoal (#3a3530).
Clean flat off-white (#faf8f4) background, no texture, no mockup, no shadows.
This should feel like a luxury fashion house wordmark — confident enough to need nothing else."""
    },
    {
        "name": "02-no-period-tighter",
        "prompt": """Refine this "Well Suited" brandmark. Remove the period. Tighten the letter-spacing.
The two words should sit closer together — almost touching but not quite.
Same high-contrast italic serif letterforms. Warm charcoal (#3a3530) on off-white (#faf8f4).
No period, no accent, no extra elements. Just beautiful type, tightly set.
Flat clean background. Think of how Celine or Phoebe Philo's brand sets type — tight, deliberate, no decoration."""
    },
    {
        "name": "03-underline-accent",
        "prompt": """Refine this "Well Suited" brandmark. Replace the terracotta period with a thin terracotta underline.
A single elegant horizontal line in terracotta (#c4725c) running underneath "Suited" only — not the full wordmark.
The line should be thin and refined, like a subtle highlight or an editorial rule.
Same high-contrast italic serif letterforms in warm charcoal (#3a3530).
Clean flat off-white (#faf8f4) background, no texture, no mockup.
The underline should feel intentional and minimal — like an editor's mark."""
    },
    {
        "name": "04-letter-accent",
        "prompt": """Refine this "Well Suited" brandmark. Remove the period.
Instead, make the dot of the letter "i" in "Suited" terracotta (#c4725c). Everything else stays warm charcoal (#3a3530).
This is the only color accent in the entire mark — subtle, almost hidden, but distinctive once you notice it.
Same high-contrast italic serif letterforms. Clean flat off-white (#faf8f4) background.
No period, no underline, no extra decoration. Just the colored tittle on the i.
Think of it like a tiny signature detail — the kind of thing that makes someone look twice."""
    },
    {
        "name": "05-swash-accent",
        "prompt": """Refine this "Well Suited" brandmark. Remove the period.
Instead, give the capital "W" in "Well" an extended swash or flourish that has a terracotta (#c4725c) stroke.
The swash should be elegant and restrained — not ornate, just a single beautiful curve extending from the W.
The rest of the letterforms stay in warm charcoal (#3a3530).
Same high-contrast italic serif style. Clean flat off-white (#faf8f4) background, no texture.
The terracotta swash becomes the brand's signature detail — like a brushstroke or a tailor's mark."""
    },
    {
        "name": "06-nothing-pure",
        "prompt": """Redesign "Well Suited" as a pure wordmark with zero accent color. No terracotta anywhere.
All warm charcoal (#3a3530) on off-white (#faf8f4). No period. No colored elements. No decoration.
Ultra-refined high-contrast italic serif — Didot or Bodoni style with beautiful thick/thin strokes.
"Well" in a lighter weight, "Suited" in a heavier weight. The weight difference IS the design.
Clean flat background. This is the most minimal possible version — just two words that look incredible.
If the type is good enough, you don't need anything else. Prove it."""
    },
    {
        "name": "07-ligature",
        "prompt": """Refine this "Well Suited" brandmark. Remove the period.
Create a custom ligature where the "ll" at the end of "Well" connects elegantly to the "S" of "Suited".
The two words become visually linked through this one connection point.
The ligature stroke can be in terracotta (#c4725c) — it's the bridge between the two words.
Rest of the letterforms in warm charcoal (#3a3530). High-contrast italic serif style.
Clean flat off-white (#faf8f4) background. No other decoration.
This single ligature becomes the brand's ownable mark — no one else has this exact connection."""
    },
    {
        "name": "08-crossbar",
        "prompt": """Refine this "Well Suited" brandmark. Remove the period.
Add a thin horizontal terracotta (#c4725c) line that passes through both words at their midpoint —
like a crossbar or a tailor's measuring line. It should be very thin and elegant.
The line suggests precision, measurement, being perfectly fitted — all meanings of "suited."
Letterforms in warm charcoal (#3a3530), high-contrast italic serif.
Clean flat off-white (#faf8f4) background. The crossbar is the only accent element."""
    },
]

os.makedirs("/Users/nc/weatherwear/logo-concepts/gemini/well-suited-v3", exist_ok=True)

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
                path = f"/Users/nc/weatherwear/logo-concepts/gemini/well-suited-v3/{p['name']}.jpg"
                img.save(path)
                print(f"  Saved: {path}")
            elif part.text:
                print(f"  Text: {part.text[:100]}")
    except Exception as e:
        print(f"  Error: {e}")

print("\nDone!")
