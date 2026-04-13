import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# ═══ NYC — FUNKIER, DOWNTOWN COOL ═══
# Outfit: butter yellow cashmere turtleneck, oversized vintage cognac leather trench,
# wide-leg chocolate pinstripe wool trousers, chunky black leather platform loafers,
# vintage oxblood/burgundy leather tote
nyc_outfit = """The outfit: a butter-yellow cashmere turtleneck sweater, an oversized vintage cognac/tobacco brown leather trench coat (knee-length, softly rumpled), wide-leg chocolate brown pinstripe wool trousers, chunky black leather platform loafers, and a vintage oxblood/burgundy leather shoulder bag.
The woman is in her late 20s/early 30s, warm brown hair worn loose with a slight messy texture, confident downtown-NYC editor energy."""

# ═══ TOKYO — KHAITE/THE ROW QUIET LUXURY ═══
# Outfit: cream cashmere crewneck, long oatmeal double-breasted wool coat,
# tailored camel high-waisted wool trousers, minimalist dark brown leather slides,
# small structured chocolate leather top-handle bag
tokyo_outfit = """The outfit: a cream/ivory cashmere crewneck sweater, a long oatmeal/bone double-breasted wool coat (past the knee, architectural silhouette), tailored camel/tan high-waisted wool trousers with a clean break, minimalist dark brown leather flat slides or loafers, and a small structured chocolate brown leather top-handle bag.
The woman is in her late 20s/early 30s, dark hair in a low bun or sleek waves, quiet confidence, Khaite/The Row aesthetic — impeccable fit, neutral richness, expensive simplicity."""

prompts = [
    # NYC
    {
        "name": "nyc/nyc-morning",
        "prompt": f"""Fashion editorial photograph: A woman walking out of a downtown Manhattan building on a bright morning.
{nyc_outfit}
She is wearing ALL layers — turtleneck visible at neckline, cognac leather trench buttoned or open, wide-leg trousers, platform loafers.
Holding a takeaway coffee. Downtown Manhattan — maybe Tribeca cast-iron buildings or SoHo cobblestones — behind her, softly blurred.
Shot on 35mm film, warm natural grain, late morning light. Editorial downtown NYC cool-girl energy. Full body shot.""",
        "ratio": "4:5"
    },
    {
        "name": "nyc/nyc-midday",
        "prompt": f"""Fashion editorial photograph: The SAME woman from earlier at midday in downtown NYC — sunny street, brighter light.
{nyc_outfit}
She has TAKEN OFF the cognac leather trench coat — it's draped over her arm or tied around her waist/shoulders.
Now wearing just the butter-yellow turtleneck, chocolate pinstripe trousers, and platform loafers. Sunglasses on, confident stride.
Walking through a sunny downtown NYC street. Shot on 35mm film, warm golden tones. Editorial candid street style, full body walking shot.""",
        "ratio": "3:4"
    },
    {
        "name": "nyc/nyc-evening",
        "prompt": f"""Fashion editorial photograph: The SAME woman at golden hour in NYC — rooftop or High Line with Manhattan skyline behind.
{nyc_outfit}
She has put the cognac leather trench BACK ON because wind picked up. She has ALSO added a silk scarf (deep burgundy or olive-printed) tied loosely at her neck.
Long shadows, warm sunset light catching the trench leather. Wind in her hair.
Shot on 35mm film, cinematic golden hour tones. Three-quarter or full body shot.""",
        "ratio": "4:5"
    },
    {
        "name": "nyc/nyc-detail",
        "prompt": f"""Fashion editorial detail photograph: Close-up / cropped torso shot on a NYC cobblestone street.
Focus on texture details: the cognac leather trench coat lapel, the butter-yellow cashmere turtleneck at the neckline, a silk scarf in deep burgundy with olive print tied loosely, bare hands (no gloves — it's spring) holding a takeaway coffee cup, vintage oxblood leather tote at the side.
Shot from chest level or slightly lower, showing the leather, the knit, the scarf. Downtown NYC buildings softly blurred behind.
Bright morning light, natural 35mm film grain. Editorial fashion photography — rich texture mixing, warm palette.""",
        "ratio": "1:1"
    },
    {
        "name": "nyc/nyc-flatlay",
        "prompt": f"""Overhead flat-lay photograph of a complete NYC outfit laid out beautifully on a neutral linen bedspread.
The items: an oversized cognac/tobacco brown leather trench coat (laid open, slightly rumpled with visible texture),
a butter-yellow cashmere turtleneck sweater (folded neatly), wide-leg chocolate brown pinstripe wool trousers (folded),
chunky black leather platform loafers (side by side), a silk scarf in deep burgundy with subtle pattern (loosely looped),
a small vintage oxblood leather shoulder bag.
Every item visible and arranged with care like a fashion magazine editorial. Shot from directly above.
Warm natural daylight, soft shadows. Color palette: cognac, butter-yellow, chocolate brown, oxblood, black.
Downtown NYC editor vibe — funky, textural, not minimalist.""",
        "ratio": "1:1"
    },
    # Tokyo — Khaite/Row
    {
        "name": "tokyo-trip",
        "prompt": f"""Editorial travel fashion photograph: Quiet Tokyo side street in late afternoon, golden warm light,
minimalist architecture (maybe concrete or traditional wood storefronts), a few maple leaves turning orange.
A stylish woman walks toward or slightly past camera (not away — we should see her clearly from the side or front).
{tokyo_outfit}
She's carrying the leather top-handle bag in one hand, walking with quiet confidence.
Shot on medium format film, editorial travel magazine style. Warm, cinematic, peaceful, luxurious quiet.
No signage text visible. Color palette: cream, oatmeal, camel, tan, warm earth tones.
Khaite / The Row aesthetic — architectural tailoring, expensive simplicity, neutral richness.
Important: The coat and clothing must be clearly worn correctly from the FRONT or SIDE view — not from behind.""",
        "ratio": "16:9"
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
                path = f"/Users/nc/weatherwear/public/lifestyle/{p['name']}.jpg"
                img.save(path)
                print(f"  Saved: {path}")
    except Exception as e:
        print(f"  Error: {e}")

print("\nDone!")
