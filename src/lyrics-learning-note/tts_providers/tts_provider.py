from abc import ABC, abstractmethod

class TtsProvider(ABC):
    @property
    def id(self) -> str:
        pass

    @abstractmethod
    async def get_tts(self, lang: str, content: str) -> bytes:
        pass