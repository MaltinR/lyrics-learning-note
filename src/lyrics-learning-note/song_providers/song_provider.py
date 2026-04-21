from pydantic import HttpUrl
from abc import ABC, abstractmethod
from song_providers.song_metadata import SongMetadata

class SongProvider(ABC):
    @abstractmethod
    async def download(self, url: HttpUrl, id: str) -> SongMetadata:
        pass