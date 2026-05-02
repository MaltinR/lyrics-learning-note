import os
import uuid
import json
import shutil
from pathlib import Path

from pydantic import HttpUrl
from fastapi import HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse

from song_providers.song_process import download
from song_providers.song_metadata import SongMetadata
from notes.note import Note
from notes.note_list_info import NoteListInfo

async def get_all_songs() -> list[NoteListInfo]:
    songs_path = Path(os.path.join("data", "songs"))

    out_list : list[NoteListInfo] = []

    for file in songs_path.iterdir():
        if file.is_file() and str(file).endswith(".json"):
            try:
                json_content = file.read_text(encoding="utf-8")
                note = Note.model_validate_json(json_content)
                note_info = NoteListInfo.from_note(note)
                out_list.append(note_info)
            except Exception as e: 
                print(f"File ({str(file)}) is not readable: {e}")
                continue

    return out_list

async def get_song(id: str):
    song_path = Path(os.path.join("data", "songs", f"{id}.json"))
    if not song_path.exists():
        raise HTTPException(status_code=404, detail="Song not found")
    json_content = song_path.read_text(encoding="utf-8")
    note = Note.model_validate_json(json_content)
    return note


async def edit_song(id: str, new_note: Note):
    if new_note.id != id:
        raise Exception("Incorrect id")
    song_path = Path(os.path.join("data", "songs", f"{id}.json"))
    if not song_path.exists():
        raise HTTPException(status_code=404, detail="Song not found")
    
    json_content = song_path.read_text(encoding="utf-8")
    old_note = Note.model_validate_json(json_content)
    
    def get_tts_list(note: Note):
        return [item.tts for item in note.lyrics if item.tts is not None]

    # remove unused tts
    old_tts = set(get_tts_list(old_note))
    new_tts = set(get_tts_list(new_note))
    
    unused_tts = old_tts - new_tts
    for tts_id in unused_tts:
        tts_path = Path(os.path.join("data", "tts", id, f"{tts_id}.mp3"))
        tts_path.unlink()
    
    song_path.write_text(new_note.model_dump_json(), encoding="utf-8")

    return new_note

async def new_song(url: HttpUrl, request: Request):
    def to_sse(data: str):
        return f"data: {data}\n\n"

    def error(message: str):
        return to_sse(json.dumps({
            "type": "error",
            "error": message
        }))

    def update(message: str):
        return to_sse(json.dumps({
            "type": "update",
            "update": message
        }))
    
    def complete(note: Note):
        return to_sse(json.dumps({
            "type": "note",
            "note": note.model_dump(),
        }))

    async def process(url: HttpUrl):
        audio_bytes : bytes
        metadata : SongMetadata

        try:
            yield update("Downloading media")

            audio_bytes, metadata = await download(url)
            
            if await request.is_disconnected():
                raise Exception("User disconnected")

            yield update("Storing data")
            id = str(uuid.uuid4())

            audio_dir_name = os.path.join("data", "audios")
            audio_file_path = os.path.join(audio_dir_name, f"{id}.mp3")
            if not os.path.exists(audio_dir_name):
                os.makedirs(audio_dir_name)
            with open(audio_file_path, "wb") as f:
                f.write(audio_bytes)

            note : Note = Note.create(id, metadata.title, metadata.duration_seconds)

            note_dir_name = os.path.join("data", "songs")
            json_note = note.model_dump_json()
            note_file_path = os.path.join(note_dir_name, f"{id}.json")
            if not os.path.exists(note_dir_name):
                os.makedirs(note_dir_name)
            with open(note_file_path, "w", encoding="utf-8") as f:
                f.write(json_note)

            if await request.is_disconnected():
                try:
                    os.remove(note_file_path)
                except Exception as e:
                    print(f"Error removing note file: {e}")
                try:
                    os.remove(note_file_path)
                except Exception as e:
                    print(f"Error removing note file: {e}")
                raise Exception("User disconnected")
            yield complete(note)
        except Exception as e:
            yield error(str(e))
    
    return StreamingResponse(process(url), media_type="text/event-stream")
    # return note

async def delete_song(id: str):
    json_path = Path(os.path.join("data", "songs", f"{id}.json"));
    audio_path = Path(os.path.join("data", "audios", f"{id}.mp3"));
    tts_path = Path(os.path.join("data", "tts", f"{id}"));
    # json
    if json_path.is_file():
        json_path.unlink()
    # audios
    if audio_path.is_file():
        audio_path.unlink()
    # tts
    if tts_path.is_dir():
        shutil.rmtree(tts_path)

async def download_song(id: str) -> FileResponse:
    filename = f"{id}.mp3"
    audio_path = Path(os.path.join("data", "audios", filename))
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=audio_path,
        media_type="audio/mpeg",
        filename=filename
    )