from schemas import DetectLangResponse, TranslateResponse, AvailableLangsResponse
from language_detectors.language_detector import LanguageDetector
from translators.translator import Translator
from shared_providers.google.google_translate import GoogleTranslate

async def detect_lang(full_lyrics: str) -> DetectLangResponse:
    language_detector : LanguageDetector = GoogleTranslate()
    lang = language_detector.detect_lang(full_lyrics)
    return DetectLangResponse(lang=lang)

async def translate_text(from_lang: str, content: str, to_lang: str) -> TranslateResponse:
    translator : Translator = GoogleTranslate()
    translation = translator.translate(from_lang, content, to_lang)
    return TranslateResponse(from_lang=from_lang, to_lang=to_lang, content=content, translation=translation)

async def get_available_from_langs() -> AvailableLangsResponse:
    translator : Translator = GoogleTranslate()
    langs = translator.get_available_from_langs()
    return AvailableLangsResponse(langs=langs)

async def get_available_to_langs() -> AvailableLangsResponse:
    translator : Translator = GoogleTranslate()
    langs = translator.get_available_to_langs()
    return AvailableLangsResponse(langs=langs)