import { Loader2, Trash2, File } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import EntryHeader from "~/components/EntryHeader";
import type NoteListInfo from "~/interfaces/noteListInfo";
import { deleteNote, getAllNotes } from "~/lib/note";
import { getTime } from "~/lib/utils";

const Notes = () => {
  const [noteInfoList, setNoteInfoList] = useState<Array<NoteListInfo> | null>(
    null,
  );
  const navigate = useNavigate();

  const loadNotes = useCallback(async () => {
    const list = await getAllNotes();
    setNoteInfoList(list);
  }, []);

  useEffect(() => {
    loadNotes();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans relative">
      <div className="flex justify-center pt-18 pb-16">
        <div className="w-full max-w-lg pl-4 pr-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 pl-2">Notes</h1>

          {noteInfoList != null ? (
            <div className="flex flex-col">
              {noteInfoList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/notes/${item.id}`)}
                  className="group relative flex items-center gap-2 py-1 rounded cursor-pointer transition-colors hover:bg-gray-100"
                >
                  <File className="w-4 h-4 text-gray-400 stroke-[1.5] shrink-0" />

                  <div className="text-4 text-gray-700 flex justify-between w-full items-center">
                    <div className="flex flex-1 items-center mr-1">
                      <div className="font-bold flex-1">{item.title}</div>
                      <span className="ml-1 text-gray-600 min-w-18 max-w-18">
                        {`by ${item.singer}`}
                      </span>
                    </div>
                    <div className="min-w-8 max-w-8">{getTime(item.duration)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <Loader2 className="w-12 h-12 text-[#787774] animate-spin" />
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Notes;