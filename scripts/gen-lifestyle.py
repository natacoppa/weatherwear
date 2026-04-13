import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

prompts = [
    {
        "name": "01-morning-coffee",
        "prompt": """Fashion lifestyle photograph: A woman walking out the front door of a warm-toned apartment
holding a coffee, wearing a perfectly styled autumn morning outfit — oatmeal knit, wide-leg trousers, suede loafers.
Golden morning light catching her from the side. Shot on 35mm film, natural grain, warm color palette.
Editorial fashion photography style, not posed — caught mid-stride. Warm earth tones throughout.""",
        "ratio": "4:5"
    },
    {
        "name": "02-city-walk",
        "prompt": """Fashion street photography: A person walking through a sunlit city street,
styled in a rust-colored linen blazer over white tee, dark denim, clean sneakers.
Architecture blurred in background. Shot in warm natural light, editorial style.
Candid moment, confident stride. Earth tones, golden hour feel. 35mm film aesthetic.""",
        "ratio": "3:4"
    },
    {
        "name": "03-rainy-day",
        "prompt": """Fashion lifestyle photograph: Close-up of a person from the waist down on a rainy Paris street.
Wearing perfectly curated rain outfit — dark trench coat visible at top, tailored dark pants,
Chelsea boots on wet cobblestones. Umbrella casting soft shadow. Moody but warm tones.
Editorial fashion photography, shot on medium format film. Beautiful in the rain.""",
        "ratio": "4:5"
    },
    {
        "name": "04-warm-layers",
        "prompt": """Fashion flat-lay photograph from above: A beautifully arranged outfit laid on cream linen bedding.
Terracotta cashmere sweater, olive wide-leg pants, tan leather belt, gold minimal jewelry, white sneakers.
Styled like a fashion magazine spread. Warm natural daylight from a window.
Soft shadows, earthy warm palette. Shot on film, slight grain.""",
        "ratio": "1:1"
    },
    {
        "name": "05-beach-sunset",
        "prompt": """Fashion lifestyle photograph: A woman standing on a beach boardwalk at golden hour,
wearing a flowing white linen dress with a denim jacket draped over shoulders.
Wind catching the fabric slightly. Warm sunset tones, sand and ocean blurred behind.
Editorial fashion photography, natural and effortless. Warm earth and golden tones.""",
        "ratio": "3:4"
    },
    {
        "name": "06-winter-styled",
        "prompt": """Fashion street photography: A person in a perfectly styled winter outfit —
charcoal wool coat, burgundy scarf, dark denim, leather boots — walking through a city
with bare trees and soft overcast light. Breath slightly visible in cold air.
Shot on 35mm film, cool-warm contrast. Editorial candid style.""",
        "ratio": "4:5"
    },
]

os.makedirs("/Users/nc/weatherwear/public/lifestyle", exist_ok=True)

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
