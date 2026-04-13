import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# One cohesive outfit story: rust cotton tee, oatmeal linen overshirt, sand wide-leg trousers, tan suede loafers
# This matches the outfit card data on the landing page

outfit_desc = """The outfit is: rust/terracotta cotton t-shirt, oatmeal/cream linen overshirt worn open,
sand/tan wide-leg linen trousers, and tan suede loafers. Gold minimal jewelry. The person is a stylish
woman in her late 20s with warm brown hair. The setting is a warm coastal city like Los Angeles."""

prompts = [
    {
        "name": "morning-walk-out",
        "prompt": f"""Fashion editorial photograph: A woman walking out of a warm-toned apartment building at 7am,
golden morning light. She is wearing ALL layers — {outfit_desc}
The overshirt is on, buttoned casually. Coffee in hand. Cool morning energy.
Shot on 35mm film, warm tones, natural grain. Candid editorial style. Full body shot.""",
        "ratio": "4:5"
    },
    {
        "name": "midday-sun",
        "prompt": f"""Fashion editorial photograph: The SAME woman at midday, bright warm sunlight on a city street.
She has TAKEN OFF the overshirt — it's tied around her waist or draped over her bag.
Now wearing just the rust/terracotta cotton t-shirt with the sand wide-leg linen trousers and tan suede loafers.
Sunglasses on. Confident, warm, sun-soaked. Shot on 35mm film, golden tones. Full body walking shot.""",
        "ratio": "3:4"
    },
    {
        "name": "evening-layers",
        "prompt": f"""Fashion editorial photograph: The SAME woman at sunset/golden hour near the ocean or on a rooftop.
She has put the oatmeal linen overshirt BACK ON because it's cooling down.
Wearing the full outfit again: rust tee, oatmeal overshirt, sand trousers, tan loafers.
Wind catching the overshirt slightly. Warm sunset light, slightly cooler mood.
Shot on 35mm film, golden hour tones. Three-quarter or full body shot.""",
        "ratio": "4:5"
    },
    {
        "name": "flat-lay",
        "prompt": f"""Overhead flat-lay photograph of a complete outfit laid out beautifully on cream linen bedding.
The items: a rust/terracotta cotton t-shirt, an oatmeal/cream linen overshirt, sand/tan wide-leg linen trousers,
tan suede loafers, a tan leather belt, gold minimal earrings and a delicate necklace on a small dish,
and sunglasses. Everything arranged with care like a fashion magazine spread.
Warm natural daylight from a window. Soft shadows. Shot from directly above.
The color palette is warm earth tones: rust, oatmeal, sand, tan, gold.""",
        "ratio": "1:1"
    },
]

os.makedirs("/Users/nc/weatherwear/public/lifestyle/day", exist_ok=True)

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
                path = f"/Users/nc/weatherwear/public/lifestyle/day/{p['name']}.jpg"
                img.save(path)
                print(f"  Saved: {path}")
            elif part.text:
                print(f"  Text: {part.text[:100]}")
    except Exception as e:
        print(f"  Error: {e}")

print("\nDone!")
