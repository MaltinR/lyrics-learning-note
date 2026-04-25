from abc import ABC, abstractmethod
from typing import AsyncIterator

class Explainer(ABC):
    @abstractmethod
    async def explain(self, from_lang: str, to_lang: str, lyrics_ling: str, full_lyrics: str) -> AsyncIterator[str]:
        pass