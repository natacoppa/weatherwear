import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

prompts = [
    {
        "name": "creator-grid",
        "prompt": """Instagram story / fashion influencer outfit collage composition.
LEFT SIDE (40% of image): A candid mirror selfie or casual street photo of a stylish woman (late 20s, warm brown hair)
wearing a complete outfit — cream knit turtleneck, long black tailored wool coat, light wash straight-leg jeans,
and off-white leather mules. She's holding a small white leather shoulder bag. Shot in warm natural light on a
spring city street. Editorial candid, like something posted to a curated Instagram feed.

RIGHT SIDE (60% of image): Clean white background with floating product flat-lay shots arranged in a loose grid —
each item from her outfit shown individually:
1. The black wool tailored coat (full length, photographed head-on with crisp studio lighting)
2. The cream knit turtleneck sweater (flat, rumpled naturally)
3. The light wash straight-leg jeans (laid flat, photographed from above)
4. The off-white leather mules (photographed at an angle)
5. The white leather shoulder bag (floating)
All product shots styled like high-end e-commerce photography — clean white backgrounds, soft even lighting.

The entire composition should look like a fashion influencer's "shop my look" post — the casual lifestyle photo paired with individual shoppable product shots.
Color palette: black, cream, denim blue, off-white. Clean, editorial, curated.""",
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
