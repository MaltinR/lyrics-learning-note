import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import { v4 as uuid } from "uuid";
import { MicVocal } from "lucide-react";
import type Note from "~/interfaces/note";
import LyricsReviewer from "~/components/LyricsReviewer";
import type { Step } from "~/types/step";
import LyricsSourceSelector from "~/components/LyricsSourceSelector";
import NoteFetchPage from "~/components/NoteFetchPage";
import type LyricsSourceInfo from "~/interfaces/lyricsSourceInfo";
import AddLyricsLineButton from "~/components/AddLyricsLineButton";
import LyricsLineEditModal from "~/components/LyricsLineEditModal";
import type { ModalType } from "~/types/modalType";
import type LyricsItem from "~/interfaces/lyricsItem";
import LyricsLine from "~/components/LyricsLineDesktop";
import MusicPlayer from "~/components/MusicPlayerDesktop";
import useGlobalAudio from "~/hooks/useGlobalAudio";
import useGlobalTts from "~/hooks/useGlobalTts";
import { loadSong as loadSongFunc } from "~/lib/song";
import { save, getNote as getNoteFunc } from "~/lib/note";
import { detectLang, getFromLangs, getToLangs } from "~/lib/lang";
import type Lang from "~/interfaces/lang";
import NoteHeader from "~/components/NoteHeaderDesktop";
import ExplanationModal from "~/components/ExplanationModal";
import { getTranslation } from "~/lib/translate";

const defaultLineDuration = 4;
const prepareDuration = 1;

