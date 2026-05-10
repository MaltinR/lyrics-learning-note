import { useState, useEffect, useCallback } from "react";

// --- GLOBAL SINGLETON STATE ---
let globalAudio: HTMLAudioElement | null = null;
let isGlobalSegmentPlaying = false;
let globalPlayingId = "";
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  globalAudio = new Audio();
}

const notifyAll = () => listeners.forEach((fn) => fn());

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
    if (!val) setSegmentCurrentTime(0);
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
      // Only sync state if we are NOT in segment mode
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

      // Throttle to roughly 30 FPS (~33ms) to save CPU/React renders
      if (time - lastTime < 33) return;
      lastTime = time;

      // Only update if actually playing
      if (!globalAudio!.paused) {
        if (isGlobalSegmentPlaying) {
          setSegmentCurrentTime(globalAudio!.currentTime);
        } else {
          setCurrentTime(globalAudio!.currentTime);
        }
      }
    };

    // Only start the loop when audio starts playing
    if (isPlaying) {
      rAfId = requestAnimationFrame(updateFrame);
    }

    return () => cancelAnimationFrame(rAfId);
  }, [options?.highRefreshRate, isPlaying]);

  // --- UPDATED PLAY SEGMENT ---
  const playSegment = useCallback(
    (initiator: string, from: number, to: number) => {
      if (!globalAudio) return;

      // 1. Capture where we were BEFORE the segment started
      const originalTime = globalAudio.currentTime;

      setSegmentMode(true, initiator);
      globalAudio.currentTime = from;
      setSegmentCurrentTime(from);

      const checkSegmentEnd = () => {
        if (globalAudio && globalAudio.currentTime >= to) {
          globalAudio.pause();

          // 2. Snap back to the original position
          // This ensures that when we turn off segment mode,
          // the "normal" listener sees the old time, not the segment end time.
          globalAudio.currentTime = originalTime;

          setSegmentMode(false);
          globalAudio.removeEventListener("timeupdate", checkSegmentEnd);
        }
      };

      globalAudio.removeEventListener("timeupdate", checkSegmentEnd);
      globalAudio.addEventListener("timeupdate", checkSegmentEnd);
      globalAudio.play().catch(() => setSegmentMode(false));
    },
    [],
  );

  const togglePlay = useCallback(() => {
    if (!globalAudio) return;
    if (!globalAudio.paused) {
      globalAudio.pause();
    } else {
      // If we were in segment mode and hit play, we stay at current position
      // but exit segment mode so the UI starts updating again.
      setSegmentMode(false);
      globalAudio.play().catch(console.error);
    }
  }, []);

  const pause = useCallback(() => {
    if (!globalAudio) return;
    globalAudio.pause();
    // setSegmentMode(false);
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
