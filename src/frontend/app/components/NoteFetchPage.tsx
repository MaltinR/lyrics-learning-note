import { Loader2 } from "lucide-react";

export default function NoteFetchPage() {
  return (
    <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-[100]">
      <div className="bg-white border border-[#E9E9E7] shadow-[0_4px_24px_rgba(0,0,0,0.06)] rounded-xl py-5 px-6 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
        <Loader2 className="w-5 h-5 text-[#787774] animate-spin" />
        <span className="text-[15px] font-medium text-[#37352F]">
          Loading note
        </span>
      </div>
    </div>
  );
}
