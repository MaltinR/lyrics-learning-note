import { ChevronLeft } from "lucide-react";
import { useCallback } from "react";
import { useNavigate } from "react-router";
import type Lang from "~/interfaces/lang";

export default function NoteHeader({
  originalLang,
  targetLang,
  setOriginalLang,
  setTargetLang,
  availableOriginalLangs,
  availableTargetLangs,
  lastSaved,
  saveError,
}: {
  originalLang: string | null;
  targetLang: string | null;
  setOriginalLang: (lang: string) => void;
  setTargetLang: React.Dispatch<React.SetStateAction<string | null>>;
  availableOriginalLangs: Array<Lang>;
  availableTargetLangs: Array<Lang>;
  lastSaved: Date | null;
  saveError: string | null;
}) {
  const navigate = useNavigate();
  const onOriginalLangChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setOriginalLang(e.target.value);
    },
    [setOriginalLang],
  );

  const onTargetLangChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setTargetLang(e.target.value);
    },
    [setTargetLang],
  );

  const getLastSavedText = useCallback((date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Handle future dates if they occur
    if (diffMs < 0) {
      return "Saved just now";
    }

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `Saved ${days}d ago`;
    } else if (hours > 0) {
      return `Saved ${hours}h ago`;
    } else {
      return `Saved ${minutes}m ago`;
    }
  }, []);

  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center h-14 px-6 bg-white dark:bg-[#191919]">
      {/* Left Column (Empty to balance the right column) */}
      <div className="text-sm text-[#2f2f2f] flex items-center hover:cursor-pointer" onClick={() => navigate("/notes")}>
        <ChevronLeft className="w-4 h-4"/>
        List
        </div>

      {/* Center Column: Language Selection */}
      <div className="flex items-center gap-6">
        {/* Original Language Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            Original:
          </span>
          <select
            value={originalLang || ""}
            onChange={onOriginalLangChange}
            className="px-2.5 py-1 text-sm bg-gray-50 dark:bg-[#2f2f2f] border border-gray-200 dark:border-[#3f3f3f] rounded text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 cursor-pointer"
          >
            <option value="" disabled>
              Select Language
            </option>
            {availableOriginalLangs.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Target Language Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            Target:
          </span>
          <select
            value={targetLang || ""}
            onChange={onTargetLangChange}
            className="px-2.5 py-1 text-sm bg-gray-50 dark:bg-[#2f2f2f] border border-gray-200 dark:border-[#3f3f3f] rounded text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 cursor-pointer"
          >
            <option value="" disabled>
              Select Language
            </option>
            {availableTargetLangs.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Column: Last Saved Info */}
      <div className="flex justify-end">
        {(lastSaved != null || saveError != null) && (
          <div className="text-sm text-gray-400">
            {lastSaved != null ? getLastSavedText(lastSaved) : "Error occurred"}
          </div>
        )}
      </div>
    </header>
  );
}