export default function Page() {
  const { noteId } = useParams();

  const [step, setStep] = useState<Step>("fetch");
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
  const [originalLangName, setOriginalLangName] = useState<string | null>(null);
  const [availableOriginalLangs, setAvailableOriginalLangs] = useState<
    Array<Lang>
  >([]);
  const [targetLang, setTargetLang] = useState<string | null>(null);
  const [targetLangName, setTargetLangName] = useState<string | null>(null);
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

  const loadLangs = useCallback(
    async (
      setAvailableOriginalLangs: React.Dispatch<React.SetStateAction<Lang[]>>,
      setAvailableTargetLangs: React.Dispatch<React.SetStateAction<Lang[]>>,
      setTargetLang: React.Dispatch<React.SetStateAction<string | null>>,
      setTargetLangName: React.Dispatch<React.SetStateAction<string | null>>,
      setOriginalLangName: React.Dispatch<React.SetStateAction<string | null>>,
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

      if (originalLang != null && originalLangName == null){
        const lang = fromLangs.find(el => el.id == originalLang);
        if (lang != null) {
          setOriginalLangName(lang.name);
        }
      }

      if (targetLang != null && targetLangName == null) {
        const lang = toLangs.find(el => el.id == targetLang);
        if (lang != null) {
          setTargetLangName(lang.name);
        }
      } else if (english != null) {
        setTargetLang(english.id);
        setTargetLangName(english.name);
      }
    },
    [originalLang, originalLangName, targetLang, targetLangName],
  );

  const setOriginalLangFunc = useCallback(
    (lang: string, name: string) => {
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
      setOriginalLangName(lang);
    },
    [setOriginalLang, setOriginalLangName],
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
        if (availableOriginalLangs.length > 0) {
          const lang = availableOriginalLangs.find(el => el.id === data.language.original);
          if (lang != null) {
            setOriginalLangName(lang.name);
          }
        }
      }
      if (data.language.target) {
        setTargetLang(data.language.target);
        if (availableTargetLangs.length > 0) {
          const lang = availableTargetLangs.find(el => el.id === data.language.target);
          if (lang != null) {
            setTargetLangName(lang.name);
          }
        }
      }

      // Download song
      const blob = await loadSongFunc(noteId);
      setAudioSrc(URL.createObjectURL(blob));
      setAudioBlob(blob);

      if (data.references.fullLyrics == null) {
        setStep("source");
      } else {
        setStep("player");
      }
    } catch (e: any) {
      console.error(e);
      console.trace();
    }
  }, [availableOriginalLangs, availableTargetLangs]);

  const detectOriginalLang = useCallback(
    async (lyrics: string | null, setOriginalLang: (lang: string) => void) => {
      if (lyrics == null) return;
      const lang = await detectLang(lyrics);
      setOriginalLang(lang);
    },
    [],
  );

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

  const handleEditRequest = useCallback((line: LyricsItem) => {
    setCurrentLyricsLine(line);
    setModal("edit");
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

  const handleEditLyrics = useCallback(() => {
    setStep("review");
  }, []);

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
        // ignore if it exists already
        const targetTranslation = item.translations.find(el => el.lang == targetLang);
        if (targetTranslation != null) {
          return;
        }
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

  const originalLangItem : Lang | null = useMemo(() => {
    if (originalLang == null || originalLangName == null)
    {
      return null;
    }
    return {
      id: originalLang,
      name: originalLangName,
    }
  }, [originalLang, originalLangName])
  
  const targetLangItem : Lang | null = useMemo(() => {
    if (targetLang == null || targetLangName == null)
    {
      return null;
    }
    return {
      id: targetLang,
      name: targetLangName,
    }
  }, [targetLang, targetLangName])

  useEffect(() => {
    if (originalLang == null && lyrics != "" && lyrics != null) {
      console.log("setOriginalLangFunc");
      detectOriginalLang(lyrics, setOriginalLangFunc);
    }
  }, [lyrics, originalLang, setOriginalLangFunc]);

  useEffect(() => {

    return () => {
      stop();
    }
  }, [stop]);
  

  useEffect(() => {
    loadLangs(
      setAvailableOriginalLangs,
      setAvailableTargetLangs,
      setTargetLang,
      setTargetLangName,
      setOriginalLangName
    );
  }, [loadLangs]);

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

  useEffect(() => {
    if (step !== "player" && activeLineIndex != -1) {
      setActiveLineIndex(-1);
    }
  }, [step, activeLineIndex])

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

  if (step === "fetch") {
    return <NoteFetchPage />;
  }

  // --- View: Choose Source ---
  if (step === "source") {
    return (
      <LyricsSourceSelector
        title={title}
        setStep={setStep}
        setLyricsSource={setLyricsSource}
      />
    );
  }

  // --- View: Review Lyrics ---
  if (step === "review") {
    return (
      <LyricsReviewer
        lyricsSource={lyricsSource}
        oldLyrics={lyrics}
        setStep={setStep}
        onLyricsChange={handleLyricsChange}
      />
    );
  }

  // --- View: Main Player & Workspace (NOTION STYLE) ---
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
      <div className="pb-32 pt-20 px-8 bg-white text-[#37352F] selection:bg-[#cde2f5]">
        {/* Notion Page Container */}
        {/* <audio ref={audioRef} src={audioSrc!} /> */}
        <div className="max-w-3xl mx-auto">
          {/* Page Header (No borders, exact colors) */}
          <div className="mb-10 ml-12">
            <textarea
              className="text-[40px] font-bold text-[#37352F] leading-tight tracking-tight mb-2 w-full resize-none field-sizing-content outline-none overflow-hidden"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="text-base text-[#787774] outline-none "
              onChange={(e) => setSinger(e.target.value)}
              value={singer}
            />
              <div className="text-[#787774] text-sm my-4 flex items-center hover:cursor-pointer" onClick={handleEditLyrics}>
                <MicVocal className="w-4 h-4"/>
                <div className="ml-1">{`Edit lyrics${(!lyrics ? " (Lyrics reference is not filled)" : "")}`}</div>
                </div>
          </div>


          {/* Lyrics List (Blocks) */}
          <div className="flex flex-col">
            {lyricsLines.map((line, idx) => {
              const isActive = idx === activeLineIndex;
              const highlight =
                currentTime >= line.audio.from && currentTime < line.audio.to;
              const prepare = currentTime >= line.audio.from - prepareDuration && currentTime < line.audio.from;

              return (
                <LyricsLine
                  key={line.id}
                  targetLang={targetLang}
                  originalLang={originalLang}
                  line={line}
                  idx={idx}
                  isActive={isActive}
                  highlight={highlight}
                  prepare={prepare}
                  draggedIndex={draggedIndex}
                  activeLineIndex={activeLineIndex}
                  isPlaying={line.id === playingId && isPlaying}
                  setActiveLineIndex={setActiveLineIndex}
                  setDraggedIndex={setDraggedIndex}
                  setLyricsLines={setLyricsLines}
                  onEditRequest={handleEditRequest}
                  onExplanationRequest={handleExplanationRequest}
                  onPlayRequest={handleLinePlayRequest}
                  onStopRequest={handleLineStopRequest}
                  onTtsRequest={handleLineTtsRequest}
                  onTranslateRequest={handleLineTranslateRequest}
                />
              );
            })}
            <AddLyricsLineButton handleAddNewLine={handleAddNewLine} />
          </div>
        </div>

        <MusicPlayer audioUrl={audioSrc!} onPlay={handleMusicPlayerPlay} />

        {/* --- Modals Overlay --- */}
        {modal !== "none" && (
          <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 p-4">
            {/* Edit Modal */}
            {modal === "edit" && (
              <LyricsLineEditModal
                audioBlob={audioBlob!}
                lyricsLine={currentLyricsLine!}
                fullLyrics={lyrics}
                onLyricsLineChanged={handleLyricsLineChange}
                setModal={setModal}
              />
            )}

            {/* Grammar Modal */}
            {modal === "grammar" && (
              <ExplanationModal
                isPlaying={currentLyricsLine!.id === playingId && isPlaying}
                onPlayRequest={handleLinePlayRequest}
                onStopRequest={handleLineStopRequest}
                onTtsRequest={handleLineTtsRequest}
                onTranslateRequest={handleLineTranslateRequest}
                lyricsLine={currentLyricsLine!}
                fullLyrics={lyrics ?? ""}
                originalLang={originalLangItem}
                targetLang={targetLangItem}
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
