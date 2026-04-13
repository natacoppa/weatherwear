import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=["""Editorial travel photograph: A quiet leafy Tokyo side street in early autumn,
warm golden afternoon light, traditional wooden storefronts and hanging noren curtains,
one stylish woman walking away from camera wearing a lightweight camel trench coat,
cream sweater, and dark jeans, carrying a small leather tote. Trees with leaves turning orange.
Soft focus, shot on medium format film, editorial travel magazine style. Warm, cinematic, peaceful.
No text or signage visible. Color palette: warm browns, cream, soft greens, muted tones."""],
    config=types.GenerateContentConfig(
        response_modalities=['TEXT', 'IMAGE'],
        image_config=types.ImageConfig(aspect_ratio="16:9", image_size="2K"),
    ),
)

for part in response.parts:
    if part.inline_data:
        img = part.as_image()
        img.save("/Users/nc/weatherwear/public/lifestyle/tokyo-trip.jpg")
        print("Saved Tokyo image")
