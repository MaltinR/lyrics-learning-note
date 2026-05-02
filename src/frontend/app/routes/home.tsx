import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Loader2, Music, ArrowUp } from 'lucide-react';
import EntryHeader from '~/components/EntryHeader';
import type { Route } from './+types/home';
import { newNote } from '~/lib/note';

export function meta({}: Route.ActionArgs) {
  return [
    { title: "Lyrics Learning Notes" },
    { name: "Lyrics Learning Notes", content: "Home of Lyrics Learning Notes" },
  ];
}

export default function Home() {
  const [appState, setAppState] = useState<'entry' | 'processing'>('entry');
  const [url, setUrl] = useState('');
  const [update, setUpdate] = useState<string>("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const navigate = useNavigate();

  // Timer effect to count time elapsed during processing
  useEffect(() => {
    if (appState !== 'processing') {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [appState]);

  // Format seconds into "MM:SS"
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleStart = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!url.trim()) return;
    
    setAppState('processing');
    setUpdate("Sending request to server");
    setErrorText(null);
    
    try {
      const note = await newNote(url.trim(), (message) => {
        setUpdate(message);
      });
      setUpdate("Loading to note");
      navigate(`/notes/${note.id}`);
    } catch (e: any) {
      setErrorText(e.toString());
    }
  }, [url, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center pt-[15vh] px-6 bg-[#FFFFFF] text-[#37352F] selection:bg-[#cde2f5] font-sans">
      <EntryHeader current="home"/>
      {appState === 'entry' ? (
        <div className="w-full max-w-[640px] flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Top Avatar/Icon */}
          <div className="w-14 h-14 bg-white border border-[#E9E9E7] shadow-sm rounded-full flex items-center justify-center mb-6">
             <Music className="w-6 h-6 text-[#37352F]" />
          </div>

          {/* Title */}
          <h1 className="text-[32px] sm:text-[36px] font-bold leading-tight tracking-tight mb-8 text-center">
            What song are we learning today?
          </h1>

          {/* Input Field Container */}
          <form 
            onSubmit={handleStart} 
            className="w-full relative bg-white border border-[#E9E9E7] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] focus-within:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all flex items-center p-2"
          >
            <input 
              type="text" 
              placeholder="Paste YouTube or audio URL..." 
              className="flex-1 bg-transparent py-3 pl-4 pr-2 text-[16px] outline-none placeholder:text-[#A4A4A3]"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
              suppressHydrationWarning={true}
            />
            
            {/* Process/Submit Button embedded in the input */}
            <button 
              type="submit"
              disabled={!url.trim()}
              className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full transition-colors ml-2 mr-1
                ${url.trim() 
                  ? 'bg-[#37352F] text-white hover:bg-black cursor-pointer' 
                  : 'bg-[#F1F1EF] text-[#A4A4A3] cursor-not-allowed'
                }
              `}
              title="Process Song"
            >
              <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </form>

        </div>
      ) : (
        /* Processing State */
        <div className="w-full max-w-[400px] flex flex-col items-center justify-center pt-10 animate-in fade-in duration-300">
          <Loader2 className="w-10 h-10 text-[#A4A4A3] animate-spin mb-8" />
          
          <div className="w-full flex flex-col gap-3">
            <div className="flex justify-center items-center text-[14px] font-medium text-[#787774]">
              {update} ({formatTime(elapsedTime)})
            </div>
          </div>
        </div>
      )}
    </div>
  );
}