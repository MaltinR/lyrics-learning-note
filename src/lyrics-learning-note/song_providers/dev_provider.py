from pydantic import HttpUrl
from song_providers.song_provider import SongProvider
from song_providers.song_metadata import SongMetadata

class DevProvider(SongProvider):
    async def download(self, url: HttpUrl) -> tuple[bytes, SongMetadata]:
        return bytes(), SongMetadata("title", 0)