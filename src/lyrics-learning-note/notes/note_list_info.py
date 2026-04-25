from pydantic import BaseModel

from notes.note import Note

class NoteListInfo(BaseModel):
    id: str
    title: str

    @classmethod
    def from_note(cls, note: Note):
        return cls(id=note.id, title=note.title)