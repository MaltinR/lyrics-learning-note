import requests
import os

from pydantic import HttpUrl
from yt_dlp import YoutubeDL

from song_providers.song_provider import SongProvider
from song_providers.song_metadata import SongMetadata

ydl_opts = {'format': 'bestaudio/best'}

class YouTube(SongProvider):
    async def download(self, url: HttpUrl) -> tuple[bytes, SongMetadata]:
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(str(url), download=False)
            stream_url = info.get('url')
            duration_seconds = info.get('duration')
            title = info.get("title")

        audio_bytes : bytes = requests.get(stream_url).content
        return audio_bytes, SongMetadata(title, duration_seconds)