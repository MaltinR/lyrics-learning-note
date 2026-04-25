import os

from google.cloud import texttospeech
import google.auth.api_key

from tts_providers.tts_provider import TtsProvider

class GcloudTts(TtsProvider):
    @property
    def id(self) -> str:
        return "gcloud"

    async def get_tts(self, lang: str, content: str) -> bytes:
        api_key: str = os.getenv("GOOGLE_CLOUD_KEY")
        credentials = google.auth.api_key.Credentials(api_key)
        client = texttospeech.TextToSpeechClient(credentials=credentials)

        synthesis_input = texttospeech.SynthesisInput(text=content)

        voice = texttospeech.VoiceSelectionParams(
            language_code=lang, 
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

        return response.audio_content