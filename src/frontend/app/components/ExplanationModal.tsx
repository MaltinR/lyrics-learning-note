import { Streamdown } from "streamdown";
import type LyricsItem from "~/interfaces/lyricsItem";
import Modal from "./Modal";
import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";
import ModalFooterButton from "./ModalFooterButton";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getExplanationStream } from "~/lib/explain";

function MainContent({
  originalLang,
  targetLang,
  explanation,
  errorText,
}: {
  originalLang: string | null;
  targetLang: string | null;
  explanation: string;
  errorText: string | null;
}) {
  return (
    <div className="min-h-48 max-h-96 flex m-4 overflow-y-scroll">
      {targetLang == null || originalLang == null || errorText != null ? (
        <div className="flex-1 flex flex-col justify-center items-center">
          {originalLang == null && <div>Please select original language</div>}
          {targetLang == null && <div>Please select target language</div>}
          {errorText != null && <div className="text-red-500">{errorText}</div>}
        </div>
      ) : (
        <div className="flex-1 flex text-sm">
          <Streamdown>{explanation}</Streamdown>
        </div>
      )}
    </div>
  );
}

export default function ExplanationModal({
  lyricsLine,
  fullLyrics,
  originalLang,
  targetLang,
  onCancel,
  onConfirm,
}: {
  lyricsLine: LyricsItem;
  fullLyrics: string;
  originalLang: string | null;
  targetLang: string | null;
  onCancel: () => void;
  onConfirm: (lyricsLine: LyricsItem) => void;
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

  //   console.log(lyricsLine);

  //   const delay = (ms: number) =>
  //     new Promise((resolve) => setTimeout(resolve, ms));

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

  const isGeneratable = useMemo(
    () =>
      originalLang != null &&
      targetLang != null &&
      originalLang != "" &&
      targetLang != "",
    [originalLang, targetLang],
  );

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
    <Modal>
      <ModalHeader title="Explanation" />
      <MainContent
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
