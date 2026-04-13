import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# NYC outfit: cream merino turtleneck, charcoal wool overcoat, dark indigo straight-leg jeans,
# black leather ankle boots. Evening adds burgundy scarf.
# Person: stylish woman in her late 20s/early 30s, warm brown hair.

base_outfit = """The outfit consists of: cream/ivory merino turtleneck sweater, charcoal/dark-grey wool overcoat
(tailored, knee-length), dark indigo straight-leg jeans, and black leather ankle boots.
The person is a stylish woman in her late 20s to early 30s with warm brown hair worn loose."""

prompts = [
    {
        "name": "nyc-morning",
        "prompt": f"""Fashion editorial photograph: A woman walking out onto a downtown New York City street in early morning.
{base_outfit}
She is wearing ALL the layers — turtleneck visible at the collar, wool overcoat buttoned or open, jeans, ankle boots.
Holding a takeaway coffee. Crisp morning light, slight breath visible in the cold. West Village-style brownstone buildings in the background.
Shot on 35mm film, warm-cool contrast, natural grain. Editorial candid style. Full body shot.""",
        "ratio": "4:5"
    },
    {
        "name": "nyc-midday",
        "prompt": f"""Fashion editorial photograph: The SAME woman at midday, walking through a sunny New York neighborhood.
{base_outfit}
She has TAKEN OFF the wool overcoat — it's draped over her arm or carried over her shoulder.
Now just in the cream turtleneck, dark indigo jeans, and black ankle boots. Sunglasses on, confident stride.
Warm sun between brownstone buildings, dappled light. Shot on 35mm film, warm golden tones.
Editorial street style, full body walking shot.""",
        "ratio": "3:4"
    },
    {
        "name": "nyc-evening",
        "prompt": f"""Fashion editorial photograph: The SAME woman at golden hour / early evening in New York City.
{base_outfit}
She has put the charcoal wool overcoat BACK ON because the wind has picked up.
She has ALSO added a deep burgundy/wine wool scarf wrapped around her neck, peeking out above the coat.
Walking on a rooftop with the NYC skyline in the background, or a Brooklyn bridge / High Line view.
Warm sunset light, slightly windy, scarf and hair catching the breeze.
Shot on 35mm film, cinematic golden hour tones. Three-quarter or full body shot.""",
        "ratio": "4:5"
    },
    {
        "name": "nyc-flatlay",
        "prompt": """Overhead flat-lay photograph of a complete outfit laid out beautifully on a neutral linen bedspread
or wooden surface. The items: a charcoal/dark-grey tailored wool overcoat (knee-length, laid open),
a cream/ivory merino turtleneck sweater (folded neatly), dark indigo straight-leg jeans (folded),
black leather ankle boots (side by side), a deep burgundy/wine wool scarf (softly looped),
black leather gloves (crossed), and a small black leather tote bag or key card.
Every item visible and arranged with care like a fashion magazine editorial. Shot from directly above.
Warm natural daylight, soft shadows. Color palette: charcoal, cream, indigo, black, burgundy.""",
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
            elif part.text:
                print(f"  Text: {part.text[:100]}")
    except Exception as e:
        print(f"  Error: {e}")

print("\nDone!")
