import { X } from "lucide-react";

export default function ModalHeader({
  title,
  onClose = undefined,
}: {
  title: string;
  onClose?: () => void;
}) {
  return (
    <div className="px-5 py-4 border-b border-[#DEDCD9] flex justify-between items-center">
      <h3 className="text-[14px] font-semibold text-[#37352F]">{title}</h3>
      {onClose != null ? (
        <button
          //   onClick={() => setModal("none")}
          onClick={onClose}
          className="text-[#7C7B76] hover:bg-[#F2F1EE] rounded p-1.5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      ) : (
        <></>
      )}
    </div>
  );
}
