import { useState, useEffect, useCallback } from "react";

// --- GLOBAL SINGLETON STATE ---
let globalAudio: HTMLAudioElement | null = null;
let isGlobalSegmentPlaying = false;
let globalPlayingId = "";
// 1. Add a global reference to track the active segment listener
let activeSegmentListener: (() => void) | null = null;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  globalAudio = new Audio();
}

const notifyAll = () => listeners.forEach((fn) => fn());

// 2. Helper to accurately remove the old listener
const clearSegmentListener = () => {
  if (globalAudio && activeSegmentListener) {
    globalAudio.removeEventListener("timeupdate", activeSegmentListener);
    activeSegmentListener = null;
  }
};

interface UseGlobalAudioOptions {
  highRefreshRate?: boolean;
}

export default function useGlobalAudio(
  audioUrl?: string,
  options?: UseGlobalAudioOptions,
) {
  const [, setTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [segmentCurrentTime, setSegmentCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(globalAudio?.volume ?? 1);
  const [isMuted, setIsMuted] = useState(globalAudio?.muted ?? false);

  const isSegmentPlaying = isGlobalSegmentPlaying;
  const playingId = globalPlayingId;

  const setSegmentMode = (val: boolean, id: string = "") => {
    isGlobalSegmentPlaying = val;
    globalPlayingId = id;
    if (!val) {
      setSegmentCurrentTime(0);
      // 3. Automatically clean up the listener whenever segment mode turns off
      clearSegmentListener();
    }
    notifyAll();
  };

  useEffect(() => {
    if (!globalAudio || !audioUrl) return;
    if (globalAudio.src !== audioUrl) {
      globalAudio.src = audioUrl;
      globalAudio.load();
      setIsPlaying(false);
      setCurrentTime(0);
      setSegmentMode(false);
    }
  }, [audioUrl]);

  useEffect(() => {
    if (!globalAudio) return;

    const forceUpdate = () => setTick((t) => t + 1);
    listeners.add(forceUpdate);

    const handleTimeUpdate = () => {
      if (!isGlobalSegmentPlaying) {
        setCurrentTime(globalAudio!.currentTime);
      } else {
        setSegmentCurrentTime(globalAudio!.currentTime);
      }
    };

    const handleMetadata = () => setDuration(globalAudio!.duration);
    const handleVolumeChange = () => {
      setVolume(globalAudio!.volume);
      setIsMuted(globalAudio!.muted);
    };
    const handlePlayState = () => setIsPlaying(!globalAudio!.paused);

    const handleEnded = () => {
      setIsPlaying(false);
      setSegmentMode(false);
    };

    globalAudio.addEventListener("timeupdate", handleTimeUpdate);
    globalAudio.addEventListener("loadedmetadata", handleMetadata);
    globalAudio.addEventListener("volumechange", handleVolumeChange);
    globalAudio.addEventListener("play", handlePlayState);
    globalAudio.addEventListener("pause", handlePlayState);
    globalAudio.addEventListener("ended", handleEnded);

    return () => {
      listeners.delete(forceUpdate);
      globalAudio?.removeEventListener("timeupdate", handleTimeUpdate);
      globalAudio?.removeEventListener("loadedmetadata", handleMetadata);
      globalAudio?.removeEventListener("volumechange", handleVolumeChange);
      globalAudio?.removeEventListener("play", handlePlayState);
      globalAudio?.removeEventListener("pause", handlePlayState);
      globalAudio?.removeEventListener("ended", handleEnded);
    };
  }, []);

  useEffect(() => {
    if (!options?.highRefreshRate || !globalAudio) return;

    let rAfId: number;
    let lastTime = performance.now();

    const updateFrame = (time: number) => {
      rAfId = requestAnimationFrame(updateFrame);

      if (time - lastTime < 33) return;
      lastTime = time;

      if (!globalAudio!.paused) {
        if (isGlobalSegmentPlaying) {
          setSegmentCurrentTime(globalAudio!.currentTime);
        } else {
          setCurrentTime(globalAudio!.currentTime);
        }
      }
    };

    if (isPlaying) {
      rAfId = requestAnimationFrame(updateFrame);
    }

    return () => cancelAnimationFrame(rAfId);
  }, [options?.highRefreshRate, isPlaying]);

  // --- UPDATED PLAY SEGMENT ---
  const playSegment = useCallback(
    (initiator: string, from: number, to: number) => {
      if (!globalAudio) return;

      const originalTime = globalAudio.currentTime;

      // 4. Force-clear the previous active listener before overriding the segment
      clearSegmentListener();

      setSegmentMode(true, initiator);
      globalAudio.currentTime = from;
      setSegmentCurrentTime(from);

      const checkSegmentEnd = () => {
        if (globalAudio && globalAudio.currentTime >= to) {
          globalAudio.pause();

          globalAudio.currentTime = originalTime;
          // Disabling segment mode inherently cleans up `activeSegmentListener` now
          setSegmentMode(false);
        }
      };

      // 5. Save the newly created reference into the global tracker
      activeSegmentListener = checkSegmentEnd;
      globalAudio.addEventListener("timeupdate", checkSegmentEnd);
      globalAudio.play().catch((reason) => {
        console.error(reason);
        setSegmentMode(false);
      });
    },
    [],
  );

  const togglePlay = useCallback(() => {
    if (!globalAudio) return;
    if (!globalAudio.paused) {
      globalAudio.pause();
    } else {
      setSegmentMode(false);
      globalAudio.play().catch(console.error);
    }
  }, []);

  const pause = useCallback(() => {
    if (!globalAudio) return;
    globalAudio.pause();
  }, []);

  const seek = useCallback((time: number) => {
    if (!globalAudio) return;
    setSegmentMode(false);
    globalAudio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const changeVolume = useCallback((val: number) => {
    if (!globalAudio) return;
    globalAudio.volume = Math.max(0, Math.min(1, val));
  }, []);

  const toggleMute = useCallback(() => {
    if (!globalAudio) return;
    globalAudio.muted = !globalAudio.muted;
  }, []);

  const stop = useCallback(() => {
    if (!globalAudio) return;
    globalAudio.pause();
    globalAudio.currentTime = 0;
    setSegmentMode(false);
  }, []);

  return {
    isPlaying,
    currentTime,
    segmentCurrentTime,
    duration,
    volume,
    isMuted,
    isSegmentPlaying,
    playingId,
    togglePlay,
    playSegment,
    seek,
    pause,
    stop,
    changeVolume,
    toggleMute,
  };
}