const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white border border-[#E9E9E7] shadow-sm rounded-lg p-6 ${className}`}>
    {children}
  </div>
);

export default Card;