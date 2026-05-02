import axios from "axios";
import type Note from "~/interfaces/note";
import type NoteListInfo from "~/interfaces/noteListInfo";
import { handleSse } from "./sseHandling";

export async function save(note: Note) {
  const url = `/api/songs/${note.id}`;
  const payload = note;

  try {
    await axios.put(url, payload);
  } catch {
    console.error(payload);
  }
}

export async function getAllNotes(): Promise<Array<NoteListInfo>> {
  const url = `/api/songs`;
  const res = await axios.get(url);
  const data: Array<NoteListInfo> = res.data;
  return data;
}

export async function getNote(id: string, baseUrl?: string): Promise<Note> {
  const url: string = `${baseUrl ?? ""}/api/songs/${id}`;
  console.log(url);
  const res = await axios.get(url);
  const data: Note = res.data;
  console.log(data);
  return data;
}

export async function newNote(songUrl: string, onUpdate: (message: string) => void): Promise<Note> {
  const url : string = `/api/songs`;
  const payload = {
    url: songUrl,
  }
  // const res = await a

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
    },
    body: JSON.stringify(payload),
  });

  let note: Note | null = null;

  await handleSse(response, (data) => {
    const jsonData: {
      type: "error" | "update" | "note";
      error?: string;
      update?: string;
      note?: Note;
    } = data;
    if (jsonData.type == "error") {
      throw new Error("Error occurred");
    } else if (jsonData.type == "update") {
      onUpdate(jsonData.update!);
    } else if (jsonData.type === "note") {
      note = jsonData.note!;
    }
  });

  if (note == null) {
    throw new Error("Note is null");
  }
  return note;
}

export async function deleteNote(id: string): Promise<void> {
  const url = `/api/songs/${id}`;
  await axios.delete(url);
}