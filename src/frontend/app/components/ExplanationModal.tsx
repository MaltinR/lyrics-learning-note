import { Streamdown } from "streamdown";
import type LyricsItem from "~/interfaces/lyricsItem";
import Modal from "./Modal";
import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";
import ModalFooterButton from "./ModalFooterButton";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getExplanationStream } from "~/lib/explain";
import { Edit3, Languages, Play, Speech, Square } from "lucide-react";
import useIsMobile from "~/hooks/useIsMoile";

function MainContent({
  isPlaying,
  handleStop,
  handlePlay,
  handleTts,
  handleTranslation,
  originalLyrics,
  translatedLyrics,
  originalLang,
  targetLang,
  explanation,
  errorText,
}: {
  isPlaying: boolean;
  handleStop: () => void;
  handlePlay: () => void;
  handleTts: () => void;
  handleTranslation: () => void;
  originalLyrics: string | null;
  translatedLyrics: string | null;
  originalLang: string | null;
  targetLang: string | null;
  explanation: string;
  errorText: string | null;
}) {
const isMobile = useIsMobile();

  return (
    <div className="mb-4 mt-2 flex-1 flex flex-col min-h-0">
      <div className="border-b border-[#DEDCD9] pb-2 mb-2 ">
        <div className="mx-4 flex justify-between items-start">
          <div>
            {<div className="font-bold">{originalLyrics}</div>}
            {translatedLyrics != null && (
              <div className="flex items-center text-gray-500">
                <Languages className="w-4 h-4 mr-0.5" />
                <div>{`Translation: ${translatedLyrics}`}</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-100 ">
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
            {originalLang != null && (
              <button
                className="p-1 rounded hover:bg-[#d8e8f8] text-[#787774] transition-colors"
                title="TTS"
                onClick={handleTts}
              >
                <Speech className="w-4 h-4" />
              </button>
            )}
            {originalLang && targetLang && (
              <button
                className="p-1 rounded hover:bg-[#d8e8f8] text-[#787774] transition-colors"
                title="Translate"
                onClick={handleTranslation}
              >
                <Languages className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className={`${isMobile ? "flex-1 min-h-0 " : "min-h-48 max-h-96 "}flex flex-col overflow-y-scroll mx-4`}>
        {targetLang == null || originalLang == null || errorText != null ? (
          <div className="flex-1 flex flex-col justify-center items-center">
            {originalLang == null && <div>Please select original language</div>}
            {targetLang == null && <div>Please select target language</div>}
            {errorText != null && (
              <div className="text-red-500">{errorText}</div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex text-sm">
            <Streamdown>{explanation}</Streamdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplanationModal({
  isPlaying,
  lyricsLine,
  fullLyrics,
  originalLang,
  targetLang,
  onCancel,
  onConfirm,
  onPlayRequest,
  onStopRequest,
  onTtsRequest,
  onTranslateRequest,
}: {
  isPlaying: boolean;
  lyricsLine: LyricsItem;
  fullLyrics: string;
  originalLang: string | null;
  targetLang: string | null;
  onCancel: () => void;
  onConfirm: (lyricsLine: LyricsItem) => void;
  onPlayRequest: (item: LyricsItem) => void;
  onStopRequest: (item: LyricsItem) => void;
  onTtsRequest: (item: LyricsItem) => void;
  onTranslateRequest: (item: LyricsItem) => void;
}) {
  const [tempLyricsLine, setTempLyricsLine] = useState<LyricsItem>({
    ...lyricsLine,
  });
  const [isGenerated, setIsGenerated] = useState<boolean>(
    lyricsLine.explanations.find((el) => el.lang == targetLang) != null,
  );
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>(
    targetLang != null
      ? (tempLyricsLine.explanations.find((el) => el.lang == targetLang)
          ?.content ?? "")
      : "",
  );

  const generate = useCallback(async () => {
    setIsGenerating(true);
    setIsGenerated(false);
    setExplanation("");
    setErrorText(null);
    const handleChunk = (deltaText: string) => {
      setExplanation((fullText) => fullText + deltaText);
    };
    try {
      await getExplanationStream(
        originalLang!,
        targetLang!,
        lyricsLine.text,
        fullLyrics,
        handleChunk,
      );
      setIsGenerated(true);
    } catch (e: any) {
      console.log("Error");
      setErrorText(e.toString());
    } finally {
      setIsGenerating(false);
    }
  }, [originalLang, targetLang, lyricsLine, fullLyrics]);

  const handleConfirm = useCallback(() => {
    onConfirm(tempLyricsLine);
  }, [onConfirm, tempLyricsLine]);

  const handlePlay = useCallback(() => {
    onPlayRequest(lyricsLine);
  }, [lyricsLine, onPlayRequest]);

  const handleStop = useCallback(() => {
    onStopRequest(lyricsLine);
  }, [lyricsLine, onStopRequest]);

  const handleTts = useCallback(() => {
    onTtsRequest(lyricsLine);
  }, [lyricsLine, onTtsRequest]);

  const handleTranslation = useCallback(() => {
    onTranslateRequest(lyricsLine);
  }, [lyricsLine, onTranslateRequest]);

  const isGeneratable = useMemo(
    () =>
      originalLang != null &&
      targetLang != null &&
      originalLang != "" &&
      targetLang != "",
    [originalLang, targetLang],
  );

  const translatedLyrics = useMemo(() => {
    const result = lyricsLine.translations.find(
      (el) => el.lang === targetLang,
    )?.content;
    return result != null ? result : null;
  }, [targetLang, lyricsLine]);

  useEffect(() => {
    setTempLyricsLine((line) => {
      const explanations = [
        ...line.explanations.filter((el) => el.lang != targetLang),
        {
          lang: targetLang!,
          content: explanation,
        },
      ];

      return { ...line, explanations };
    });
  }, [targetLang, explanation]);

  return (
    <Modal onCancel={onCancel}>
      <ModalHeader title="Explanation" />
      <MainContent
        isPlaying={isPlaying}
        handleStop={handleStop}
        handlePlay={handlePlay}
        handleTts={handleTts}
        handleTranslation={handleTranslation}
        originalLyrics={lyricsLine.text}
        translatedLyrics={translatedLyrics}
        originalLang={originalLang}
        targetLang={targetLang}
        explanation={explanation}
        errorText={errorText}
      />
      <ModalFooter>
        {isGenerated && (
          <ModalFooterButton
            type="secondary"
            text="Regenerate"
            onClick={generate}
            disabled={!isGeneratable}
          />
        )}
        <ModalFooterButton type="secondary" text="Cancel" onClick={onCancel} />
        {(explanation == null || explanation == "") && !isGenerating ? (
          <ModalFooterButton
            type="primary"
            text="Generate"
            onClick={generate}
            disabled={!isGeneratable}
          />
        ) : (
          <ModalFooterButton
            type="primary"
            text={isGenerating ? "Generating" : "Confirm"}
            onClick={handleConfirm}
            disabled={isGenerating || !isGeneratable}
          />
        )}
      </ModalFooter>
    </Modal>
  );
}
