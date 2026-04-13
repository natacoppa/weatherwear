import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

prompts = [
    {
        "name": "creator-hero",
        "prompt": """Fashion editorial photograph in the style of a top Instagram/LTK creator's curated post.
Two stylish women in their late 20s/early 30s walking together on a sunny afternoon city street (could be LA, NYC, or Paris).
Each wearing a completely different, but equally intentional outfit — showing two styling approaches to the same warm-weather day.
Woman 1: cropped cream linen tank top, high-waisted terracotta silk midi skirt, tan minimalist sandals, small woven bag.
Woman 2: oversized white button-down shirt knotted at the waist, wide-leg dark wash denim, chunky white sneakers, crossbody leather bag.
Both confident, mid-stride, effortlessly styled — like they stepped out of a creator's weekly outfit roundup.
Warm golden hour light, soft shadows, blurred urban background. Shot on medium format film, natural grain, editorial quality.
Candid friendship energy. The palette: cream, terracotta, tan, white, denim blue.""",
        "ratio": "3:2"
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
