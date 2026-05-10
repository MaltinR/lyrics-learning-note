import React, { useState, useEffect, useRef, useCallback } from "react";

interface AudioTimeSelectorProps {
  /** The audio file as a Blob */
  audioBlob?: Blob | null;
  /** Callback fired when selection changes, passing start and end times in seconds */
  onChange?: (start: number, end: number) => void;
  /** Current playing time from an external audio player */
  currentTime?: number;
  /** Callback fired when the user drags the playhead or types a new current time */
  onCurrentTimeChange?: (time: number) => void;
  /** Initial start time (optional) */
  initialStart?: number;
  /** Initial end time (optional) */
  initialEnd?: number;
}

type DragAction =
  | "sel-left"
  | "sel-right"
  | "sel-move"
  | "zoom-left"
  | "zoom-right"
  | "zoom-move"
  | "playhead-move"
  | null;

// Tiny sub-component for handling robust text input of numeric time values
const TimeInput = ({
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) => {
  const [tempStr, setTempStr] = useState(value.toFixed(2));

  useEffect(() => {
    setTempStr(value.toFixed(2));
  }, [value]);

  const commit = () => {
    let parsed = parseFloat(tempStr);
    if (isNaN(parsed)) parsed = value;
    parsed = Math.max(min, Math.min(max, parsed));
    setTempStr(parsed.toFixed(2));
    if (parsed !== value) onChange(parsed);
  };

  return (
    <input
      type="text"
      value={tempStr}
      disabled={disabled}
      onChange={(e) => setTempStr(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      className="w-[46px] bg-transparent border-b border-transparent hover:border-[#E9E9E7] focus:border-[#2383E2] outline-none text-center transition-colors disabled:opacity-50"
    />
  );
};

export default function AudioTimeSelector({
  audioBlob,
  onChange,
  currentTime,
  onCurrentTimeChange,
  initialStart = 0,
  initialEnd = 0,
}: AudioTimeSelectorProps) {
  // DOM Refs
  const mainTrackRef = useRef<HTMLDivElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);

  // Audio State
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const [waveData, setWaveData] = useState<number[]>([]);
  const [duration, setDuration] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Time/Selection/Playhead State
  const [start, setStart] = useState<number>(initialStart);
  const [end, setEnd] = useState<number>(initialEnd);
  const [currentPlayTime, setCurrentPlayTime] = useState<number>(initialStart);

  // Viewport/Zoom State
  const [viewStart, setViewStart] = useState<number>(0);
  const [viewEnd, setViewEnd] = useState<number>(1);

  // Dragging State
  const [dragging, setDragging] = useState<DragAction>(null);
  const dragStartRef = useRef<{
    mouseX: number;
    startVal: number;
    endVal: number;
    viewStartVal: number;
    viewEndVal: number;
    playheadVal: number;
    durationVal: number;
    containerWidth: number;
  }>({
    mouseX: 0,
    startVal: 0,
    endVal: 0,
    viewStartVal: 0,
    viewEndVal: 1,
    playheadVal: 0,
    durationVal: 1,
    containerWidth: 0,
  });

  // Maintain reference to the latest callbacks
  const onChangeRef = useRef(onChange);
  const onCurrentTimeChangeRef = useRef(onCurrentTimeChange);
  useEffect(() => {
    onChangeRef.current = onChange;
    onCurrentTimeChangeRef.current = onCurrentTimeChange;
  }, [onChange, onCurrentTimeChange]);

  // Sync external currentTime prop when not actively dragging
  useEffect(() => {
    if (currentTime !== undefined && !dragging) {
      const clamped = Math.max(start, Math.min(currentTime, end));
      setCurrentPlayTime(clamped);
    }
  }, [currentTime, dragging, start, end]);

  // 1. Process the Audio Blob (Run once when blob changes)
  useEffect(() => {
    if (!audioBlob) {
      setWaveData(Array(150).fill(0.05));
      setDuration(60);
      setViewStart(0);
      setViewEnd(60);
      return;
    }

    const processAudio = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        audioBufferRef.current = audioBuffer;
        const fileDuration = audioBuffer.duration;
        setDuration(fileDuration);

        // Responsive Zoom Implementation
        if (initialStart > 0 || initialEnd > 0) {
          const initS = initialStart;
          const initE = initialEnd || fileDuration;
          const selDuration = initE - initS;

          // 15% padding around the initial selection for optimal initial zoom
          const padding = selDuration * 0.15;

          setViewStart(Math.max(0, initS - padding));
          setViewEnd(Math.min(fileDuration, initE + padding));
          setStart(initS);
          setEnd(initE);
          setCurrentPlayTime(initS);
        } else {
          const defaultStart = fileDuration * 0.1;
          const defaultEnd = fileDuration * 0.9;
          setStart(defaultStart);
          setEnd(defaultEnd);
          setCurrentPlayTime(defaultStart);
          setViewStart(0);
          setViewEnd(fileDuration);
        }
      } catch (err) {
        console.error("Error decoding audio:", err);
        setError("Failed to decode audio file.");
      } finally {
        setIsLoading(false);
      }
    };

    processAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  // 2. Dynamically Generate Waveform based on Zoom Level
  useEffect(() => {
    if (!audioBufferRef.current) return;

    const rawData = audioBufferRef.current.getChannelData(0);
    const sampleRate = audioBufferRef.current.sampleRate;
    const totalSamples = rawData.length;

    const startIndex = Math.max(0, Math.floor(viewStart * sampleRate));
    const endIndex = Math.min(totalSamples, Math.floor(viewEnd * sampleRate));
    const viewSamples = endIndex - startIndex;

    const visualBars = 150;
    const blockSize = Math.max(1, Math.floor(viewSamples / visualBars));
    const newWaveData = [];
    let maxAmp = 0;

    for (let i = 0; i < visualBars; i++) {
      let blockStart = startIndex + blockSize * i;
      let sum = 0;
      const limit = Math.min(blockSize, totalSamples - blockStart);

      for (let j = 0; j < limit; j++) {
        if (blockStart + j < totalSamples) {
          sum += Math.abs(rawData[blockStart + j]);
        }
      }

      const avg = limit > 0 ? sum / limit : 0;
      newWaveData.push(avg);
      if (avg > maxAmp) maxAmp = avg;
    }

    const normalized = newWaveData.map((n) => (maxAmp ? n / maxAmp : 0));
    const finalData = normalized.map((n) => Math.max(n, 0.05));
    setWaveData(finalData);
  }, [viewStart, viewEnd, duration]);

  // 3. Setup Drag Actions
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: DragAction, containerRef: React.RefObject<HTMLDivElement>) => {
      if (!containerRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      setDragging(type);
      const rect = containerRef.current.getBoundingClientRect();

      dragStartRef.current = {
        mouseX: e.clientX,
        startVal: start,
        endVal: end,
        viewStartVal: viewStart,
        viewEndVal: viewEnd,
        playheadVal: currentPlayTime,
        durationVal: duration,
        containerWidth: rect.width,
      };
    },
    [start, end, viewStart, viewEnd, currentPlayTime, duration]
  );

  // 4. Handle Global Mouse Movements for Dragging
  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const {
        mouseX,
        startVal,
        endVal,
        viewStartVal,
        viewEndVal,
        playheadVal,
        durationVal,
        containerWidth,
      } = dragStartRef.current;
      const deltaX = e.clientX - mouseX;

      if (dragging.startsWith("sel")) {
        const viewDuration = viewEndVal - viewStartVal;
        const deltaSeconds = (deltaX / containerWidth) * viewDuration;
        const minGap = 0.1;

        let newStart = startVal;
        let newEnd = endVal;

        if (dragging === "sel-left") {
          newStart = Math.max(0, Math.min(startVal + deltaSeconds, endVal - minGap));
          setStart(newStart);
        } else if (dragging === "sel-right") {
          newEnd = Math.min(durationVal, Math.max(endVal + deltaSeconds, startVal + minGap));
          setEnd(newEnd);
        } else if (dragging === "sel-move") {
          const span = endVal - startVal;
          newStart = startVal + deltaSeconds;
          newEnd = newStart + span;

          if (newStart < 0) {
            newStart = 0;
            newEnd = span;
          } else if (newEnd > durationVal) {
            newEnd = durationVal;
            newStart = durationVal - span;
          }
          setStart(newStart);
          setEnd(newEnd);
        }

        if (onChangeRef.current) onChangeRef.current(newStart, newEnd);

        // Clamp playhead if it falls outside newly resized boundaries
        if (currentPlayTime < newStart) updateCurrentTime(newStart);
        else if (currentPlayTime > newEnd) updateCurrentTime(newEnd);
      } 
      else if (dragging === "playhead-move") {
        const viewDuration = viewEndVal - viewStartVal;
        const deltaSeconds = (deltaX / containerWidth) * viewDuration;
        const newTime = Math.max(startVal, Math.min(endVal, playheadVal + deltaSeconds));
        setCurrentPlayTime(newTime);
        if (onCurrentTimeChangeRef.current) onCurrentTimeChangeRef.current(newTime);
      } 
      else if (dragging.startsWith("zoom")) {
        const deltaSeconds = (deltaX / containerWidth) * durationVal;
        const minZoomGap = durationVal * 0.05;

        let newViewStart = viewStartVal;
        let newViewEnd = viewEndVal;

        if (dragging === "zoom-left") {
          newViewStart = Math.max(0, Math.min(viewStartVal + deltaSeconds, viewEndVal - minZoomGap));
          setViewStart(newViewStart);
        } else if (dragging === "zoom-right") {
          newViewEnd = Math.min(durationVal, Math.max(viewEndVal + deltaSeconds, viewStartVal + minZoomGap));
          setViewEnd(newViewEnd);
        } else if (dragging === "zoom-move") {
          const span = viewEndVal - viewStartVal;
          newViewStart = viewStartVal + deltaSeconds;
          newViewEnd = newViewStart + span;

          if (newViewStart < 0) {
            newViewStart = 0;
            newViewEnd = span;
          } else if (newViewEnd > durationVal) {
            newViewEnd = durationVal;
            newViewStart = durationVal - span;
          }
          setViewStart(newViewStart);
          setViewEnd(newViewEnd);
        }
      }
    };

    const handleMouseUp = () => setDragging(null);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, currentPlayTime]);

  // Manual Handlers for Input Syncs
  const updateCurrentTime = (val: number) => {
    const newTime = Math.max(start, Math.min(val, end));
    setCurrentPlayTime(newTime);
    if (onCurrentTimeChangeRef.current) onCurrentTimeChangeRef.current(newTime);
  };

  const handleStartChange = (val: number) => {
    const newStart = Math.max(0, Math.min(val, end - 0.1));
    setStart(newStart);
    if (onChangeRef.current) onChangeRef.current(newStart, end);
    if (currentPlayTime < newStart) updateCurrentTime(newStart);
  };

  const handleEndChange = (val: number) => {
    const newEnd = Math.max(start + 0.1, Math.min(val, duration));
    setEnd(newEnd);
    if (onChangeRef.current) onChangeRef.current(start, newEnd);
    if (currentPlayTime > newEnd) updateCurrentTime(newEnd);
  };

  // Math Variables for rendering bounds
  const viewDuration = viewEnd - viewStart;
  
  // Selection
  const visualStart = Math.max(start, viewStart);
  const visualEnd = Math.min(end, viewEnd);
  const selLeftPercent = Math.max(0, ((start - viewStart) / viewDuration) * 100);
  const selWidthPercent = visualEnd > visualStart ? ((visualEnd - visualStart) / viewDuration) * 100 : 0;
  const isSelectionVisible = end > viewStart && start < viewEnd;

  // Playhead
  const isPlayheadVisible = currentPlayTime >= viewStart && currentPlayTime <= viewEnd;
  const playheadLeftPercent = ((currentPlayTime - viewStart) / viewDuration) * 100;

  // Scrollbar
  const scrollLeftPercent = (viewStart / duration) * 100;
  const scrollWidthPercent = ((viewEnd - viewStart) / duration) * 100;

  return (
    <div className="w-full font-sans flex flex-col gap-[10px]">
      <div className="flex justify-between items-center text-[13px] text-[#787774]">
        <div className="flex gap-2 items-center">
          <span className="font-medium text-[#37352F]">Audio Selection</span>
          {isLoading && <span className="animate-pulse">Processing...</span>}
          {error && <span className="text-[#EB5757]">{error}</span>}
        </div>

        {/* Improved Numeric Controls Group */}
        <div className="flex gap-2 items-center text-xs font-mono bg-[#F7F7F5] border border-[#E9E9E7] px-2 py-[2px] rounded-[4px]">
          <div className="flex items-center">
            <span className="mr-[2px] text-[#37352F] font-sans text-[11px] uppercase tracking-wide">Start</span>
            <TimeInput value={start} min={0} max={end} onChange={handleStartChange} disabled={isLoading} />
            <span>s</span>
          </div>
          <div className="w-[1px] h-3 bg-[#D4D4D2]" />
          <div className="flex items-center">
            <span className="mr-[2px] text-[#EB5757] font-sans text-[11px] uppercase tracking-wide">Curr</span>
            <TimeInput value={currentPlayTime} min={start} max={end} onChange={updateCurrentTime} disabled={isLoading} />
            <span>s</span>
          </div>
          <div className="w-[1px] h-3 bg-[#D4D4D2]" />
          <div className="flex items-center">
            <span className="mr-[2px] text-[#37352F] font-sans text-[11px] uppercase tracking-wide">End</span>
            <TimeInput value={end} min={start} max={duration} onChange={handleEndChange} disabled={isLoading} />
            <span>s</span>
          </div>
        </div>
      </div>

      <div
        ref={mainTrackRef}
        className="relative w-full h-24 bg-[#F7F7F5] border border-[#E9E9E7] rounded-[4px] flex items-center px-[2px] select-none overflow-hidden"
      >
        <div className="absolute inset-x-0 h-[72px] flex items-center gap-[2px] px-1 pointer-events-none">
          {waveData.map((val, idx) => (
            <div
              key={idx}
              className="flex-1 bg-[#37352F] rounded-full opacity-80"
              style={{ height: `${val * 100}%` }}
            />
          ))}
        </div>

        {isSelectionVisible && (
          <div
            className="absolute top-0 bottom-0 bg-[#2383E2]/[0.1] border-x border-[#2383E2]/40 hover:bg-[#2383E2]/[0.15] transition-colors cursor-grab active:cursor-grabbing flex items-center justify-between z-10"
            style={{ left: `${selLeftPercent}%`, width: `${selWidthPercent}%` }}
            onMouseDown={(e) => handleMouseDown(e, "sel-move", mainTrackRef as React.RefObject<HTMLDivElement>)}
          >
            <div
              className={`absolute left-[-6px] top-0 bottom-0 w-[12px] cursor-col-resize flex justify-center items-center group z-20 ${
                start < viewStart ? "hidden" : ""
              }`}
              onMouseDown={(e) => handleMouseDown(e, "sel-left", mainTrackRef as React.RefObject<HTMLDivElement>)}
            >
              <div className="w-[4px] h-8 bg-[#2383E2] rounded-full opacity-60 group-hover:opacity-100 transition-opacity shadow-sm" />
            </div>

            <div
              className={`absolute right-[-6px] top-0 bottom-0 w-[12px] cursor-col-resize flex justify-center items-center group z-20 ${
                end > viewEnd ? "hidden" : ""
              }`}
              onMouseDown={(e) => handleMouseDown(e, "sel-right", mainTrackRef as React.RefObject<HTMLDivElement>)}
            >
              <div className="w-[4px] h-8 bg-[#2383E2] rounded-full opacity-60 group-hover:opacity-100 transition-opacity shadow-sm" />
            </div>
          </div>
        )}

        {/* Interactive Playhead Line */}
        {isPlayheadVisible && (
          <div
            className="absolute top-0 bottom-0 w-[14px] ml-[-7px] cursor-ew-resize flex justify-center z-30 group"
            style={{ left: `${playheadLeftPercent}%` }}
            onMouseDown={(e) => handleMouseDown(e, "playhead-move", mainTrackRef as React.RefObject<HTMLDivElement>)}
          >
            <div className="w-[2px] h-full bg-[#EB5757] shadow-sm group-hover:w-[4px] transition-all relative">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-[#EB5757]" />
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-[#EB5757]" />
            </div>
          </div>
        )}
      </div>

      <div
        ref={scrollTrackRef}
        className="relative w-full h-[14px] bg-[#F0F0EE] border border-[#E9E9E7] rounded-full select-none"
      >
        <div
          className="absolute top-[-1px] bottom-[-1px] bg-[#FFFFFF] border border-[#D4D4D2] rounded-full cursor-grab active:cursor-grabbing hover:bg-[#F9F9F8] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors group"
          style={{ left: `${scrollLeftPercent}%`, width: `${scrollWidthPercent}%` }}
          onMouseDown={(e) => handleMouseDown(e, "zoom-move", scrollTrackRef as React.RefObject<HTMLDivElement>)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-[8px] cursor-col-resize flex justify-center items-center"
            onMouseDown={(e) => handleMouseDown(e, "zoom-left", scrollTrackRef as React.RefObject<HTMLDivElement>)}
          >
            <div className="w-[2px] h-[6px] bg-[#D4D4D2] group-hover:bg-[#A5A5A1] rounded-full transition-colors" />
          </div>
          <div
            className="absolute right-0 top-0 bottom-0 w-[8px] cursor-col-resize flex justify-center items-center"
            onMouseDown={(e) => handleMouseDown(e, "zoom-right", scrollTrackRef as React.RefObject<HTMLDivElement>)}
          >
            <div className="w-[2px] h-[6px] bg-[#D4D4D2] group-hover:bg-[#A5A5A1] rounded-full transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}