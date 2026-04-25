import uuid

from pydantic import HttpUrl

from song_providers.song_provider import SongProvider
from song_providers.youtube import YouTube
from song_providers.dev_provider import DevProvider
from song_providers.song_metadata import SongMetadata

async def download(url: HttpUrl) -> tuple[bytes, SongMetadata]:
    host = url.host

    provider : SongProvider

    if any(host.endswith(domain) for domain in ['youtube.com', 'youtu.be']):
        provider = YouTube()
    elif any(host.endswith(domain) for domain in ['.dev']):
        provider = DevProvider()
    else:
        raise Exception("Invalid source of url")

    return await provider.download(url)