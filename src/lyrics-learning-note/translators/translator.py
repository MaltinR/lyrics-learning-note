from abc import ABC, abstractmethod

class Translator(ABC):
    @abstractmethod
    def translate(self, from_lang: str, content: str, to_lang: str) -> str:
        pass

    @abstractmethod
    def get_available_from_langs(self) -> list:
        pass