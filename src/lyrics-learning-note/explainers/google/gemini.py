import os
import json
from pathlib import Path
from typing import AsyncIterator

from google import genai
from google.genai import types

from explainers.explainer import Explainer

class Gemini(Explainer):
    async def explain(self, from_lang: str, to_lang: str, lyrics_line: str, full_lyrics: str) -> AsyncIterator[str]:
        prompt_path = Path(os.path.join("explainers", "default_prompt.md"))
        contents = prompt_path.read_text()

        contents = contents.replace("{{songLang}}", from_lang)
        contents = contents.replace("{{explainLang}}", to_lang)
        contents = contents.replace("{{lyricsLine}}", lyrics_line)
        contents = contents.replace("{{fullSongLyrics}}", full_lyrics)
        # contents = "How are you today?"

        api_key: str = os.getenv("GEMINI_KEY")
        client = genai.Client(api_key=api_key)

        config = types.GenerateContentConfig(
            temperature=0.5,
            thinking_config=types.ThinkingConfig(include_thoughts=False),
        )

        try:
            stream = await client.aio.models.generate_content_stream(
                model="gemini-2.5-flash",
                contents=contents,
                config=config
            )

            async for chunk in stream:
                print(chunk.text)
                if chunk.text:
                    yield json.dumps({
                        "type": "deltaText",
                        "deltaText": chunk.text,
                    })
        except Exception as e:
            yield json.dumps({
                "type": "error",
                "error": str(e),
            })