export default function ModalFooterButton({
  type,
  text,
  onClick,
  children,
  disabled,
}:{
      type: "primary" | "secondary";
      text?: string;
      children?: React.ReactNode;
      onClick: () => void;
      disabled?: boolean;
    }) {
  if (type === "primary") {
    return (
      <button
        disabled={disabled}
        onClick={onClick}
        className="px-3.5 py-1.5 text-[13px] rounded-md bg-[#2383E2] disabled:bg-[#91c1f0] hover:bg-[#1A66B8] text-white transition-colors font-medium shadow-sm border border-transparent"
      >
        {text ?? children}
      </button>
    );
  } else {
    return (
      <button
        disabled={disabled}
        onClick={onClick}
        className="px-3.5 py-1.5 text-[13px] rounded-md disabled:bg-[#f8f8f6] hover:bg-[#F2F1EE] text-[#37352F] disabled:text-[#9b9a97] transition-colors font-medium border border-[#DEDCD9]"
      >
        {text ?? children}
      </button>
    );
  }
}
