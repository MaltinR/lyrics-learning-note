import os

from lyricsgenius import Genius

from lyrics.lyrics_provider import LyricsProvider
from lyrics.lyrics_search_info import LyricsSearchInfo

class LyricsGenius(LyricsProvider):
    @property
    def id(self) -> str:
        return "lyrics_genius"

    async def search(self, keyword: str) -> list[LyricsSearchInfo]:
        access_key = os.getenv("LYRICS_GENIUS_ACCESS_TOKEN")
        genius = Genius(access_key)
        search_results = genius.search_songs(keyword, per_page=5)
        
        results_list : list[LyricsSearchInfo] = []

        for hit in search_results['hits']:
            # Each 'hit' contains song metadata in the 'result' key
            song_info = hit['result']
            
            # Extracting your specific needs
            song_id = song_info.get("id")
            title = song_info.get('title')
            singer = song_info.get('primary_artist', {}).get('name')
            url = song_info.get('url')

            results_list.append(LyricsSearchInfo(
                provider_id=self.id, 
                song_id=str(song_id),
                title=title, 
                url=url, 
                singer=singer))

        return results_list
    
    async def get_lyrics(self, id: str) -> str:
        access_key = os.getenv("LYRICS_GENIUS_ACCESS_TOKEN")
        genius = Genius(access_key)
        song = genius.search_song(song_id=int(id))
        return song.lyrics