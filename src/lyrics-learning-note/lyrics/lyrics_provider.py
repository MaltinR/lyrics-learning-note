from abc import ABC, abstractmethod
from lyrics.lyrics_search_info import LyricsSearchInfo

class LyricsProvider(ABC):
    @property
    def id(self) -> str:
        pass

    @abstractmethod
    async def search(self, keyword: str) -> list[LyricsSearchInfo]:
        pass

    @abstractmethod
    async def get_lyrics(self, id: str):
        pass