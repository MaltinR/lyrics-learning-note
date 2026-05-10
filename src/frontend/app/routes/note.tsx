
import { getNote as getNoteFunc } from "~/lib/note";
import type { Route } from "./+types/note";
import useIsMobile from "~/hooks/useIsMoile";
import LoadingPage from "~/components/pages/LoadingPage";
import Mobile from "~/components/pages/note/Mobile"
import Desktop from "~/components/pages/note/Desktop"

export async function clientLoader({ request, params }: Route.LoaderArgs) {
  const requestUrl = new URL(request.url);
  const baseUrl = requestUrl.origin;
  try {
    const note = await getNoteFunc(params.noteId, baseUrl);
    return { note };
  } catch {
    throw new Response("Note not found", { status: 404 });
  }
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `${data.note.title} by ${data.note.singer} - LLN` },
    { name: "LLN Note", content: "Note of Lyrics Learning Notes" },
  ];
}

export default function Page() {
  const isMobile = useIsMobile();

  if (isMobile == undefined) {
    return <LoadingPage/>
  }

  if (isMobile) {
    return <Mobile />
  }
  else {
    return <Desktop />
  }
}
