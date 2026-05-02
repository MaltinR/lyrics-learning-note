import {
  Plus,
} from "lucide-react";

export default function AddLyricsLineButton({handleAddNewLine}: {handleAddNewLine: () => void}) {
  return (
    <div
      className="group flex items-start py-[2px] mt-1 cursor-pointer"
      onClick={handleAddNewLine}
    >
      {/* Left Gutter: Static Plus Icon */}
      <div className="w-12 flex-shrink-0 flex justify-end items-center pr-2 pt-[6px]">
        {/* <Plus className="w-[18px] h-[18px] text-content-muted group-hover:text-content transition-colors" /> */}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center min-h-[28px] hover:bg-[#F1F1EF] rounded bg-transparent">
        <div className="flex items-center justify-center">
            <Plus className="w-[18px] h-[18px] ml-2 text-content-muted group-hover:text-content transition-colors" />
        </div>
        <div className="w-full flex items-center px-2 py-1 rounded-[4px] bg-transparent group-hover:bg-surface-hover transition-colors ">
          <span className="text-[16px] text-content-muted group-hover:text-content leading-normal transition-colors">
            Click to add a new line
          </span>
        </div>
      </div>
    </div>
  );
}
