from fastapi.responses import StreamingResponse

from explainers.explainer import Explainer
from explainers.google.gemini import Gemini

async def explain_lyrics(
        from_lang: str,
        to_lang: str,
        lyrics_line: str,
        full_lyrics: str
) -> StreamingResponse:
    explainer : Explainer = Gemini()

    async def generate():
        stream = explainer.explain(
            from_lang=from_lang,
            to_lang=to_lang,
            lyrics_line=lyrics_line,
            full_lyrics=full_lyrics)
        
        async for chunk in stream:
            if chunk:
                formatted_chunk = chunk.replace("\n", "\ndata: ")
                yield f"data: {formatted_chunk}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")