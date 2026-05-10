import { useEffect } from "react";
import useIsMobile from "~/hooks/useIsMoile";

export default function Modal({
  children,
  onCancel,
}: {
  children: React.ReactNode;
  onCancel?: () => void;
}) {
  const isMobile = useIsMobile();

  return (
    <div
      className={
        isMobile
          ? "bg-white w-full h-full flex flex-col h-[100dvh] max-h-screen"
          : "bg-white rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] w-full max-w-lg overflow-hidden border border-[#DEDCD9] animate-in fade-in zoom-in-95 duration-200 flex flex-col"
      }
    >
      {children}
    </div>
  );
}
