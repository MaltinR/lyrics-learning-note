from pydantic import BaseModel

from notes.note import Note

class NoteListInfo(BaseModel):
    id: str
    title: str
    singer: str
    duration: int

    @classmethod
    def from_note(cls, note: Note):
        return cls(id=note.id, title=note.title, singer=note.singer, duration=note.audio.end_time-note.audio.start_time)