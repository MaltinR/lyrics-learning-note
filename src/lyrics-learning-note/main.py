from fastapi import FastAPI, APIRouter, Request
from dotenv import load_dotenv

from schemas import (
    NewSongRequest, 
    TranslateRequest, 
    ExplainRequest, 
    TtsRequest, 
    LyricsRequest, 
    LyricsSearchRequest, 
    DetectLangRequest
)
import song_handler
import translate_handler
import lyrics_handler
import explain_handler
import tts_handler
from notes.note import Note

app = FastAPI()

api_router = APIRouter(prefix="/api")

load_dotenv()

@api_router.get("/songs")
async def get_all_songs():
    list = await song_handler.get_all_songs()
    return list

@api_router.post("/songs")
async def new_song(req: NewSongRequest, request: Request):
    # note = await song_handler.new_song(req.url)
    # return note
    return await song_handler.new_song(req.url, request)


@api_router.put("/songs/{song_id}")
async def update_song(song_id: str, new_note: Note):
    note = await song_handler.edit_song(song_id, new_note)
    return note

@api_router.get("/songs/{song_id}")
async def get_song(song_id: str):
    note = await song_handler.get_song(song_id)
    return note

@api_router.delete("/songs/{song_id}")
async def delete_song(song_id: str):
    await song_handler.delete_song(song_id)
    return {
        "songId": song_id
    }

@api_router.get("/songs/{song_id}/audio")
async def download_song_audio(song_id: str):
    return await song_handler.download_song(song_id)

@api_router.post("/translate")
async def translate_text(req: TranslateRequest):
    return await translate_handler.translate_text(req.from_lang, req.content, req.to_lang)

@api_router.post("/explain")
async def explain_lyrics(req: ExplainRequest):
    return await explain_handler.explain_lyrics(
        req.from_lang, 
        req.to_lang, 
        req.lyrics_line, 
        req.full_lyrics)

@api_router.post("/detect-lang")
async def detect_lang(req: DetectLangRequest):
    print(req)
    return await translate_handler.detect_lang(req.full_lyrics)

@api_router.post("/tts")
async def process_tts(req: TtsRequest):
    return await tts_handler.process_tts(req.note_id, req.lang, req.content)

@api_router.get("/tts/{song_id}/{tts_id}")
async def download_tts(song_id: str, tts_id: str):
    return await tts_handler.download_tts(song_id, tts_id)

@api_router.post("/lyrics")
async def get_lyrics(req: LyricsRequest):
    return await lyrics_handler.get_lyrics(req.provider_id, req.song_id)

@api_router.post("/lyrics/search")
async def search_lyrics(req: LyricsSearchRequest):
    return await lyrics_handler.search_lyrics(req.keyword)

@api_router.get("/langs/from")
async def get_available_from_langs():
    return await translate_handler.get_available_from_langs()

@api_router.get("/langs/to")
async def get_available_to_langs():
    return await translate_handler.get_available_to_langs()

app.include_router(api_router)

print("Server is starting to run")


# uv run uvicorn main:app --port 3000