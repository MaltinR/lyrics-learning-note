import io
from google import genai
from google.genai import types
from pydub import AudioSegment

from tts_providers.tts_provider import TtsProvider

class GeminiTts(TtsProvider):
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self._id = "gemini-tts"

    @property
    def id(self) -> str:
        return self._id

    async def get_tts(self, lang: str, content: str) -> bytes:
        # 1. Call Gemini asynchronously (self.client.aio)
        # We completely removed response_mime_type to fix the 400 error
        response = await self.client.aio.models.generate_content(
            model='gemini-2.5-flash-preview-tts',
            contents=content,
            config=types.GenerateContentConfig(
                response_modalities=["audio"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name='Aoede' 
                        )
                    ),
                    language_code=lang
                )
            )
        )

        if not response.candidates or not response.candidates[0].content.parts:
            raise ValueError("Gemini TTS returned an empty response.")

        # 2. Extract the raw PCM bytes from the response
        raw_pcm_bytes = None
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                raw_pcm_bytes = part.inline_data.data
                break

        if not raw_pcm_bytes:
            raise ValueError("No audio data found in the response parts.")

        # 3. Convert raw PCM bytes to MP3 bytes in memory
        # Gemini TTS outputs raw PCM at 24000Hz, 16-bit (sample_width=2), Mono (channels=1)
        audio_segment = AudioSegment(
            data=raw_pcm_bytes,
            sample_width=2,  
            frame_rate=24000,
            channels=1
        )

        # Export to an MP3 byte stream
        mp3_buffer = io.BytesIO()
        audio_segment.export(mp3_buffer, format="mp3")
        
        return mp3_buffer.getvalue()