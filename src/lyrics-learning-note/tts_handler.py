import os
import uuid
from pathlib import Path

from fastapi.responses import Response, FileResponse
from fastapi import HTTPException

from tts_providers.tts_provider import TtsProvider
from tts_providers.google.gcloud_tts import GcloudTts

async def process_tts(note_id: str, lang: str, content: str):
    provider : TtsProvider = GcloudTts()
    audio = await provider.get_tts(lang=lang, content=content)
    
    tts_id = str(uuid.uuid4())

    tts_filename = f"{tts_id}.mp3"
    dir_name = os.path.join("data", "tts", note_id)
    tts_filepath = os.path.join(dir_name, tts_filename)

    if not os.path.exists(dir_name):
        os.makedirs(dir_name)
    with open(tts_filepath, "wb") as out:
        out.write(audio)

    return Response(
        audio,
        media_type="audio/mpeg",
        headers={"Content-Disposition": f"attachment; filename={tts_id}.mp3"}
    )

async def download_tts(note_id: str, tts_id: str):
    tts_filename = f"{tts_id}.mp3"
    dir_name = os.path.join("data", "tts", note_id)
    audio_path = Path(os.path.join(dir_name, tts_filename))

    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=audio_path,
        media_type="audio/mpeg",
        filename=tts_filename
    )