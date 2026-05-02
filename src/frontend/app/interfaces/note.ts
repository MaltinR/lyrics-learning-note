import type AudioSegment from "./audioSegment";
import type References from "./references";
import type LyricItem from "./lyricsItem";
import type LanguageProfile from "./languageProfile";

export default interface Note {
  id: string;
  title: string;
  singer: string;
  audio: AudioSegment;
  lyrics: LyricItem[];
  references: References;
  language: LanguageProfile;
}