import type Translation from "./translation";
import type AudioSegment from "./audioSegment";
import type Explanation from "./explanation";

export default interface LyricsItem {
  id: string;
  text: string;
  translations: Translation[];
  explanations: Explanation[];
  tts: string | null;
  audio: AudioSegment;
}
