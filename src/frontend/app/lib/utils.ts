export function getTime(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}