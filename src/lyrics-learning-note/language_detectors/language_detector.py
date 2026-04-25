from abc import ABC, abstractmethod

class LanguageDetector(ABC):
    @abstractmethod
    def detect_lang(self, text: str) -> str:
        pass