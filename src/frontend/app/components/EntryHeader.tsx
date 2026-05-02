import { useNavigate } from "react-router";

function getStyle(isCurrent: boolean) {
  if (isCurrent) {
    return "px-3 py-1.5 rounded bg-gray-100 text-gray-900 transition-colors cursor-pointer text-left font-medium";
  } else {
    return "px-3 py-1.5 rounded hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer text-left";
  }
}

export default function EntryHeader({
  current,
}: {
  current: "home" | "notes";
}) {
    const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-sm z-10 px-6 py-4 flex items-center">
      <nav className="flex gap-2 text-[15px] text-gray-600">
        <button className={getStyle(current == "home")} onClick={current != "home" ? () => navigate("/") : () => {}}>Home</button>
        <button className={getStyle(current == "notes")} onClick={current != "notes" ? () => navigate("/notes") : () => {}}>Notes</button>
      </nav>
    </header>
  );
}
