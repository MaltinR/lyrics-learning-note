export default function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] w-full max-w-lg overflow-hidden border border-[#DEDCD9] animate-in fade-in zoom-in-95 duration-200">
      {children}
    </div>
  );
}
