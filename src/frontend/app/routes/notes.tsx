import { File, Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import EntryHeader from "~/components/EntryHeader";
import type NoteListInfo from "~/interfaces/noteListInfo";
import { deleteNote, getAllNotes } from "~/lib/note";
import type { Route } from "./+types/notes";

function getTime(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function meta({}: Route.ActionArgs) {
  return [
    { title: "Notes - LLN" },
    { name: "LLN Notes", content: "List of notes" },
  ];
}

const Notes = () => {
  const [noteInfoList, setNoteInfoList] = useState<Array<NoteListInfo> | null>(
    null,
  );
  // State to handle which item is currently selected for deletion
  const [itemToDelete, setItemToDelete] = useState<NoteListInfo | null>(null);
  const navigate = useNavigate();

  const loadNotes = useCallback(async () => {
    const list = await getAllNotes();
    setNoteInfoList(list);
  }, []);

  useEffect(() => {
    loadNotes();
  }, []);

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    // Optimistic UI update: remove the item locally
    setNoteInfoList((prev) => 
      prev?.filter((note) => note.id !== itemToDelete.id) || null
    );
    
    await deleteNote(itemToDelete.id);

    setItemToDelete(null);
  };

  return (
    <div className="min-h-screen bg-white font-sans relative">
      <EntryHeader current="notes" />

      {/* Main Content Area */}
      <div className="flex justify-center pt-28 pb-16">
        <div className="w-full max-w-lg pl-8 pr-2">
          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-8 pl-2">Notes</h1>

          {noteInfoList != null ? (
            <div className="flex flex-col">
              {noteInfoList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/notes/${item.id}`)}
                  className="group relative flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors hover:bg-gray-100"
                >
                  {/* Bin Icon - Absolute positioned to the left (Notion style) */}
                  <div
                    className="absolute -left-7 flex items-center justify-center w-6 h-6 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-opacity cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent navigating to the note
                      setItemToDelete(item);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-gray-400 stroke-[1.5]" />
                  </div>

                  <File className="w-4 h-4 text-gray-400 stroke-[1.5] shrink-0" />

                  <div className="text-4 text-gray-700 flex justify-between w-full items-center">
                    <div className="flex items-center">
                      <div className="font-bold">{item.title}</div>
                      <span className="ml-1 text-gray-600">
                        {`by ${item.singer}`}
                      </span>
                    </div>
                    <div>{getTime(item.duration)}</div>
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

      {/* Notion-style Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-opacity">
          <div 
            className="bg-white rounded-lg shadow-xl border border-gray-200 p-5 w-full max-w-sm m-4 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[16px] font-semibold text-gray-900 mb-2">Delete Note</h2>
            <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
              Are you sure you want to remove <strong>"{itemToDelete.title}"</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-1.5 text-[14px] font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-1.5 text-[14px] font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;