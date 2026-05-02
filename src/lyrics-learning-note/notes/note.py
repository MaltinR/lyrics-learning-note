from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from pydantic.alias_generators import to_camel

class AudioSegment(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True, # Allows using snake_case in code
    )

    # Use float for precision in seconds
    start_time: float = Field(..., alias="from")
    end_time: float = Field(..., alias="to")

class Translation(BaseModel):
    lang: str
    content: str

class Explanation(BaseModel):
    lang: str
    content: str

class LyricItem(BaseModel):
    id: str
    text: str
    translations: List[Translation]
    explanations: List[Explanation]
    tts: Optional[str] = None
    audio: AudioSegment

class References(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True, # Allows using snake_case in code
    )

    full_lyrics: Optional[str] = None

class LanguageProfile(BaseModel):
    original: Optional[str] = None
    target: Optional[str] = None

class Note(BaseModel):
    id: str
    title: str
    singer: str
    # song: str # uuid
    audio: AudioSegment
    lyrics: List[LyricItem]
    language: LanguageProfile
    references: References

    @classmethod
    def create(cls, id: str, title: str, duration: float):
        audio : AudioSegment = AudioSegment(start_time=0, end_time=duration)
        lyrics = []
        singer = "Unknown"
        references : References = References(fullTranslations=[])
        language : LanguageProfile = LanguageProfile()
        return cls(id=id, title=title, singer=singer, audio=audio, lyrics=lyrics, language=language, references=references)