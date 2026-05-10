import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
import type { Route } from "./+types/note";
import useIsMobile from "~/hooks/useIsMoile";
import LoadingPage from "~/components/pages/LoadingPage";
import Mobile from "~/components/pages/note/Mobile"
import Desktop from "~/components/pages/note/Desktop"

const defaultLineDuration = 2;

export async function loader({ request, params }: Route.LoaderArgs) {
  const requestUrl = new URL(request.url);
  const baseUrl = requestUrl.origin;
  try {
    const note = await getNoteFunc(params.noteId, baseUrl);
    return { note };
  } catch {
    throw new Response("Note not found", { status: 404 });
  }
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `${data.note.title} by ${data.note.singer} - LLN` },
    { name: "LLN Note", content: "Note of Lyrics Learning Notes" },
  ];
}

export default function Page() {
  const isMobile = useIsMobile();

  if (isMobile == undefined) {
    return <LoadingPage/>
  }

  if (isMobile) {
    return <Mobile />
  }
  else {
    return <Desktop />
  }
}
