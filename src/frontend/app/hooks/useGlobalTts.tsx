import axios from "axios";
import { useCallback, useEffect } from "react";
import type LyricItem from "~/interfaces/lyricsItem";
import { generateTts } from "~/lib/tts";

let globalAudio: HTMLAudioElement | null = null;

if (typeof window !== "undefined") {
  globalAudio = new Audio();
}

const urlByTtsId: Record<string, string> = {};

export default function useGlobalTts(noteId: string) {
  const loadTts = useCallback(async (ttsId: string) => {
    // Download song
    const downloadTtsUrl: string = `/api/tts/${noteId}/${ttsId}`;
    const cache = await caches.open("tts-cache");
    const cachedResponse = await cache.match(downloadTtsUrl);

    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      urlByTtsId[ttsId] = URL.createObjectURL(blob);
    } else {
      const response = await fetch(downloadTtsUrl);
      if (!response.ok) {
        throw new Error("Failed to download audio");
      }

      // 4. Clone the response to store it in cache and read the blob
      const responseToCache = response.clone();
      await cache.put(downloadTtsUrl, responseToCache);

      // 5. Create an object URL for the audio element
      const blob = await response.blob();
      urlByTtsId[ttsId] = URL.createObjectURL(blob);
    }
  }, []);

  const playTts = useCallback(
    async (item: LyricItem, lang: string): Promise<[boolean, string]> => {
      // TODO: Check if text changed after fetch
      let ttsId: string | null = item.tts;
      let isNew = ttsId == null;

      if (ttsId == null) {
        // Get new
        let blob;
        [ttsId, blob] = await generateTts(noteId, lang, item.text);
        urlByTtsId[ttsId] = URL.createObjectURL(blob);
      } else {
        await loadTts(ttsId);
      }
      const audioUrl = urlByTtsId[ttsId];
      if (globalAudio == null) throw new Error("Audio is null");
      if (globalAudio.src !== urlByTtsId[audioUrl]) {
        globalAudio.src = audioUrl;
        globalAudio.load();
      }
      globalAudio.pause();
      globalAudio.currentTime = 0;
      globalAudio.play();
      return [isNew, ttsId];
    },
    [loadTts],
  );

  const stopTts = useCallback(() => {
    if (globalAudio == null) return;
    globalAudio.pause();
    globalAudio.currentTime = 0;
  }, []);

  return {
    playTts,
    stopTts,
  };
}
