import { Loader2 } from "lucide-react";

export default function Page() {
  return (
    <div className="flex min-h-screen justify-center items-center">
      <Loader2 className="w-16 h-16 text-[#787774] animate-spin" />
    </div>
  );
}
