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

class SongMetadata(BaseModel):
    id: str
    title: str
    song: str
    audio: AudioSegment
    lyrics: List[LyricItem]
    references: References