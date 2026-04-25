from pydantic import BaseModel

class LyricsSearchInfo(BaseModel):
    provider_id: str
    song_id: str
    title: str
    url: str
    singer: str