import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# Classic NY — Carolyn Bessette-coded minimal black elegance
# Outfit: black cashmere turtleneck, long tailored black wool overcoat,
# slim straight-leg dark indigo jeans, black leather Chelsea boots, ivory/cream leather tote
classic_outfit = """The outfit: a black cashmere fine-knit turtleneck, a long tailored black wool overcoat (knee-length, structured),
slim straight-leg dark indigo jeans (raw hem, clean), black leather Chelsea boots, and a cream/ivory soft leather tote bag
(the only non-black element).
The woman is in her late 20s/early 30s with warm brown hair worn sleek and straight or in a low ponytail.
Classic New York minimalist elegance — think Carolyn Bessette-Kennedy. Effortless, understated, quietly expensive."""

prompts = [
    {
        "name": "nyc-morning",
        "prompt": f"""Fashion editorial photograph: A woman walking out of a classic Tribeca or Upper East Side building in the morning.
{classic_outfit}
She is wearing ALL layers — turtleneck visible at neckline, black wool coat buttoned, jeans, Chelsea boots.
Holding the cream leather tote in one hand, possibly a takeaway coffee in the other. Clean Manhattan street in background, softly blurred.
Slight morning chill, bright spring light. Shot on 35mm film, crisp tones, natural grain.
Editorial, effortless, NYC minimalist — high contrast of black on warm cream stone buildings. Full body shot.""",
        "ratio": "4:5"
    },
    {
        "name": "nyc-midday",
        "prompt": f"""Fashion editorial photograph: The SAME woman at midday walking through sunny Manhattan.
{classic_outfit}
She has TAKEN OFF the black wool coat — it's draped over one arm, or carried over the tote bag.
Now wearing just the black turtleneck, slim dark jeans, and Chelsea boots. Sunglasses on, confident stride.
Bright midday sun, walking past classic NY architecture — maybe Madison Avenue or Park Avenue limestone buildings.
Shot on 35mm film, clean editorial tones. Full body walking shot — timeless NY style.""",
        "ratio": "3:4"
    },
    {
        "name": "nyc-evening",
        "prompt": f"""Fashion editorial photograph: The SAME woman at golden hour / early evening on a Manhattan rooftop or terrace with NYC skyline behind.
{classic_outfit}
She has put the long black wool coat BACK ON because wind has picked up.
Slight breeze in her hair, coat catching the evening light. Clean silhouette against the sunset sky.
Warm golden hour light hitting the black wool, contrasting with the sky.
Shot on 35mm film, cinematic, editorial. Three-quarter body shot.""",
        "ratio": "4:5"
    },
    {
        "name": "nyc-detail",
        "prompt": f"""Fashion editorial detail photograph: Close-up torso/midsection shot on a Manhattan street.
Focus on texture details: the fine black cashmere turtleneck at the neckline, the structured lapel of the black wool overcoat,
the cream leather tote bag held at the side or over shoulder, bare hands (no gloves — it's spring) holding a takeaway coffee.
Shot from chest level, showing the contrast of black cashmere, black wool, cream leather, and skin tones.
Classic Manhattan limestone buildings softly blurred behind. Bright morning light, natural 35mm film grain.
Editorial fashion photography — quiet luxury, timeless minimal elegance, NYC uniform done right.""",
        "ratio": "1:1"
    },
    {
        "name": "nyc-flatlay",
        "prompt": f"""Overhead flat-lay photograph of a classic minimalist NYC outfit laid out on a cream linen bedspread.
The items: a long tailored black wool overcoat (laid open with clean lines visible),
a black cashmere fine-knit turtleneck (folded),
slim straight-leg dark indigo jeans (folded flat),
black leather Chelsea boots (side by side, polished),
a soft cream/ivory leather tote bag, and a pair of tortoiseshell sunglasses.
Every item visible and arranged with care like a fashion magazine editorial. Shot from directly above.
Warm natural daylight, soft shadows. Color palette: black, cream, dark indigo, tortoiseshell.
Classic NYC minimalist — the uniform of a Manhattan editor or gallery director.""",
        "ratio": "1:1"
    },
]

os.makedirs("/Users/nc/weatherwear/public/lifestyle/nyc", exist_ok=True)

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
                path = f"/Users/nc/weatherwear/public/lifestyle/nyc/{p['name']}.jpg"
                img.save(path)
                print(f"  Saved: {path}")
    except Exception as e:
        print(f"  Error: {e}")

print("\nDone!")
