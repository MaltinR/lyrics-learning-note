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
import type LyricsItem from "~/interfaces/lyricsItem";

export default function LyricsLine({
  targetLang,
  originalLang,
  line,
  idx,
  isActive,
  highlight,
  prepare,
  draggedIndex,
  activeLineIndex,
  isPlaying,
  setActiveLineIndex,
  setDraggedIndex,
  setLyricsLines,
  onEditRequest,
  onExplanationRequest,
  onPlayRequest,
  onStopRequest,
  onTtsRequest,
  onTranslateRequest,
}: {
  targetLang: string | null;
  originalLang: string | null;
  line: LyricsItem;
  idx: number;
  isActive: boolean;
  highlight: boolean;
  prepare: boolean;
  draggedIndex: number | null;
  activeLineIndex: number | null;
  isPlaying: boolean;
  setActiveLineIndex: (value: React.SetStateAction<number | null>) => void;
  setDraggedIndex: (value: React.SetStateAction<number | null>) => void;
  setLyricsLines: (value: React.SetStateAction<LyricsItem[]>) => void;
  onEditRequest: (item: LyricsItem) => void;
  onExplanationRequest: (item: LyricsItem) => void;
  onPlayRequest: (item: LyricsItem) => void;
  onStopRequest: (item: LyricsItem) => void;
  onTtsRequest: (item: LyricsItem) => void;
  onTranslateRequest: (item: LyricsItem) => void;
}) {
  // State to track if the cursor is on the drag handle
  const [isDragEnabled, setIsDragEnabled] = useState(false);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Small delay to allow the drag image to generate before changing opacity
    setTimeout(() => {
      if (e.target instanceof HTMLElement) e.target.classList.add("opacity-40");
    }, 0);
  };

  const handleDragEnter = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    setLyricsLines((prev) => {
      const newLyrics = [...prev];
      const draggedItem = newLyrics[draggedIndex];
      newLyrics.splice(draggedIndex, 1); // Remove from old position
      newLyrics.splice(targetIndex, 0, draggedItem); // Insert at new position
      setDraggedIndex(targetIndex); // Update current dragged index

      // Keep active line highlight on the correct item if it was moved
      if (activeLineIndex === draggedIndex) setActiveLineIndex(targetIndex);
      else if (activeLineIndex === targetIndex)
        setActiveLineIndex(draggedIndex);

      return newLyrics;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedIndex(null);
    setIsDragEnabled(false); // Reset drag state when dropping
    if (e.target instanceof HTMLElement)
      e.target.classList.remove("opacity-40");
  };

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
      draggable={isDragEnabled} // Make draggable conditionally
      onDragStart={(e) => handleDragStart(e, idx)}
      onDragEnter={(e) => handleDragEnter(e, idx)}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      className="group flex items-start py-[2px] transition-opacity cursor-text"
      onClick={() => setActiveLineIndex(idx)}
    >
      {/* Left Gutter: Notion Icons (+ and ::) */}
      <div className="w-12 flex-shrink-0 flex justify-end items-center pr-2 pt-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
        <div 
          className="text-[#A4A4A3] hover:bg-[#E9E9E7] rounded p-[2px] cursor-grab active:cursor-grabbing"
          onMouseEnter={() => setIsDragEnabled(true)}  // Enable drag when hovering handle
          onMouseLeave={() => setIsDragEnabled(false)} // Disable drag when leaving handle
        >
          <GripVertical className="w-[18px] h-[18px]" />
        </div>
      </div>
      <div className="justify-center items-center w-1 py-[4px]">
        <div className={`h-[24px] rounded ${highlight ? "bg-[#1A66B8]" : prepare ? "bg-[#8CB2DB]" : ""}`} />
      </div>

      {/* Main Content Block */}
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
              <button
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
              {originalLang != null && <button
                className="p-1 rounded hover:bg-[#d8e8f8] text-[#787774] transition-colors"
                title="TTS"
                onClick={handleTts}
              >
                <Speech className="w-4 h-4" />
              </button>}
              {originalLang && targetLang && <button
                className="p-1 rounded hover:bg-[#d8e8f8] text-[#787774] transition-colors"
                title="Translate"
                onClick={handleTranslation}
              >
                <Languages className="w-4 h-4" />
              </button>}
              {originalLang && targetLang && <button
                className="p-1 rounded hover:bg-[#d8e8f8] text-[#787774] transition-colors"
                title="Explanation"
                onClick={(e) => {
                  e.stopPropagation();
                  onExplanationRequest(line);
                }}
              >
                <ScrollText className="w-4 h-4 text-[#787774]" />
              </button>}
              <button
                className="p-1 rounded hover:bg-[#d8e8f8] text-[#787774] transition-colors ml-1"
                title="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditRequest(line);
                }}
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {translation != null && <div className="w-full flex items-center text-gray-500 pl-2">
            <Languages className="w-3 h-3" />
            <div className="text-sm ml-1">{translation}</div>
          </div>}
        </div>
      </div>
    </div>
  );
}