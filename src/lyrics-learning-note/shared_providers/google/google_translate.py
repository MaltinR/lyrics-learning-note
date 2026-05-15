import os
import html

from google.cloud import translate_v2
import google.auth.api_key

from translators.translator import Translator
from language_detectors.language_detector import LanguageDetector
from langs.lang_info import LangInfo

class GoogleTranslate(Translator, LanguageDetector):
    client : translate_v2.Client

    def __init__(self):
        super().__init__()
        api_key: str = os.getenv("GOOGLE_CLOUD_KEY")
        credentials = google.auth.api_key.Credentials(api_key)
        self.client = translate_v2.Client(credentials=credentials)


    def detect_lang(self, text: str) -> str: 
        response = self.client.detect_language(text)
        language = response["language"]
        return language
    
    def translate(self, from_lang: str, content: str, to_lang: str) -> str:
        response = self.client.translate(
            values=content, 
            target_language=to_lang, 
            source_language=from_lang)
        encoded_translation = response["translatedText"]
        translation = html.unescape(encoded_translation)
        return translation
    
    def get_available_from_langs(self) -> list:
        langs = self.client.get_languages()
        return [LangInfo(lang=lang["language"], name=lang["name"]) for lang in langs]
        
    def get_available_to_langs(self) -> list:
        langs = self.client.get_languages()
        return [LangInfo(lang=lang["language"], name=lang["name"]) for lang in langs]