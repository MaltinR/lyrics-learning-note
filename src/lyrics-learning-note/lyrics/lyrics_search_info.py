from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

class LyricsSearchInfo(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True, # Allows using snake_case in code
    )

    provider_id: str
    song_id: str
    title: str
    url: str
    singer: str