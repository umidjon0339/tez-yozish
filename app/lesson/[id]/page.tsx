'use client';

import React, { useState, useEffect, useRef, memo, useCallback, useImperativeHandle, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import lessonsData from '@/data/lessons.json';
import { Lesson, StagePractice } from '@/types/lesson';
import { NewKeyboard } from '@/components/keyboard/new_keyboard';
import { Keyboard as HandsKeyboard } from '@/components/keyboard/hands';
const UNTYPED = 0; const CORRECT = 1; const INCORRECT = 2; const CORRECT_FIXED = 3;
type CharState = typeof UNTYPED | typeof CORRECT | typeof INCORRECT | typeof CORRECT_FIXED;

interface LetterHandle {
  setCharState: (s: CharState) => void;
  setIsCursor: (active: boolean) => void;
  getDomNode: () => HTMLDivElement | null;
}

const playKeystrokeSound = () => {
  try {
    const audio = new Audio('/press_key4.mp3');
    audio.volume = 1; // Slightly lower volume so it's not overpowering
    
    // --- AUDIO CROPPING SETTINGS ---
    // Change these values to trim the sound!
    const startTimeSeconds = 0.0; // Start playing from this second (e.g. 0.1)
    const playDurationMs = 300;   // Stop playing after this many milliseconds (e.g. 100)
    // -------------------------------

    audio.currentTime = startTimeSeconds;
    audio.play().catch(() => {});

    if (playDurationMs > 0) {
      setTimeout(() => {
        audio.pause();
      }, playDurationMs);
    }
  } catch (e) {
    // Ignore audio play errors
  }
};

const playErrorSound = () => {
  try {
    const audio = new Audio('/error2.mp3');
    audio.volume = 0.8;
    audio.play().catch(() => {});
  } catch (e) {
    // Ignore audio play errors
  }
};

const KEYBOARD_CONFIG = {
  scale: 0.75,
  offsetX: 0,
  offsetY: 0,
};

const HANDS_CONFIG = {
  scale: 1.33,
  offsetX: 37,
  offsetY: 105,
};

export interface KeyPressInfo {
  key: string;
  isCorrect: boolean;
  id: number;
}

function KeyboardWithHands({ expectedKey, isDark, isColorful, lastPress, isHandsVisible = true }: { expectedKey: string | null; isDark: boolean; isColorful: boolean; lastPress?: KeyPressInfo | null; isHandsVisible?: boolean }) {
  return (
    <div className={`relative w-full max-w-4xl aspect-[683.3/254] mx-auto ${isColorful ? 'colorful-mode' : ''}`}>
      {/* The base keyboard layout */}
      <div className="absolute top-0 left-0 z-0 w-full h-full">
        <NewKeyboard
          expectedKey={expectedKey}
          scale={KEYBOARD_CONFIG.scale}
          offsetX={KEYBOARD_CONFIG.offsetX}
          offsetY={KEYBOARD_CONFIG.offsetY}
          lastPress={lastPress}
        />
      </div>

      {/* The overlay hands */}
      {isHandsVisible && (
        <div className="absolute top-0 left-0 z-10 pointer-events-none w-full h-full mix-blend-multiply dark:mix-blend-screen opacity-90 overflow-visible">
          <HandsKeyboard
            expectedKey={expectedKey}
            className={`w-full h-full overflow-visible ${isDark ? 'theme-dark' : 'theme-bone'}`}
            scale={HANDS_CONFIG.scale}
            offsetX={HANDS_CONFIG.offsetX}
            offsetY={HANDS_CONFIG.offsetY}
          />
        </div>
      )}
    </div>
  );
}

// ─── O(1) ATOMIC MEMOIZED LETTER (Boxed Design) ───
const Letter = memo(React.forwardRef<LetterHandle, { char: string }>(function Letter({ char }, ref) {
  const [state, setState] = useState<CharState>(UNTYPED);
  const [isCursor, setIsCursor] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({ 
    setCharState: setState, 
    setIsCursor,
    getDomNode: () => divRef.current
  }));

  let boxCls = "relative flex items-center justify-center w-12 h-14 sm:w-[3.5rem] sm:h-[4.25rem] rounded-md border-2 transition-all duration-75 select-none shrink-0 ";
  let charCls = "font-sans text-2xl sm:text-3xl font-medium transition-colors ";

  if (state === UNTYPED) {
    boxCls += "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 ";
    charCls += "text-neutral-500 dark:text-neutral-500";
  } else if (state === CORRECT) {
    boxCls += "border-[#50ce95] bg-[#e2f7e2] dark:border-[#50ce95]/50 dark:bg-[#e2f7e2]/10 ";
    charCls += "text-[#10c373] dark:text-[#50ce95]";
  } else if (state === CORRECT_FIXED) {
    boxCls += "border-amber-400 bg-amber-50 dark:border-amber-500/50 dark:bg-amber-950/20 ";
    charCls += "text-amber-600 dark:text-amber-500";
  } else if (state === INCORRECT) {
    boxCls += "border-red-400 bg-red-100 dark:border-red-500/50 dark:bg-red-950/40 ";
    charCls += "text-red-600 dark:text-red-400";
  }

  // Highlight the active character slightly
  if (isCursor && state === UNTYPED) {
    charCls += " font-semibold text-neutral-900 dark:text-white";
  }

  return (
    <div className={boxCls} ref={divRef}>
      {/* Checkmark icon for correct typed */}
      {(state === CORRECT || state === CORRECT_FIXED) && (
        <svg viewBox="0 0 24 24" className={`absolute top-1 left-1 w-3 h-3 sm:w-4 sm:h-4 ${state === CORRECT ? 'text-[#10c373] dark:text-[#50ce95]' : 'text-amber-500 dark:text-amber-400'}`} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      )}

      {/* The Character */}
      <span className={charCls}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    </div>
  );
}));
Letter.displayName = 'Letter';


