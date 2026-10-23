'use client';

import { use, useState } from 'react';
import { codingStages, codingTotals, findTrack, CodingTrack } from '@/lib/catalog/coding';
import { DynamicThumbnail } from '@/components/thumbnails/DynamicThumbnail';
import { useLocale } from '@/lib/core/locale';
import { STR } from '@/lib/core/uiStrings';
import type { Locale } from '@/lib/core/locale';

/* Same grid/card constants as /courses — the three catalogues on this site
   (typing course, K-12 subjects, coding tracks) must read as one surface. */
const GRID = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5';
const CARD =
  'group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm transition-all duration-200 flex flex-col overflow-hidden relative';
const CARD_HOVER =
  'hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-md cursor-pointer';

/* Tailwind cannot see a class built at runtime, so the stage accents are a
   literal lookup rather than `bg-${tone}-500`. */
const TONE_DOT: Record<string, string> = {
  sky: 'bg-sky-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500',
  violet: 'bg-violet-500', rose: 'bg-rose-500', indigo: 'bg-indigo-500',
  teal: 'bg-teal-500', orange: 'bg-orange-500', lime: 'bg-lime-500',
  cyan: 'bg-cyan-500', fuchsia: 'bg-fuchsia-500', slate: 'bg-slate-500',
};

export default function CodingPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>;
}) {
  const sp = use(searchParams);
  const { locale } = useLocale();

  // Deep-linkable on entry (`/coding?track=python-basics`), local state after —
  // the same contract `/courses` has with `?grade=`.
  const [activeTrack, setActiveTrack] = useState<CodingTrack | null>(() => findTrack(sp?.track));

  /* Swapping the view keeps the window's scroll offset, and the ladder is six
     screens tall — without this the track view opens halfway down, with its
     back button hidden under the sticky navbar. */
  const show = (track: CodingTrack | null) => {
    setActiveTrack(track);
    window.scrollTo(0, 0);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] dark:bg-neutral-950 text-neutral-950 dark:text-white min-h-screen pt-10 px-6">
      <div className="max-w-5xl mx-auto w-full pb-32">
        {activeTrack ? (
          <TrackView track={activeTrack} locale={locale} onBack={() => show(null)} />
        ) : (
          <LadderView locale={locale} onPick={show} />
        )}
      </div>
    </div>
  );
}

/* ── The whole ladder: six stages, every track visible at once ─────────── */

function LadderView({
  locale,
  onPick,
}: {
  locale: Locale;
  onPick: (t: CodingTrack) => void;
}) {
  return (
    <div className="animate-in fade-in duration-300">
      <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 mb-2">
        {STR.coding.title[locale]}
      </h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
        {STR.coding.subtitle[locale]}
      </p>

      {/* Size of the catalogue, read from the data rather than typed into copy */}
      <div className="flex flex-wrap items-center gap-2 mb-10">
        {([
          [codingTotals.stages, STR.coding.stagesLabel[locale]],
          [codingTotals.tracks, STR.coding.tracksLabel[locale]],
          [codingTotals.modules, STR.coding.modulesLabel[locale]],
        ] as const).map(([n, label]) => (
          <span
            key={label}
            className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full px-2.5 py-1"
          >
            <span className="font-bold text-neutral-900 dark:text-white">{n}</span> {label}
          </span>
        ))}
        <span className="text-[11px] text-neutral-400 dark:text-neutral-500 pl-1">
          {STR.coding.ladder[locale]}
        </span>
      </div>

      <div className="flex flex-col gap-12">
        {codingStages.map((stage) => (
          <section key={stage.stageId}>
            {/* Stage header — the rung number is what carries "beginner → master" */}
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                {STR.coding.stage[locale]} {stage.level}
              </span>
              <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[stage.tone] ?? TONE_DOT.slate}`} />
              <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
                {stage.title[locale]}
              </h2>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
              {stage.goal[locale]}
            </p>

            <div className={GRID}>
              {stage.tracks.map((track) => (
                <div
                  key={track.trackId}
                  onClick={() => onPick(track)}
                  className={`${CARD} ${CARD_HOVER}`}
                >
                  <div className="w-full aspect-[16/10] bg-neutral-50 dark:bg-neutral-900 relative overflow-hidden">
                    <DynamicThumbnail
                      svgId="CODE_TRACK_COVER"
                      params={{ codeIcon: track.icon, codeLine: track.sample, tone: track.tone }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="border-t border-neutral-100 dark:border-neutral-800 py-2 sm:py-2.5 px-2.5 bg-white dark:bg-neutral-900 flex flex-col justify-center min-h-13">
                    <span className="text-[11px] sm:text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-tight line-clamp-2">
                      {track.title[locale]}
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                      {track.modules.length} {STR.coding.modulesLabel[locale]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/* ── One track: its blocks, plus what it makes you type ────────────────── */

function TrackView({
  track,
  locale,
  onBack,
}: {
  track: CodingTrack;
  locale: Locale;
  onBack: () => void;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <button
        onClick={onBack}
        className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium text-sm flex items-center gap-2 mb-8 transition-colors bg-white dark:bg-neutral-900 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        {STR.coding.backToTracks[locale]}
      </button>

      <div className="grid md:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
        {/* Left: the numbered block list — the syllabus itself */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            {STR.coding.stage[locale]} {stageLevelOf(track)} · {String(track.order).padStart(2, '0')}/{codingTotals.tracks}
          </span>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 mt-1 mb-2">
            {track.title[locale]}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">
            {track.summary[locale]}
          </p>

          <h2 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3">
            {STR.coding.blocks[locale]}
          </h2>
          <ol className="flex flex-col gap-2">
            {track.modules.map((m) => (
              <li
                key={m.moduleId}
                className="flex items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-3 shadow-sm"
              >
                <span className="shrink-0 w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center justify-center">
                  {m.order}
                </span>
                <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {m.title[locale]}
                </span>
              </li>
            ))}
          </ol>

          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-6">
            {STR.coding.notReady[locale]}
          </p>
        </div>

        {/* Right: the typing half of the promise */}
        <aside className="w-full flex flex-col gap-4">
          <div className="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <DynamicThumbnail
              svgId="CODE_TRACK_COVER"
              params={{ codeIcon: track.icon, codeLine: track.sample, tone: track.tone }}
              className="w-full aspect-[16/10]"
            />
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2.5">
              {STR.coding.typingFocus[locale]}
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {track.typingFocus.map((k, i) => (
                <span
                  key={`${k}-${i}`}
                  className="min-w-7 text-center font-mono text-[13px] font-bold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 border-b-2 border-neutral-300 dark:border-neutral-600 rounded px-1.5 py-1"
                >
                  {k}
                </span>
              ))}
            </div>

            <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
              {STR.coding.youWillType[locale]}
            </h3>
            <code className="block font-mono text-[12px] leading-relaxed text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded px-3 py-2 overflow-x-auto whitespace-pre">
              {track.sample}
            </code>
          </div>
        </aside>
      </div>
    </div>
  );
}

function stageLevelOf(track: CodingTrack): number {
  return codingStages.findIndex((s) => s.stageId === track.stageId) + 1;
}
