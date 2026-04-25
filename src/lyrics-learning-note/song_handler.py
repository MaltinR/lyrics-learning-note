import os
import uuid
from pathlib import Path

from pydantic import HttpUrl
from fastapi import HTTPException
from fastapi.responses import FileResponse

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
    
    song_path.write_text(new_note.model_dump_json(), encoding="utf-8")

    return new_note

async def new_song(url: HttpUrl):
    audio_bytes : bytes
    metadata : SongMetadata
    audio_bytes, metadata = await download(url)
    
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

    return note

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