// ─── BOMB-PROOF PRACTICE TRACKER ───
function PracticeTracker({ stage, onComplete, isDark, isColorful, isAudioEnabled, isHandsVisible }: { stage: StagePractice; onComplete: () => void; isDark: boolean; isColorful: boolean; isAudioEnabled: boolean; isHandsVisible: boolean }) {
  const charList = useMemo(() => stage.content.split(''), [stage.content]);
  const total = charList.length;

  const buffer = useRef<Uint8Array>(new Uint8Array(total));
  const hasError = useRef<boolean[]>(new Array(total).fill(false));
  const cursor = useRef<number>(0);
  const done = useRef(false);

  const letterMap = useRef<Map<number, LetterHandle>>(new Map());
  const [activeKey, setActiveKey] = useState<string | null>(charList[0] || null);
  const [lastPress, setLastPress] = useState<KeyPressInfo | null>(null);
  
  const smoothCursorRef = useRef<HTMLDivElement>(null);

  const updateSmoothCursor = useCallback((index: number) => {
    const node = letterMap.current.get(index)?.getDomNode();
    if (node && smoothCursorRef.current) {
      smoothCursorRef.current.style.opacity = '1';
      smoothCursorRef.current.style.left = `${node.offsetLeft}px`;
      smoothCursorRef.current.style.top = `${node.offsetTop + node.offsetHeight + 2}px`;
      smoothCursorRef.current.style.width = `${node.offsetWidth}px`;
    }
  }, []);

  useEffect(() => {
    buffer.current = new Uint8Array(charList.length);
    hasError.current = new Array(charList.length).fill(false);
    cursor.current = 0; done.current = false;
    setActiveKey(charList[0] || null);

    setTimeout(() => {
      letterMap.current.forEach(h => { h.setCharState(UNTYPED); h.setIsCursor(false); });
      letterMap.current.get(0)?.setIsCursor(true);
      updateSmoothCursor(0);
    }, 10);
  }, [charList, updateSmoothCursor]);

  useEffect(() => {
    const handleResize = () => {
      if (!done.current) updateSmoothCursor(cursor.current);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateSmoothCursor]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (done.current) return;
    if (e.key === ' ') e.preventDefault();
    if (e.key.length > 1 && e.key !== 'Backspace') return;

    const curr = cursor.current;

    if (e.key === 'Backspace') {
      if (isAudioEnabled) playKeystrokeSound();
      if (curr === 0) return;
      const prev = curr - 1;
      buffer.current[prev] = UNTYPED;
      letterMap.current.get(prev)?.setCharState(UNTYPED);
      letterMap.current.get(curr)?.setIsCursor(false);
      letterMap.current.get(prev)?.setIsCursor(true);
      cursor.current = prev;
      setActiveKey(charList[prev] || null);
      updateSmoothCursor(prev);
      return;
    }

    if (curr >= total) return;

    const isMatch = e.key === charList[curr];
    if (!isMatch) {
      hasError.current[curr] = true;
    }
    const newState = isMatch ? (hasError.current[curr] ? CORRECT_FIXED : CORRECT) : INCORRECT;

    if (isMatch) {
      if (isAudioEnabled) playKeystrokeSound();
    } else {
      if (isAudioEnabled) playErrorSound();
    }

    setLastPress({ key: e.key, isCorrect: isMatch, id: Date.now() });

    buffer.current[curr] = newState;
    letterMap.current.get(curr)?.setCharState(newState);
    letterMap.current.get(curr)?.setIsCursor(false);

    const next = curr + 1;
    cursor.current = next;

    if (next < total) {
      letterMap.current.get(next)?.setIsCursor(true);
      setActiveKey(charList[next] || null);
      updateSmoothCursor(next);
    } else {
      if (smoothCursorRef.current) {
        smoothCursorRef.current.style.opacity = '0';
      }
      done.current = true;
      setActiveKey(null);
      setTimeout(onComplete, 200);
    }
  }, [total, charList, onComplete, isAudioEnabled, updateSmoothCursor]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div className="flex-1 flex flex-col items-center justify-start gap-16 w-full max-w-4xl mx-auto select-none pt-16">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-2xl px-4 relative">
        <div 
          ref={smoothCursorRef} 
          className="absolute h-[3px] bg-[#0383f2] transition-all duration-150 ease-out rounded-full pointer-events-none z-10" 
          style={{ opacity: 0 }} 
        />
        {charList.map((c, i) => (
          <Letter
            key={i}
            char={c}
            ref={(node) => {
              if (node) letterMap.current.set(i, node);
              else letterMap.current.delete(i);
            }}
          />
        ))}
      </div>
      <div className="w-full mt-2">
        <KeyboardWithHands expectedKey={activeKey} isDark={isDark} isColorful={isColorful} lastPress={lastPress} isHandsVisible={isHandsVisible} />
      </div>
    </div>
  );
}

