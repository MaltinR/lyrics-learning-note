import {
  GripVertical,
  Speech,
  ScrollText,
  Edit3,
  Play,
  Square,
  Languages,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type LyricItem from "~/interfaces/lyricsItem";

export default function LyricsLine({
  targetLang,
  originalLang,
  line,
  idx,
  isActive,
  highlight,
  prepare,
  isPlaying,
  setActiveLineIndex,
  onExplanationRequest,
  onPlayRequest,
  onStopRequest,
  onTtsRequest,
  onTranslateRequest,
}: {
  targetLang: string | null;
  originalLang: string | null;
  line: LyricItem;
  idx: number;
  isActive: boolean;
  highlight: boolean;
  prepare: boolean;
  isPlaying: boolean;
  setActiveLineIndex: (value: React.SetStateAction<number | null>) => void;
  onExplanationRequest: (item: LyricItem) => void;
  onPlayRequest: (item: LyricItem) => void;
  onStopRequest: (item: LyricItem) => void;
  onTtsRequest: (item: LyricItem) => void;
  onTranslateRequest: (item: LyricItem) => void;
}) {
  const handlePlay = useCallback(() => {
    onPlayRequest(line);
  }, [line, onPlayRequest]);

  const handleStop = useCallback(() => {
    onStopRequest(line);
  }, [line, onStopRequest]);

  const handleTts = useCallback(() => {
    onTtsRequest(line);
  }, [line, onTtsRequest]);

  const handleTranslation = useCallback(() => {
    onTranslateRequest(line);
  }, [line, onTranslateRequest]);

  const translation = useMemo(() => {
    if (targetLang == null || targetLang == "") return null;
    return line.translations.find(el => el.lang == targetLang)?.content;
  }, [line, targetLang])

  return (
    <div
      key={line.id}
      className="group flex items-start py-[2px] transition-opacity cursor-text"
      onClick={() => setActiveLineIndex(idx)}
    >
      <div className="justify-center items-center w-1 py-[4px]">
        <div className={`h-[24px] rounded ${highlight ? "bg-[#1A66B8]" : prepare ? "bg-[#8CB2DB]" : ""}`} />
      </div>

      <div className="flex-1 flex items-center min-h-[28px]">
        <div
          className={`w-full flex justify-between items-center flex-col px-2 py-1 rounded-[4px] transition-colors ${
            isActive ? "bg-[#E8F2FC]" : "hover:bg-[#F1F1EF] bg-transparent"
          }`}
        >
          <div className="w-full flex justify-between items-center">
            <span className="text-[16px] text-[#37352F] leading-normal outline-none">
              {line.text}
            </span>

            <div
              className={`flex items-center gap-1 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
            >
              {(isActive || isPlaying) && <button
                className="p-1 rounded hover:bg-[#d8e8f8] text-[#787774] transition-colors"
                title="Listen"
                onClick={isPlaying ? handleStop : handlePlay}
              >
                {isPlaying ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
              }
              {isActive && originalLang != null && <button
                className="p-1 rounded hover:bg-[#d8e8f8] text-[#787774] transition-colors"
                title="TTS"
                onClick={handleTts}
              >
                <Speech className="w-4 h-4" />
              </button>}
              {isActive && originalLang && targetLang && <button
                className="p-1 rounded hover:bg-[#d8e8f8] text-[#787774] transition-colors"
                title="Translate"
                onClick={handleTranslation}
              >
                <Languages className="w-4 h-4" />
              </button>}
              {isActive && originalLang && targetLang && <button
                className="p-1 rounded hover:bg-[#d8e8f8] text-[#787774] transition-colors"
                title="Explanation"
                onClick={(e) => {
                  e.stopPropagation();
                  onExplanationRequest(line);
                }}
              >
                <ScrollText className="w-4 h-4 text-[#787774]" />
              </button>}
            </div>
          </div>
          {translation != null && <div className="w-full flex items-center text-gray-500 pl-2">
            <Languages className="w-3 h-3 min-w-3 min-h-3 max-w-3 max-h-3" />
            <div className="text-sm ml-1">{translation}</div>
          </div>}
        </div>
      </div>
    </div>
  );
}