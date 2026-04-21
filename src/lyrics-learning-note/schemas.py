from pydantic import BaseModel, HttpUrl

class NewSongRequest(BaseModel):
    url: HttpUrl