export async function generateTts(
  noteId: string,
  lang: string,
  content: string,
): Promise<[string, Blob]> {
  const url = "/api/tts";
  const payload = {
    noteId,
    lang,
    content,
  };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error("Failed to download audio");
    }
    const disposition = response.headers.get("Content-Disposition");
    let filename = "";
    if (disposition && disposition.includes("filename=")) {
      // Regex or split to get the filename value and strip quotes
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
        disposition,
      );
      if (matches && matches[1]) {
        filename = matches[1].replace(/['"]/g, "").trim();
      }
    }

    console.log(filename);
    const baseName = filename.replace(/\.mp3$/, ""); // Yields "xx-x"
    const blob = await response.blob();
    return [baseName, blob];
  } catch (e: any) {
    console.error(payload);
    throw e;
  }
}
