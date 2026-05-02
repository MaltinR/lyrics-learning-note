import { X, Play, Square } from "lucide-react";
import type { ModalType } from "~/types/modalType";
import AudioTimeSelector from "./AudioTimeSelector";
import { useCallback, useEffect, useMemo, useState } from "react";
import type LyricItem from "~/interfaces/lyricsItem";
import useGlobalAudio from "~/hooks/useGlobalAudio";
import { v4 as uuid } from "uuid";
import ModalFooter from "./ModalFooter";
import ModalFooterButton from "./ModalFooterButton";
import Modal from "./Modal";
import ModalHeader from "./ModalHeader";

export default function LyricsLineEditModal({
  audioBlob,
  lyricsLine,
  fullLyrics,
  onLyricsLineChanged,
  setModal,
}: {
  audioBlob: Blob;
  lyricsLine: LyricItem;
  fullLyrics: string;
  onLyricsLineChanged: (item: LyricItem) => void;
  setModal: (type: ModalType) => void;
}) {
  const [tempLyricsItem, setTempLyricsItem] = useState<LyricItem>(lyricsLine);

  const { playSegment, stop, isSegmentPlaying } = useGlobalAudio();

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTempLyricsItem((item) => ({
        ...item,
        text: e.target.value,
        tts: null,
      }));
    },
    [],
  );

  const onCancel = useCallback(() => {
    setModal("none");
  }, []);

  const onConfirm = useCallback(() => {
    setModal("none");
    onLyricsLineChanged(tempLyricsItem);
  }, [tempLyricsItem]);

  const handleSelectionChange = useCallback((start: number, end: number) => {
    // setStart(start);
    // setEnd(end);
    setTempLyricsItem((item) => ({ ...item, audio: { from: start, to: end } }));
  }, []);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);
  const handlePlay = useCallback(() => {
    playSegment(uuid(), tempLyricsItem.audio.from, tempLyricsItem.audio.to);
  }, [playSegment, tempLyricsItem]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return (
    // <div className="bg-white rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] w-full max-w-lg overflow-hidden border border-[#DEDCD9] animate-in fade-in zoom-in-95 duration-200">
    <Modal>
      {/* Header */}
      <ModalHeader title="Lyrics Line" onClose={() => setModal("none")} />
      {/* <div className="px-5 py-4 border-b border-[#DEDCD9] flex justify-between items-center">
        <h3 className="text-[14px] font-semibold text-[#37352F]">
          Lyrics Line
        </h3>
        <button
          onClick={() => setModal("none")}
          className="text-[#7C7B76] hover:bg-[#F2F1EE] rounded p-1.5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div> */}

      {/* Body */}
      <div className="p-5 space-y-6">
        {/* 1. Timeline Selection */}
        <div>
          <AudioTimeSelector
            audioBlob={audioBlob}
            onChange={handleSelectionChange}
            initialStart={tempLyricsItem.audio.from}
            initialEnd={tempLyricsItem.audio.to}
          />
          <button
            className="p-1 rounded hover:bg-[#d8e8f8] text-[#7C7B76] transition-colors mt-2"
            onClick={isSegmentPlaying ? handleStop : handlePlay}
          >
            {isSegmentPlaying ? (
              <Square className="w-6 h-6 " fill="currentColor" />
            ) : (
              <Play className="w-6 h-6" fill="currentColor" />
            )}
          </button>
        </div>

        {/* 2. Current Line Lyrics */}
        <div>
          <label className="block text-[11px] font-semibold text-[#7C7B76] uppercase tracking-wide mb-1.5">
            Current Line Lyrics
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-[#DEDCD9] rounded-md bg-[#FBFBFA] text-[14px] text-[#37352F] focus:outline-none focus:border-[#2383E2] focus:ring-1 focus:ring-[#2383E2]/20 transition-all shadow-sm"
            value={tempLyricsItem.text}
            onChange={handleTextChange}
          />
        </div>

        {/* 3. Original Reference Content */}
        <div>
          <label className="block text-[11px] font-semibold text-[#7C7B76] uppercase tracking-wide mb-1.5">
            Original Reference Content
          </label>
          <div className="p-3.5 bg-[#FBFBFA] border border-[#DEDCD9] rounded-md text-[13px] text-[#7C7B76] leading-relaxed whitespace-pre-wrap max-h-[120px] overflow-y-auto">
            {fullLyrics}
          </div>
        </div>
      </div>

      {/* Footer */}
      <ModalFooter>
        {/* <div className="px-5 py-3.5 border-t border-[#DEDCD9] flex justify-end gap-2.5 bg-[#FBFBFA]">
        <button
          onClick={onCancel}
          className="px-3.5 py-1.5 text-[13px] rounded-md hover:bg-[#F2F1EE] text-[#37352F] transition-colors font-medium border border-[#DEDCD9]"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-3.5 py-1.5 text-[13px] rounded-md bg-[#2383E2] hover:bg-[#1A66B8] text-white transition-colors font-medium shadow-sm border border-transparent"
        >
          Save Changes
        </button>
      </div> */}
        {/* <button
          onClick={onCancel}
          className="px-3.5 py-1.5 text-[13px] rounded-md hover:bg-[#F2F1EE] text-[#37352F] transition-colors font-medium border border-[#DEDCD9]"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-3.5 py-1.5 text-[13px] rounded-md bg-[#2383E2] hover:bg-[#1A66B8] text-white transition-colors font-medium shadow-sm border border-transparent"
        >
          Save Changes
        </button> */}
        <ModalFooterButton type="secondary" text="Cancel" onClick={onCancel} />
        <ModalFooterButton type="primary" text="Save Changes" onClick={onConfirm} />
      </ModalFooter>
    {/* </div> */}
    </Modal>
  );
}
