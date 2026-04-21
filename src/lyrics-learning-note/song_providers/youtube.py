import requests
import os

from pydantic import HttpUrl
from yt_dlp import YoutubeDL

from song_providers.song_provider import SongProvider
from song_providers.song_metadata import SongMetadata

ydl_opts = {'format': 'bestaudio/best'}

class YouTube(SongProvider):
    async def download(self, url: HttpUrl, id: str) -> SongMetadata:
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            stream_url = info['url']

        audio_bytes = requests.get(stream_url).content
        file_path = os.path.join("audios", f"{id}.mp3")
        with open(file_path, "wb") as f:
            f.write(audio_bytes)

        title = info.get("title")
        # TODO: store it in db
        return SongMetadata(title, id)