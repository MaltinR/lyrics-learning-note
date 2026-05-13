import { Play, Square, Pause } from "lucide-react";
import type { ModalType } from "~/types/modalType";
import AudioTimeSelector from "./AudioTimeSelector";
import { useCallback, useEffect, useMemo, useState } from "react";
import type LyricsItem from "~/interfaces/lyricsItem";
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
  lyricsLine: LyricsItem;
  fullLyrics: string;
  onLyricsLineChanged: (item: LyricsItem) => void;
  setModal: (type: ModalType) => void;
}) {
  const [tempLyricsItem, setTempLyricsItem] = useState<LyricsItem>(lyricsLine);
  const [currentTime, setCurrentTime] = useState<number>(tempLyricsItem.audio.from);

  const { playSegment, stop, pause, segmentCurrentTime, isSegmentPlaying } = useGlobalAudio(undefined, {highRefreshRate: true});

  const finalCurrentTime = useMemo(() => {
    return isSegmentPlaying ? segmentCurrentTime : currentTime;
  }, [segmentCurrentTime, isSegmentPlaying, currentTime]);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTempLyricsItem((item: LyricsItem) => ({
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
    setTempLyricsItem((item: LyricsItem) => ({ ...item, audio: { from: start, to: end } }));
  }, []);

  const handleCurrentTimeChange = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handlePause = useCallback(() => {
    pause();
  }, [pause])
  const handleStop = useCallback(() => {
    setCurrentTime(tempLyricsItem.audio.from);
    stop();
  }, [stop, tempLyricsItem]);
  const handlePlay = useCallback(() => {
    playSegment(uuid(), currentTime, tempLyricsItem.audio.to);
  }, [playSegment, tempLyricsItem, currentTime]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return (
    <Modal>
      <ModalHeader title="Lyrics Line" onClose={() => setModal("none")} />
      
      <div className="p-5 space-y-6">
        <div>
          <AudioTimeSelector
            audioBlob={audioBlob}
            currentTime={finalCurrentTime}
            onChange={handleSelectionChange}
            onCurrentTimeChange={handleCurrentTimeChange}
            initialStart={tempLyricsItem.audio.from}
            initialEnd={tempLyricsItem.audio.to}
          />
          <button
            className="p-1 rounded hover:bg-[#d8e8f8] text-[#7C7B76] transition-colors mt-2"
            onClick={isSegmentPlaying ? handlePause : handlePlay}
          >
            {isSegmentPlaying ? (
              <Pause className="w-6 h-6 " fill="currentColor" />
            ) : (
              <Play className="w-6 h-6" fill="currentColor" />
            )}
          </button>
          <button
            className="p-1 rounded hover:bg-[#d8e8f8] text-[#7C7B76] transition-colors mt-2"
            onClick={handleStop}
          >
            <Square className="w-6 h-6 " fill="currentColor" />
          </button>
        </div>

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
          <div className="p-3.5 bg-[#FBFBFA] border border-[#DEDCD9] rounded-md text-[13px] text-[#7C7B76] leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
            {fullLyrics}
          </div>
        </div>
      </div>

      {/* Footer */}
      <ModalFooter>
        <ModalFooterButton type="secondary" text="Cancel" onClick={onCancel} />
        <ModalFooterButton type="primary" text="Save Changes" onClick={onConfirm} />
      </ModalFooter>
    {/* </div> */}
    </Modal>
  );
}
