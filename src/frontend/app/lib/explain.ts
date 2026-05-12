import { handleSse } from "./sseHandling";

export async function getExplanationStream(
  fromLangName: string,
  toLangName: string,
  lyricsLine: string,
  fullLyrics: string,
  handleChunk: (chunk: string) => void,
) {
  const payload = {
    fromLang: fromLangName,
    toLang: toLangName,
    lyricsLine,
    fullLyrics,
  };
  try {

  const response = await fetch("/api/explain", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Optional: Good practice to tell the server we accept event-streams
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed with status ${response.status}: ${errorText}`);
  }

  await handleSse(response, (data) => {
    const jsonData: {
      type: "error" | "deltaText";
      error?: string;
      deltaText?: string;
    } = data;
    if (jsonData.type == "error") {
      throw new Error("Error occurred");
    } else if (jsonData.type == "deltaText") {
      handleChunk(jsonData.deltaText!);
    }
  });

  }
  catch (e: any) {
    console.log(payload);
    console.log(JSON.stringify(payload));
    throw(e);
  }
}
