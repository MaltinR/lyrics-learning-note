import { ChevronLeft } from "lucide-react";
import { useCallback } from "react";
import { useNavigate } from "react-router";
import type Lang from "~/interfaces/lang";

function LangDropdown({
  lang,
  availableLangs,
  onLangChange,
  disabled = false,
}: {
  lang: string | null;
  availableLangs: Array<Lang>;
  onLangChange: (value: string) => void;
  disabled?: boolean,
}) {
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onLangChange(e.target.value);
    },
    [onLangChange],
  );
return (
  <div className="flex items-center w-full"> {/* Parent must have a width for flex-1 to work */}
    <select
      value={lang || ""}
      onChange={onChange}
      // Added flex-1 and w-0
      className="flex-1 w-0 px-2.5 py-2 text- text-sm bg-gray-50 border border-gray-200 rounded text-gray-700 focus:outline-0"
      disabled={disabled}
    >
      <option value="" disabled>
        Select Language
      </option>
      {availableLangs.map((lang) => (
        <option key={lang.id} value={lang.id}>
          {lang.name}
        </option>
      ))}
    </select>
  </div>
);
}

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
    // (e: React.ChangeEvent<HTMLSelectElement>) => {
    //   setOriginalLang(e.target.value);
    // },
    (value: string) => {
      setOriginalLang(value);
    },
    [setOriginalLang],
  );

  const onTargetLangChange = useCallback(
    // (e: React.ChangeEvent<HTMLSelectElement>) => {
    //   setTargetLang(e.target.value);
    // },
    (value: string) => {
      setTargetLang(value);
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
    <header className="items-center px-3 py-2 bg-white dark:bg-[#191919] border-b border-gray-200">
      <div className="h-8 flex items-center justify-between mb-1">
        <div
          className="text-md text-[#2f2f2f] flex items-center"
          onClick={() => navigate("/notes")}
        >
          <ChevronLeft className="w-4 h-4" />
          List
        </div>
        <div className="flex justify-end">
          {(lastSaved != null || saveError != null) && (
            <div className="text-sm text-gray-400">
              {lastSaved != null
                ? getLastSavedText(lastSaved)
                : "Error occurred"}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <LangDropdown
          lang={originalLang}
          onLangChange={onOriginalLangChange}
          availableLangs={availableOriginalLangs}
          disabled={true}
        />
        <LangDropdown
          lang={targetLang}
          onLangChange={onTargetLangChange}
          availableLangs={availableTargetLangs}
        />
      </div>
    </header>
  );
}
