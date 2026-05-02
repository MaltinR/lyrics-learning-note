const Button = ({ children, onClick, variant = 'default', className = '' }: any) => {
  const baseStyle = "px-4 py-2 rounded-md font-medium transition-colors text-sm flex items-center justify-center gap-2";
  const variants = {
    default: "bg-[#F1F1EF] hover:bg-[#E9E9E7] text-[#37352F] border border-[#E9E9E7]",
    success: "bg-[#D1EAE1] hover:bg-[#BCE3D5] text-[#1D5E46] border border-[#BCE3D5]",
  };
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  );
};

export default Button;