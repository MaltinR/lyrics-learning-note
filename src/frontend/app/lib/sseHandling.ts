export async function handleSse(
  response: Response,
  onJsonReceive: (data: any) => void,
) {
  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");

    buffer = parts.pop() || "";

    for (const part of parts) {
      const line = part.trim();
      if (!line) continue;

      const chunkText = line.replace(/^data:\s*/, "");

      // console.log(chunkText);

      onJsonReceive(JSON.parse(chunkText));
    }
  }
}
