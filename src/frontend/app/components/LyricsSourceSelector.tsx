import type LyricsSource from "~/interfaces/lyricsSource";
import Card from "./Card";
import type { Step } from "~/types/step";
import { Edit3, Check, X, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import type LyricsSourceInfo from "~/interfaces/lyricsSourceInfo";

interface LyricsSearchResponse {
  songs: Array<{
    providerId: string;
    songId: string;
    title: string;
    url: string;
    singer: string;
  }>;
}

function ManualInputButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 p-3 mt-4 text-[14px] font-medium text-content-sub bg-transparent border border-ui-border rounded-md hover:bg-surface-hover hover:text-content transition-colors cursor-pointer"
    >
      <Edit3 className="w-4 h-4" />
      Enter Lyrics Manually
    </button>
  );
}

export default function LyricsSourceSelector({
  title,
  setStep,
  setLyricsSource,
}: {
  title: string;
  setStep: (step: Step) => void;
  setLyricsSource: (source: LyricsSourceInfo | null) => void;
}) {
  const [keyword, setKeyword] = useState<string>(title);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [sources, setSources] = useState<Array<LyricsSource>>([]);
  const [lastCompleteKeyword, setLastCompleteKeyword] =
    useState<string>(keyword);

  const onEdit = useCallback(() => {
    setIsEditing(true);
    setLastCompleteKeyword(keyword);
  }, [keyword]);

  const onInputChanged = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setKeyword(e.target.value);
    },
    [],
  );

  const onEditUndo = useCallback(() => {
    setIsEditing(false);
    setKeyword(lastCompleteKeyword);
  }, [lastCompleteKeyword]);

  const completeEdit = useCallback(() => {
    setIsEditing(false);
    setLastCompleteKeyword(keyword);
    if (lastCompleteKeyword !== keyword) {
      searchLyrics(keyword);
    }
  }, [lastCompleteKeyword, keyword]);

  const onEditComplete = useCallback(async () => {
    completeEdit();
  }, [completeEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        completeEdit();
      }
    },
    [completeEdit],
  );

  const searchLyrics = useCallback(async (keyword: string) => {
    try {
      setIsFetching(true);
      const url = "/api/lyrics/search";
      const payload = {
        keyword,
      };
      console.log(payload);
      const res = await axios.post(url, payload);
      console.log(res.data);
      const data: LyricsSearchResponse = res.data;
      setSources(
        data.songs.map((song) => ({
          id: song.songId,
          provider: song.providerId,
          song: song.title,
          url: song.url,
          singer: song.singer,
          duration: undefined,
        })),
      );
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    searchLyrics(keyword);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white text-[#37352F]">
      <Card className="w-full max-w-xl">
        <h1 className="text-xl font-semibold mb-4 border-b pb-2">
          CHOOSE LYRICS SOURCE
          <div className="flex mt-2 min-h-12">
            {isEditing ? (
              <>
                <textarea
                  className="text-sm text-[#5e5d58] w-full mr-1 resize-none focus:outline-0"
                  value={keyword}
                  onChange={onInputChanged}
                  onKeyDown={handleKeyDown}
                />
                <div>
                  <Check
                    className="text-[#5e5d58] ml-auto w-4 min-w-4"
                    onClick={onEditComplete}
                  />
                  <X
                    className="text-[#5e5d58] ml-auto w-4 min-w-4"
                    onClick={onEditUndo}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-[#5e5d58] mr-1">{keyword}</p>
                <Edit3
                  className="text-[#5e5d58] ml-auto w-4 min-w-4"
                  onClick={onEdit}
                />
              </>
            )}
          </div>
        </h1>
        <div className="space-y-2 mb-1">
          {isFetching && (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="w-5 h-5 text-[#787774] animate-spin" />
            </div>
          )}
          {!isFetching && sources.length === 0 && <div className="flex flex-1"><div>No matches found, please try again with other keywords</div></div>}
          {!isFetching &&
            sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-3 border border-[#E9E9E7] rounded-md hover:bg-[#F1F1EF] cursor-pointer transition-colors"
                onClick={() => {
                  setStep("review");
                  setLyricsSource({
                    providerId: source.provider,
                    songId: source.id,
                  });
                }}
              >
                <div>
                  <p className="font-medium text-sm">Song: {source.song}</p>
                  <p className="text-xs text-[#787774]">
                    Singer: {source.singer}
                  </p>
                </div>
              </div>
            ))}
          <ManualInputButton onClick={() => {
            setStep("review");
            setLyricsSource(null);
          }}/>
        </div>
      </Card>
    </div>
  );
}
