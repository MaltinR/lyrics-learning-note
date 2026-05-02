import { Check, Loader2 } from "lucide-react";
import Card from "./Card";
import Button from "./Button";
import type { Step } from "~/types/step";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import type LyricsSourceInfo from "~/interfaces/lyricsSourceInfo";
import Modal from "./Modal";
import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";
import ModalFooterButton from "./ModalFooterButton";

interface LyricsResponse {
  rawLyrics: string;
}

export default function LyricsReviewer({
  lyricsSource,
  oldLyrics,
  setStep,
  onLyricsChange,
}: {
  lyricsSource: LyricsSourceInfo | null;
  oldLyrics: string | null;
  setStep: (step: Step) => void;
  onLyricsChange: (lyrics: string) => void;
}) {
  const [lyrics, setLyrics] = useState<string | null>(oldLyrics);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const fetchLyrics = useCallback(async (source: LyricsSourceInfo) => {
    try {
      setIsFetching(true);
      const url = "/api/lyrics";
      const payload = source;
      console.log(payload);
      const res = await axios.post(url, payload);
      console.log(res.data);
      const data: LyricsResponse = res.data;
      setLyrics(data.rawLyrics);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsFetching(false);
    }
  }, []);

  const onInputChanged = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLyrics(e.target.value);
    },
    [],
  );

  const handleProcess = useCallback(() => {
    setStep("player");
    if (oldLyrics != lyrics) {
      onLyricsChange(lyrics ?? "");
    }
  }, [oldLyrics, lyrics]);

  const handleBack = useCallback(() => {
    setStep("source");
  }, []);

  useEffect(() => {
    // console.log(lyricsSource);
    if (lyricsSource != null) {
      fetchLyrics(lyricsSource);
    }
  }, [lyricsSource]);

  console.log(lyrics);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white text-[#37352F]">
      <Modal>
        <ModalHeader title="Review Lyrics" />
        <div className="m-2">
          {isFetching && (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="w-5 h-5 text-[#787774] animate-spin" />
            </div>
          )}
          {!isFetching && (
            <>
              <textarea
                className="w-full mt-1 h-128 p-4 border border-[#E9E9E7] rounded-md bg-[#F7F7F5] focus:outline-none resize-none text-sm"
                value={lyrics ?? ""}
                onChange={onInputChanged}
              />
              {/* <div className="flex gap-4">
              <Button
                variant="success"
                className="flex-1"
                onClick={handleProcess}
              >
                <Check className="w-4 h-4" /> PROCEED
              </Button>
            </div> */}
            </>
          )}
        </div>
        <ModalFooter>
          <ModalFooterButton type="secondary" onClick={handleBack}>
            Choose from source
          </ModalFooterButton>
          <ModalFooterButton type="primary" onClick={handleProcess}>
            <div className="flex justify-center items-center">
              <Check className="w-4 h-4 mr-1" /> Proceed
            </div>
          </ModalFooterButton>
        </ModalFooter>
      </Modal>
      {/* <Card className="w-full max-w-2xl">
        <h1 className="text-xl font-semibold mb-4 border-b pb-2">
          REVIEW LYRICS
        </h1>
        {isFetching && (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="w-5 h-5 text-[#787774] animate-spin" />
            </div>
          )}
        {!isFetching && (
          <>
            <textarea
              className="w-full h-128 p-4 border border-[#E9E9E7] rounded-md bg-[#F7F7F5] focus:outline-none resize-none text-sm mb-4"
              value={lyrics ?? ""}
              onChange={onInputChanged}
            />
            <div className="flex gap-4">
              <Button
                variant="success"
                className="flex-1"
                onClick={handleProcess}
              >
                <Check className="w-4 h-4" /> PROCEED
              </Button>
            </div>
          </>
        )}
      </Card> */}
    </div>
  );
}
