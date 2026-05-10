import Desktop from "~/components/pages/notes/Desktop";
import Mobile from "~/components/pages/notes/Mobile";
import LoadingPage from "~/components/pages/LoadingPage";
import type { Route } from "./+types/notes";
import useIsMobile from "~/hooks/useIsMoile";

export function meta({}: Route.ActionArgs) {
  return [
    { title: "Notes - LLN" },
    { name: "LLN Notes", content: "List of notes" },
  ];
}

export default function Page() {
  const isMobile = useIsMobile();
  
  if (isMobile === undefined) {
    return <LoadingPage />
  }
  if (isMobile) {
    return <Mobile/>
  }

  return <Desktop/>
}