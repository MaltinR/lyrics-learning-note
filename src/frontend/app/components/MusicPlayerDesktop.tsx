// MusicPlayer.tsx
"use client";

import React, { useCallback } from "react";
import { Volume2, Play, Pause, Square } from "lucide-react";
import useGlobalAudio from "~/hooks/useGlobalAudio";

export default function MusicPlayer({ audioUrl, onPlay }: { audioUrl: string; onPlay: () => void; }) {
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

  const handlePause = useCallback(() => {
    togglePlay();
  }, [togglePlay]);
  const handlePlay = useCallback(() => {
    const lastCurrentTime = currentTime;
    if (isSegmentPlaying) {
      // Stop the segment
      stop();
      // Go back to the currentTime first
      seek(lastCurrentTime);
      togglePlay();
    } else {
      togglePlay();
    }
    onPlay()
  }, [currentTime, isSegmentPlaying, togglePlay]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E9E9E7] px-6 py-4 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
      {/* Hidden left placeholder to keep elements centered properly */}
      <div className="w-64 hidden md:block" />

      <div className="flex-1 max-w-4xl px-4 flex flex-col items-center">
        <div className="flex items-center gap-6 mb-2">
          <button
            onClick={isPlaying && !isSegmentPlaying ? handlePause : handlePlay}
            className="w-10 h-10 flex items-center justify-center bg-[#37352F] text-white rounded-full hover:bg-black transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying && !isSegmentPlaying ? (
              <Pause className="w-5 h-5" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5 ml-1" fill="currentColor" />
            )}
          </button>

          <button
            onClick={stop}
            className="text-[#A4A4A3] hover:text-[#37352F] transition"
            title="Stop"
          >
            <Square className="w-5 h-5" fill="currentColor" />
          </button>
        </div>

        <div className="w-full flex items-center gap-3 text-xs text-[#A4A4A3] font-medium relative select-none">
          <span>{formatTime(currentTime)}</span>

          <div
            className={`flex-1 h-[4px] rounded-full overflow-hidden relative ${
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

          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="w-64 flex items-center justify-end text-[#A4A4A3] gap-4 pr-4">
        <div className="flex items-center gap-2">
          <button onClick={toggleMute}>
            <Volume2 className="w-5 h-5 cursor-pointer hover:text-[#37352F] transition-colors" />
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
      </div>
    </div>
  );
}
