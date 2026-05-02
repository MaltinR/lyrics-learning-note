export async function loadSong(noteId: string): Promise<Blob> {
    const downloadSongUrl: string = `/api/songs/${noteId}/audio`;
      const cache = await caches.open("song-cache");
      const cachedResponse = await cache.match(downloadSongUrl);

      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        return blob;
      }
      else
      {
        const response = await fetch(downloadSongUrl);
        if (!response.ok) {
          throw new Error('Failed to download audio');
        }

        const responseToCache = response.clone();
        await cache.put(downloadSongUrl, responseToCache);

        const blob = await response.blob();
        return blob;
      }
}