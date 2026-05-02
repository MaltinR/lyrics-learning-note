export default interface LyricsSource {
    id: string;
    song: string;
    singer: string;
    duration: number | undefined;
    url: string;
    provider: string;
}