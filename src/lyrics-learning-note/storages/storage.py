from abc import ABC, abstractmethod

class Storage(ABC):
    @abstractmethod
    def get_audio(self, id: str) -> bytes:
        pass