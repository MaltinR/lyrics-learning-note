import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import { v4 as uuid } from "uuid";
import type Note from "~/interfaces/note";
import type LyricsSourceInfo from "~/interfaces/lyricsSourceInfo";
import LyricsLineEditModal from "~/components/LyricsLineEditModal";
import type { ModalType } from "~/types/modalType";
import type LyricsItem from "~/interfaces/lyricsItem";
import LyricsLine from "~/components/LyricsLineMobile";
import MusicPlayer from "~/components/MusicPlayerMobile";
import useGlobalAudio from "~/hooks/useGlobalAudio";
import useGlobalTts from "~/hooks/useGlobalTts";
import { loadSong as loadSongFunc } from "~/lib/song";
import { save, getNote as getNoteFunc } from "~/lib/note";
import { detectLang, getFromLangs, getToLangs } from "~/lib/lang";
import type Lang from "~/interfaces/lang";
import NoteHeader from "~/components/NoteHeaderMobile";
import ExplanationModal from "~/components/ExplanationModal";
import { getTranslation } from "~/lib/translate";

const defaultLineDuration = 2;

export default function Page() {
  const { noteId } = useParams();

  // const [step, setStep] = useState<Step>("fetch");
  const [lyricsSource, setLyricsSource] = useState<LyricsSourceInfo | null>(
    null,
  );
  const [modal, setModal] = useState<ModalType>("none");
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(0);

  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState<string>("");
  const [singer, setSinger] = useState<string>("");

  const [note, setNote] = useState<Note | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Drag and Drop State
  const [lyrics, setLyrics] = useState("");
  const [lyricsLines, setLyricsLines] = useState<Array<LyricsItem>>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [currentLyricsLine, setCurrentLyricsLine] = useState<LyricsItem | null>(
    null,
  );
  const [originalLang, setOriginalLang] = useState<string | null>(null);
  const [availableOriginalLangs, setAvailableOriginalLangs] = useState<
    Array<Lang>
  >([]);
  const [targetLang, setTargetLang] = useState<string | null>(null);
  const [availableTargetLangs, setAvailableTargetLangs] = useState<Array<Lang>>(
    [],
  );

  const { playingId, isPlaying, stop, pause, playSegment, currentTime } =
    useGlobalAudio();
  const { playTts, stopTts } = useGlobalTts(noteId!);

  const getNote = useCallback(
    (
      note: Note | null,
      title: string,
      singer: string,
      lyricsLines: Array<LyricsItem>,
      lyrics: string | null,
      originalLang: string | null,
      targetLang: string | null,
    ) => {
      if (note == null) return null;
      return {
        id: note.id,
        title,
        singer,
        audio: note.audio,
        lyrics: lyricsLines,
        references: {
          ...note.references,
          fullLyrics: lyrics ?? note.references.fullLyrics,
        },
        language: {
          original: originalLang,
          target: targetLang,
        },
      } as Note;
    },
    [],
  );

  useEffect(() => {
    loadLangs(
      setAvailableOriginalLangs,
      setAvailableTargetLangs,
      setTargetLang,
    );
  }, []);

  useEffect(() => {
    if (noteId != null) {
      loadSong(noteId);
    }
  }, [noteId]);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // Prevent standard backspace navigation (optional)
      if (e.key === "Backspace") {
        e.preventDefault();
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        console.log("Global Backspace pressed");
        if (
          activeLineIndex != null &&
          activeLineIndex < lyricsLines.length &&
          activeLineIndex >= 0
        ) {
          setLyricsLines((lines) =>
            lines.filter((_, idx) => idx !== activeLineIndex),
          );
          setActiveLineIndex(-1);
        }
      }
    };

    // only when selecting
    if (activeLineIndex != -1) {
      window.addEventListener("keydown", handleKeyDown);
    }

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lyricsLines, activeLineIndex]);

  // useEffect(() => {
  //   if (step !== "player" && activeLineIndex != -1) {
  //     setActiveLineIndex(-1);
  //   }
  // }, [step, activeLineIndex])

  // debounce save
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      try {
        const updatedNote = getNote(
          note,
          title,
          singer,
          lyricsLines,
          lyrics,
          originalLang,
          targetLang,
        );
        if (!updatedNote) return;
        await save(updatedNote);
        setLastSaved(new Date());
      } catch (e: any) {
        setSaveError(e);
      }
    }, 1000); // 1-second delay

    return () => clearTimeout(delayDebounce);
  }, [note, title, singer, lyricsLines, lyrics, originalLang, targetLang]);

  const loadLangs = useCallback(
    async (
      setAvailableOriginalLangs: React.Dispatch<React.SetStateAction<Lang[]>>,
      setAvailableTargetLangs: React.Dispatch<React.SetStateAction<Lang[]>>,
      setTargetLang: React.Dispatch<React.SetStateAction<string | null>>,
    ) => {
      const [fromLangs, toLangs] = await Promise.all([
        getFromLangs(),
        getToLangs(),
      ]);
      setAvailableOriginalLangs(fromLangs);
      setAvailableTargetLangs(toLangs);

      const english = toLangs.find(
        (el) =>
          el.id.toLowerCase() === "en" ||
          el.id.toLocaleLowerCase().startsWith("en-"),
      );

      if (english != null) {
        setTargetLang(english.id);
      }
    },
    [],
  );

  const setOriginalLangFunc = useCallback(
    (lang: string) => {
      // Clear tts as the lang has changed
      // Translation, Explanation as well
      setLyricsLines((lines) =>
        lines.map((line) => ({
          ...line,
          tts: null,
          translations: [],
          explanations: [],
        })),
      );
      setOriginalLang(lang);
    },
    [setOriginalLang],
  );

  const loadSong = useCallback(async (noteId: string) => {
    try {
      const data: Note = await getNoteFunc(noteId);
      setTitle(data.title);
      setSinger(data.singer);
      setNote(data);
      setLyricsLines(data.lyrics);
      setLyrics(data.references.fullLyrics);
      if (data.language.original) {
        setOriginalLang(data.language.original);
      }
      if (data.language.target) {
        setTargetLang(data.language.target);
      }

      // Download song

      const blob = await loadSongFunc(noteId);
      setAudioSrc(URL.createObjectURL(blob));
      setAudioBlob(blob);

      // if (data.references.fullLyrics == null) {
      //   setStep("source");
      // } else {
      //   setStep("player");
      // }
    } catch (e: any) {
      console.error(e);
      console.trace();
    }
  }, []);

  const detectOriginalLang = useCallback(
    async (lyrics: string | null, setOriginalLang: (lang: string) => void) => {
      if (lyrics == null) return;
      const lang = await detectLang(lyrics);
      setOriginalLang(lang);
    },
    [],
  );

  useEffect(() => {
    if (originalLang == null && lyrics != "" && lyrics != null) {
      console.log("setOriginalLangFunc");
      detectOriginalLang(lyrics, setOriginalLangFunc);
    }
  }, [lyrics, originalLang, setOriginalLangFunc]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const updateLyricsLine = useCallback(
    (lyricsLine: LyricsItem) => {
      setLyricsLines((lines) =>
        lines.map((line) => (line.id === lyricsLine.id ? lyricsLine : line)),
      );
    },
    [lyricsLines],
  );

  const handleLyricsChange = useCallback((lyrics: string) => {
    setLyrics(lyrics);
  }, []);

  const getNextStartTime = useCallback(() => {
    console.log(`${lyricsLines.length} - ${note != null}`);
    if (lyricsLines.length == 0) return 0;
    if (!note) return 0;
    const biggestTo = Math.max(...lyricsLines.map((item) => item.audio.to));
    if (biggestTo + defaultLineDuration > note.audio.to) {
      return note.audio.to - defaultLineDuration;
    }
    return biggestTo;
  }, [lyricsLines, note]);

  const handleAddNewLine = useCallback(() => {
    const nextStartTime = getNextStartTime();
    console.log(nextStartTime);
    const newLine: LyricsItem = {
      id: uuid(),
      text: "New lyric line...",
      audio: {
        from: nextStartTime,
        to: nextStartTime + defaultLineDuration,
      },
      translations: [],
      explanations: [],
      tts: null,
    };
    setLyricsLines((prev) => [...prev, newLine]);
    setActiveLineIndex(lyrics.length); // Set the new line as active
  }, [getNextStartTime]);

  const handleMusicPlayerPlay = useCallback(() => {
    stopTts();
  }, [stopTts]);

  const handleLyricsLineChange = useCallback((item: LyricsItem) => {
    setLyricsLines((lines) =>
      lines.map((line) => (line.id === item.id ? item : line)),
    );
  }, []);

  const handleExplanationRequest = useCallback((line: LyricsItem) => {
    setCurrentLyricsLine(line);
    setModal("grammar");
  }, []);

  const handleLinePlayRequest = useCallback(
    (item: LyricsItem) => {
      // setPlayingId(item.id);
      playSegment(item.id, item.audio.from, item.audio.to);
    },
    [playSegment],
  );

  const handleLineStopRequest = useCallback(
    (item: LyricsItem) => {
      stop();
    },
    [playingId, stop],
  );

  const handleLineTtsRequest = useCallback(
    async (item: LyricsItem) => {
      pause();
      if (originalLang == null) return;
      const [isNew, ttsId] = await playTts(item, originalLang);
      if (isNew) {
        updateLyricsLine({
          ...item,
          tts: ttsId,
        });
      }
    },
    [originalLang, pause, playTts, updateLyricsLine],
  );

  const handleLineTranslateRequest = useCallback(
    async (item: LyricsItem) => {
      try {
        if (
          originalLang == null ||
          targetLang == null ||
          originalLang == "" ||
          targetLang == ""
        )
          return;
        const translation = await getTranslation(
          originalLang,
          targetLang,
          item.text,
        );
        updateLyricsLine({
          ...item,
          translations: [
            ...item.translations.filter((el) => el.lang != targetLang),
            {
              lang: targetLang,
              content: translation,
            },
          ],
        });
      } catch {}
    },
    [originalLang, targetLang],
  );

  const handleExplanationCancel = useCallback(() => {
    setModal("none");
  }, []);

  const handleExplanationConfirm = useCallback(
    (lyricsLine: LyricsItem) => {
      updateLyricsLine(lyricsLine);
      setModal("none");
    },
    [targetLang],
  );

  return (
    <div className="min-h-screen ">
      <NoteHeader
        originalLang={originalLang}
        targetLang={targetLang}
        setOriginalLang={setOriginalLangFunc}
        setTargetLang={setTargetLang}
        availableOriginalLangs={availableOriginalLangs}
        availableTargetLangs={availableTargetLangs}
        lastSaved={lastSaved}
        saveError={saveError}
      />
      <div className="pb-18 pt-8 pr-4 pl-3 bg-white text-[#37352F] selection:bg-[#cde2f5]">
        {/* Notion Page Container */}
        {/* <audio ref={audioRef} src={audioSrc!} /> */}
        <div className="max-w-3xl mx-auto">
          {/* Page Header (No borders, exact colors) */}
          <div className="mb-4 ml-1">
            <textarea
              className="text-[24px] font-bold text-[#37352F] leading-tight tracking-tight mb-2 w-full resize-none field-sizing-content outline-none overflow-hidden"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="text-base text-[#787774] outline-none "
              onChange={(e) => setSinger(e.target.value)}
              value={singer}
            />
          </div>

          <div className="flex flex-col">
            {lyricsLines.map((line, idx) => {
              const isActive = idx === activeLineIndex;
              const highlight =
                currentTime >= line.audio.from && currentTime < line.audio.to;

              return (
                <LyricsLine
                  key={line.id}
                  targetLang={targetLang}
                  originalLang={originalLang}
                  line={line}
                  idx={idx}
                  isActive={isActive}
                  highlight={highlight}
                  isPlaying={line.id === playingId && isPlaying}
                  setActiveLineIndex={setActiveLineIndex}
                  onExplanationRequest={handleExplanationRequest}
                  onPlayRequest={handleLinePlayRequest}
                  onStopRequest={handleLineStopRequest}
                  onTtsRequest={handleLineTtsRequest}
                  onTranslateRequest={handleLineTranslateRequest}
                />
              );
            })}
            {/* <AddLyricsLineButton handleAddNewLine={handleAddNewLine} /> */}
          </div>
        </div>

        <MusicPlayer audioUrl={audioSrc!} onPlay={handleMusicPlayerPlay} />

        {modal !== "none" && (
          <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
            {modal === "grammar" && (
              <ExplanationModal
                isPlaying={currentLyricsLine!.id === playingId && isPlaying}
                onPlayRequest={handleLinePlayRequest}
                onStopRequest={handleLineStopRequest}
                onTtsRequest={handleLineTtsRequest}
                onTranslateRequest={handleLineTranslateRequest}
                lyricsLine={currentLyricsLine!}
                fullLyrics={lyrics ?? ""}
                originalLang={originalLang}
                targetLang={targetLang}
                onCancel={handleExplanationCancel}
                onConfirm={handleExplanationConfirm}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
