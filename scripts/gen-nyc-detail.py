import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

prompts = [
    {
        "name": "nyc-detail",
        "prompt": """Fashion editorial detail photograph: A woman's hands holding a takeaway coffee cup — BARE HANDS, bare skin, fingers visible, NO GLOVES, NO mittens, NO handwear of any kind. Her hands are uncovered.
She is wearing a charcoal wool overcoat, cream merino turtleneck at the neckline, and a deep burgundy/wine wool scarf with fringe draped over the coat.
A small black leather tote bag at her side.
Shot from chest level, you can see her bare fingers wrapped around the paper coffee cup.
West Village brick townhouses softly blurred in background. Spring morning light. 35mm film, natural grain.
Editorial fashion photography. IMPORTANT: The hands must be completely bare — skin visible, no gloves, mittens, or any hand covering.""",
        "ratio": "1:1"
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
                path = f"/Users/nc/weatherwear/public/lifestyle/nyc/{p['name']}.jpg"
                img.save(path)
                print(f"  Saved: {path}")
            elif part.text:
                print(f"  Text: {part.text[:100]}")
    except Exception as e:
        print(f"  Error: {e}")

print("\nDone!")