// ─── MASTER ARENA CONTROLLER ───
export default function LessonPage() {
  const { id } = useParams();
  const router = useRouter();
  const lesson = (lessonsData as Lesson[]).find((l) => String(l.id) === id);
  const [stageIdx, setStageIdx] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isColorful, setIsColorful] = useState(false);
  const [isHandsVisible, setIsHandsVisible] = useState(true);

  const stage = lesson?.stages[stageIdx];

  // Keydown listener for Intro stages
  useEffect(() => {
    if (!stage || stage.type !== 'intro') return;

    const handleIntroKey = (e: KeyboardEvent) => {
      if (e.key === ' ') e.preventDefault();
      
      if (e.key.length === 1 || e.key === 'Backspace') {
        const isMatch = e.key.toLowerCase() === stage.targetKey.toLowerCase();
        if (isMatch || e.key === 'Backspace') {
          if (isAudioEnabled) playKeystrokeSound();
        } else {
          if (isAudioEnabled) playErrorSound();
        }
      }

      if (e.key.toLowerCase() === stage.targetKey.toLowerCase()) {
        next();
      }
    };
    window.addEventListener('keydown', handleIntroKey);
    return () => window.removeEventListener('keydown', handleIntroKey);
  }, [stage, isAudioEnabled]);

  if (!lesson) return <div className="p-8 font-mono text-xs">404 // Module not located.</div>;

  if (!stage) {
    return (
      <div className={isDark ? "dark" : ""}>
        <div className="h-dvh w-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-950 font-sans overflow-hidden select-none">
          <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1 rounded mb-6 uppercase tracking-wider">
            Module Verified
          </div>
          <h1 className="text-5xl font-extrabold text-neutral-950 dark:text-white mb-4 tracking-tight">Execution Audit: Mastered</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-base mb-10 font-normal">Neural pathways successfully consolidated.</p>
          <Link href="/" className="bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-mono text-xs uppercase tracking-wider font-semibold px-8 py-4 rounded-lg shadow-sm transition-all">
            Return to Workspace ↵
          </Link>
        </div>
      </div>
    );
  }

  const next = () => setStageIdx(p => p + 1);
  const prev = () => setStageIdx(p => Math.max(0, p - 1));

  const currentStageDisplay = stageIdx + 1;
  const totalStages = lesson.stages.length;
  const progressPercent = (stageIdx / totalStages) * 100;



  const introSvgKey = stage?.type === 'intro' ? (stage.targetKey === ' ' ? 'space' : stage.targetKey) : null;

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="arena-workspace-active h-dvh w-screen overflow-hidden bg-white dark:bg-neutral-950 font-sans flex flex-col justify-between select-none">

        {/* ─── MINIMALIST NOTION-STYLE TOP BAR ─── */}
        <header className="w-full h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6 text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-950 transition-colors">
          <Link href="/" className="hover:text-neutral-900 dark:hover:text-white transition-colors" title="Exit Lesson">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </Link>

          <div className="flex items-center gap-6">
            <button onClick={() => setStageIdx(0)} className="hover:text-neutral-900 dark:hover:text-white transition-colors" title="Restart Lesson">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
            <button onClick={() => setIsColorful(!isColorful)} className={`transition-colors ${isColorful ? 'text-neutral-900 dark:text-white' : 'hover:text-neutral-900 dark:hover:text-white'}`} title="Toggle Colorful Keyboard">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10"/></svg>
            </button>
            <button onClick={() => setIsHandsVisible(!isHandsVisible)} className={`transition-colors ${isHandsVisible ? 'text-neutral-900 dark:text-white' : 'hover:text-neutral-900 dark:hover:text-white'}`} title="Toggle Hands Overlay">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
            </button>
            <button onClick={() => setIsAudioEnabled(!isAudioEnabled)} className={`transition-colors ${isAudioEnabled ? 'text-neutral-900 dark:text-white' : 'hover:text-neutral-900 dark:hover:text-white'}`} title="Toggle Sound">
              {isAudioEnabled ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              )}
            </button>
            <button onClick={() => setIsDark(!isDark)} className={`transition-colors ${isDark ? 'text-neutral-900 dark:text-white' : 'hover:text-neutral-900 dark:hover:text-white'}`} title="Toggle Theme">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/></svg>
            </button>
          </div>

          <div className="w-[20px]"></div> {/* Spacer to keep center icons perfectly centered */}
        </header>

        {/* ─── CENTER ARENA ─── */}
        <main className="flex-1 flex flex-col items-center justify-start pt-10 pb-6 px-6 overflow-visible max-w-4xl mx-auto w-full">
          {stage.type === 'intro' ? (
            <div className="flex flex-col items-center gap-8 max-w-2xl mt-12 animate-fade-in-up">

              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-900 px-2.5 py-0.5 rounded border border-neutral-200/60 dark:border-neutral-800/60">
                Tactile Anchor Instruction
              </div>

              <div className="text-2xl md:text-3xl text-neutral-950 dark:text-white text-center font-medium flex items-center justify-center gap-2.5 flex-wrap tracking-tight">
                <span>Strike the</span>
                <kbd className="inline-flex items-center justify-center min-w-[32px] h-9 px-2 bg-neutral-950 dark:bg-neutral-800 text-white font-mono font-bold text-lg rounded shadow-md border-b-2 border-neutral-700 dark:border-neutral-600">
                  {stage.targetKey === ' ' ? '␣' : stage.targetKey.toUpperCase()}
                </kbd>
                <span>key using your index anchor.</span>
              </div>

              <div className="w-full mt-4">
                <KeyboardWithHands expectedKey={introSvgKey?.toLowerCase() || null} isDark={isDark} isColorful={isColorful} isHandsVisible={isHandsVisible} />
              </div>

            </div>
          ) : (
            <PracticeTracker stage={stage} onComplete={next} isDark={isDark} isColorful={isColorful} isAudioEnabled={isAudioEnabled} isHandsVisible={isHandsVisible} />
          )}
        </main>

        {/* ─── STARK NOTION FOOTER PROGRESS DECK ─── */}
        <footer className="w-full py-6 px-8 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between max-w-4xl mx-auto bg-white dark:bg-neutral-950 transition-colors">
          <button onClick={prev} disabled={stageIdx === 0} className="font-mono text-xs font-semibold uppercase text-neutral-400 hover:text-neutral-950 dark:hover:text-white disabled:opacity-20 transition-colors cursor-pointer">
            ← Prev
          </button>

          <div className="w-72 h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden border border-neutral-200/80 dark:border-neutral-800/80">
            <div className="h-full bg-neutral-950 dark:bg-white transition-all duration-300 ease-out rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>

          <button onClick={next} className="font-mono text-xs font-semibold uppercase text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer">
            Skip →
          </button>
        </footer>

      </div>
    </div>
  );
}