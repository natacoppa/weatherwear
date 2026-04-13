import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

prompts = [
    {
        "name": "howitworks-la",
        "prompt": """Fashion editorial photograph: A stylish woman in her late 20s walking across a sun-drenched Los Angeles sidewalk
at golden hour. She is wearing an oversized ivory silk blouse (loose, untucked), high-waisted olive wide-leg linen trousers,
and tan leather sandals. Gold hoop earrings, a thin gold necklace. Warm brown hair loose. She holds a small woven raffia bag.
Palm trees and a warm adobe/cream stucco building behind her, softly blurred. Late afternoon California sun casting long shadows.
Shot on medium format film, warm golden tones, soft natural grain. Editorial fashion photography —
candid, confident, effortless. The palette: olive, ivory, tan, gold, terracotta undertones. Full body or three-quarter shot.""",
        "ratio": "4:3"
    },
]

for p in prompts:
    print(f"Generating: {p['name']}...")
    try:
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[p["prompt"]],
            config=types.GenerateContentConfig(
                response_modalities=['TEXT', 'IMAGE'],
                image_config=types.ImageConfig(
                    aspect_ratio=p["ratio"],
                    image_size="2K"
                ),
            ),
        )
        for part in response.parts:
            if part.inline_data:
                img = part.as_image()
                path = f"/Users/nc/weatherwear/public/lifestyle/{p['name']}.jpg"
                img.save(path)
                print(f"  Saved: {path}")
            elif part.text:
                print(f"  Text: {part.text[:100]}")
    except Exception as e:
        print(f"  Error: {e}")

print("\nDone!")
