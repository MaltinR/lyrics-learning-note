from fastapi import HTTPException

from schemas import LyricsResponse, LyricsSearchResponse
from lyrics.lyrics_provider import LyricsProvider
from lyrics.genius.lyrics_genius import LyricsGenius
from lyrics.lyrics_search_info import LyricsSearchInfo

async def get_lyrics(provider_id: str, song_id: str) -> LyricsResponse:
    provider : LyricsProvider = get_provider(provider_id)
    lyrics = await provider.get_lyrics(song_id)
    return LyricsResponse(raw_lyrics=lyrics)

async def search_lyrics(keyword: str) -> LyricsSearchResponse:
    provider : LyricsProvider = LyricsGenius()
    result = await provider.search(keyword)
    songs : list[LyricsSearchInfo] = result
    return LyricsSearchResponse(songs=songs)

def get_provider(provider_id) -> LyricsProvider:
    if provider_id == "lyrics_genius":
        return LyricsGenius()
    raise HTTPException(status_code=404, detail="Provider not found")