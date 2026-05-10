// MusicPlayer.tsx
"use client";

import React, { useCallback, useMemo } from "react";
import { Volume2, Play, Pause, Square, VolumeX } from "lucide-react";
import useGlobalAudio from "~/hooks/useGlobalAudio";

export default function MusicPlayer({
  audioUrl,
  onPlay,
}: {
  audioUrl: string;
  onPlay: () => void;
}) {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isSegmentPlaying,
    togglePlay,
    stop,
    seek,
    changeVolume,
    toggleMute,
  } = useGlobalAudio(audioUrl);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Calculate percentage for the progress bar fill
  const progressPercent = useMemo(() => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  const handlePause = useCallback(() => {
    togglePlay();
  }, [togglePlay]);

  const handlePlay = useCallback(() => {
    if (isSegmentPlaying) {
      stop();
      seek(currentTime);
      togglePlay();
    } else {
      togglePlay();
    }
    onPlay();
  }, [currentTime, isSegmentPlaying, togglePlay, stop, seek, onPlay]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E9E9E7] px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] pb-8 md:pb-4">
      {/* Spacer for desktop centering */}
      <div className="w-64 hidden md:block" />

      <div className="flex-1 w-full max-w-4xl flex flex-col items-center">
        {/* Timebar (Top on Mobile, Bottom on Desktop) */}
        <div className="order-1 md:order-2 w-full flex items-center gap-3 text-xs text-[#A4A4A3] font-medium mb-4 md:mb-0 md:mt-2">
          <span className="min-w-6 max-w-6">{formatTime(currentTime)}</span>
          <div
            className={`flex-1 h-1.5 rounded-full overflow-hidden relative ${
              isSegmentPlaying ? "bg-[#F3F3F1] opacity-50" : "bg-[#E9E9E7]"
            }`}
          >
            <div
              className={`h-full transition-all duration-100 ${
                isSegmentPlaying ? "bg-[#B0B0AF]" : "bg-[#37352F]"
              }`}
              style={{
                width: `${(currentTime / (duration || 1)) * 100}%`,
              }}
            />
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              disabled={isSegmentPlaying}
              className={`absolute inset-0 w-full opacity-0 ${
                isSegmentPlaying ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            />
          </div>
          <span className="min-w-6 max-w-6">{formatTime(duration)}</span>
        </div>

        <div className="order-2 md:order-1 flex items-center justify-center gap-8 w-full relative">
          <div className="flex items-center gap-2 absolute right-2">
            <button className="text-[#A4A4A3]" onClick={toggleMute}>
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-[#E9E9E7] rounded-lg appearance-none cursor-pointer accent-[#37352F]"
            />
          </div>

          <button
            onClick={isPlaying && !isSegmentPlaying ? handlePause : handlePlay}
            className="w-12 h-12 flex items-center justify-center bg-[#37352F] text-white rounded-full hover:scale-105 transition-all shadow-sm"
          >
            {isPlaying && !isSegmentPlaying ? (
              <Pause className="w-6 h-6" fill="currentColor" />
            ) : (
              <Play className="w-6 h-6 ml-1" fill="currentColor" />
            )}
          </button>

          <button onClick={stop} className="text-[#A4A4A3] transition-colors">
            <Square className="w-5 h-5" fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
