from pydantic import BaseModel, Field
from typing import List, Optional

class AudioSegment(BaseModel):
    # Use float for precision in seconds
    start_time: float = Field(..., alias="from")
    end_time: float = Field(..., alias="to")

    class Config:
        populate_by_name = True

class Translation(BaseModel):
    locale: str
    content: str

class LyricItem(BaseModel):
    id: str
    translations: List[Translation]
    tts: str
    audio: AudioSegment

class References(BaseModel):
    full_translations: List[Translation] = Field(..., alias="fullTranslations")

    class Config:
        populate_by_name = True

class Note(BaseModel):
    id: str
    title: str
    # song: str # uuid
    audio: AudioSegment
    lyrics: List[LyricItem]
    references: References

    @classmethod
    def create(cls, id: str, title: str, duration: float):
        audio : AudioSegment = AudioSegment(start_time=0, end_time=duration)
        lyrics = []
        references : References = References(fullTranslations=[])
        return cls(id=id, title=title, audio=audio, lyrics=lyrics, references=references)