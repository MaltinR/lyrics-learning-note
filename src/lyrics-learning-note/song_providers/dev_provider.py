from pydantic import HttpUrl
from song_providers.song_provider import SongProvider
from song_providers.song_metadata import SongMetadata

class DevProvider(SongProvider):
    async def download(self, url: HttpUrl, id: str) -> SongMetadata:
        return SongMetadata("title", id)