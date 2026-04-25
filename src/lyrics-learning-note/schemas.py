from pydantic import BaseModel, HttpUrl, ConfigDict
from pydantic.alias_generators import to_camel
from lyrics.lyrics_search_info import LyricsSearchInfo
from langs.lang_info import LangInfo

class NewSongRequest(BaseModel):
    url: HttpUrl

class TranslateRequest(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True, # Allows using snake_case in code
    )

    from_lang: str
    to_lang: str
    content: str

class TranslateResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True, # Allows using snake_case in code
    )

    from_lang: str
    to_lang: str
    content: str
    translation: str

class ExplainRequest(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True, # Allows using snake_case in code
    )

    from_lang: str
    to_lang: str
    lyrics_line: str
    full_lyrics: str


class DetectLangRequest(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True, # Allows using snake_case in code
    )

    full_lyrics: str
    
class DetectLangResponse(BaseModel):
    lang: str

class LyricsSearchRequest(BaseModel):
    keyword: str

class LyricsSearchResponse(BaseModel):
    songs: list[LyricsSearchInfo]

class LyricsRequest(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True, # Allows using snake_case in code
    )

    provider_id: str
    song_id: str

class LyricsResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True, # Allows using snake_case in code
    )

    raw_lyrics: str
    
class TtsRequest(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True, # Allows using snake_case in code
    )

    note_id: str
    lang: str
    content: str

class AvailableLangsResponse(BaseModel):
    langs: list[LangInfo]