import time
import json
import asyncio
import httpx
from urllib.parse import urlparse, parse_qs, urlencode

from pydantic import HttpUrl
from yt_dlp import YoutubeDL

from song_providers.song_provider import SongProvider
from song_providers.song_metadata import SongMetadata

async def download_with_progress(url: HttpUrl, chunk_size: int = 32768) -> bytes:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.youtube.com/",
        "Origin": "https://www.youtube.com",
    }
    async with httpx.AsyncClient(headers=headers) as client:
        # Use stream() instead of get() to process chunks
        async with client.stream("GET", str(url)) as response:
            response.raise_for_status()
            
            total_size = int(response.headers.get("Content-Length", 0))
            downloaded_bytes = 0
            start_time = time.time()
            
            chunks = []
            
            async for chunk in response.aiter_bytes(chunk_size=chunk_size):
                downloaded_bytes += len(chunk)
                chunks.append(chunk)
                
                elapsed_time = time.time() - start_time
                if elapsed_time > 0:
                    # Speed in bytes per second (B/s)
                    speed = downloaded_bytes / elapsed_time
                    
                    # Convert to KB/s or MB/s for readability
                    speed_mb = speed / (1024 * 1024)
                    
                    # Optional: Print progress
                    print(f"Downloaded: {downloaded_bytes / (1024*1024):.2f} MB | Speed: {speed_mb:.2f} MB/s", end="\r")

            # Combine all chunks into a single bytes object
            audio_bytes = b"".join(chunks)
            print(f"\nDownload complete! Total size: {total_size / (1024*1024):.2f} MB")
            
            return audio_bytes

class YouTube(SongProvider):
    def __init__(self):
        self.ydl_opts = {
            'format': 'bestaudio/best',
            'quiet': True,
            'no_warnings': True,
        }

    async def download(self, url: HttpUrl) -> tuple[bytes, SongMetadata]:
        # 1. Fetch metadata silently and quickly using yt-dlp CLI
        meta_cmd = [
            'yt-dlp',
            '--dump-json',
            '--no-playlist',
            '--no-warnings',
            str(url)
        ]
        
        meta_process = await asyncio.create_subprocess_exec(
            *meta_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL
        )
        
        meta_stdout, _ = await meta_process.communicate()
        
        try:
            info = json.loads(meta_stdout.decode().splitlines()[0])
        except (json.JSONDecodeError, IndexError):
            raise Exception("Failed to retrieve metadata using yt-dlp")
            
        title = info.get("title")
        duration = info.get("duration")
        
        # 2. Download the audio file to memory via stdout, keeping it out of the terminal window
        download_cmd = [
            'yt-dlp',
            '-f', 'bestaudio',
            '--no-playlist',
            '--no-warnings',
            '-o', '-',  # Output to standard output (memory/stdout)
            str(url)
        ]
        
        download_process = await asyncio.create_subprocess_exec(
            *download_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL  # Silences the progress/log output
        )
        
        stdout, _ = await download_process.communicate()
        
        return stdout, SongMetadata(title, duration)

    async def download_old(self, url: HttpUrl) -> tuple[bytes, SongMetadata]:

        clearn_url = YouTube.clean_youtube_url(url)

        loop = asyncio.get_running_loop()
        with YoutubeDL(self.ydl_opts) as ydl:
            # extract_info is blocking, so we run it in the executor
            info = await loop.run_in_executor(
                None, lambda: ydl.extract_info(str(clearn_url), download=False)
            )

        title = info.get("title")
        duration = info.get("duration")
        stream_url = info.get("url") # This is the direct link to the audio file
        print(f"[Metadata] {title} - {duration}(s)")

        # async with httpx.AsyncClient() as client:
        #     response = await client.get(stream_url)
        #     response.raise_for_status()
        #     audio_bytes = response.content
        audio_bytes = await download_with_progress(stream_url)

        return audio_bytes, SongMetadata(title, duration)
    
    @staticmethod
    def clean_youtube_url(url: str) -> str:
        parsed_url = urlparse(url)
        query_params = parse_qs(parsed_url.query)
        
        # Extract the 'v' parameter
        v_param = query_params.get('v')
        
        if v_param:
            # Reconstruct the URL with only the 'v' parameter
            new_query = urlencode({'v': v_param[0]}, doseq=True)
            trimmed_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}?{new_query}"
            return trimmed_url
        
        return url