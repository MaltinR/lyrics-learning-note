from pydantic import BaseModel

class LangInfo(BaseModel):
    lang: str
    name: str