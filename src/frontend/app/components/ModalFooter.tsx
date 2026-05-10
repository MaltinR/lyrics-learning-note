export default function ModalFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-3.5 border-t border-[#DEDCD9] flex justify-end gap-2.5 bg-[#FBFBFA] shrink-0">
      {children}
    </div>
  );
}
