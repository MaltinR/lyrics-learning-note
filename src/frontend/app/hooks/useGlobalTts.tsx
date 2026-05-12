import axios from "axios";
import { useCallback, useEffect } from "react";
import type LyricsItem from "~/interfaces/lyricsItem";
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
    const canCache = window.caches != undefined;
    if (canCache) {
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

        const responseToCache = response.clone();
        await cache.put(downloadTtsUrl, responseToCache);

        const blob = await response.blob();
        urlByTtsId[ttsId] = URL.createObjectURL(blob);
      }
    } else {
      const response = await fetch(downloadTtsUrl);
      if (!response.ok) {
        throw new Error("Failed to download audio");
      }

      const blob = await response.blob();
      urlByTtsId[ttsId] = URL.createObjectURL(blob);
    }
  }, []);

  const playTts = useCallback(
    async (item: LyricsItem, lang: string, lyricsLines: Array<LyricsItem>): Promise<[boolean, string]> => {
      // TODO: Check if text changed after fetch
      let ttsId: string | null = item.tts;
      let isNew = ttsId == null;

      if (isNew) {
        const trimmedText = item.text.trim();
        // see if there's same text
        const sameTextLine = lyricsLines.find(el => el.text.trim() == trimmedText && el.tts != null);
        if (sameTextLine != null) {
          // still mark new, because need to save
          ttsId = sameTextLine.tts;
        }
      }

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
