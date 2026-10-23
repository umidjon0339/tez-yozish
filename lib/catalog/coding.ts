/**
 * The coding catalogue — `/coding`.
 *
 * Three tiers, ordered beginner → master:
 *
 *   Stage   (6)   the skill ladder: Foundations → … → Mastery
 *   Track  (35)   a field inside that stage: Python, Databases, Ethical Hacking…
 *   Module (188)  the chapter blocks inside a track
 *
 * The source is `data/coding-curriculum.json`. Like the K-12 file, a track's
 * modules are three PARALLEL en/uz/ru arrays — index `i` is the same module
 * in every language, and this module is the only place that relies on it.
 *
 * Two fields are deliberately NOT localized, because they are the typing half
 * of the promise rather than prose: `typingFocus` (the symbol keys the track
 * drills) and `sample` (a real line of that field's code). They read the same
 * in every language, and they are what a future lesson generator will feed to
 * the typing engine.
 *
 * There is no lesson content yet — this file is the classification only.
 */

import raw from '@/data/coding-curriculum.json';
import { LocalizedString } from '@/types/lesson';
import type { Tone } from '@/types/thumbnail';

type RawLocalized = { en: string; uz: string; ru: string };
type RawModules = { en: string[]; uz: string[]; ru: string[] };

interface RawTrack {
  id: string;
  icon: string;
  tone: string;
  typingFocus: string;
  sample: string;
  title: RawLocalized;
  summary: RawLocalized;
  modules: RawModules;
}

interface RawStage {
  id: string;
  tone: string;
  title: RawLocalized;
  goal: RawLocalized;
  tracks: RawTrack[];
}

const source = raw as unknown as { stages: RawStage[] };

export interface CodingModule {
  /** `python-basics-3` — stable, safe in a URL */
  moduleId: string;
  /** 1-based position inside its track, for the numbered block list */
  order: number;
  title: LocalizedString;
}

export interface CodingTrack {
  trackId: string;
  /** the stage this track belongs to, so a track can be resolved on its own */
  stageId: string;
  /** 1-based position across the WHOLE catalogue, so cards can show 07/35 */
  order: number;
  title: LocalizedString;
  summary: LocalizedString;
  /** lucide component name, resolved by the `CODE_TRACK_COVER` thumbnail */
  icon: string;
  tone: Tone;
  /** symbol keys this track drills, e.g. `( ) { } ;` — never translated */
  typingFocus: string[];
  /** one real line of this field's code — never translated */
  sample: string;
  modules: CodingModule[];
}

export interface CodingStage {
  stageId: string;
  /** 1..6 — the rung on the beginner→master ladder */
  level: number;
  title: LocalizedString;
  goal: LocalizedString;
  tone: Tone;
  tracks: CodingTrack[];
}

const TONES: readonly string[] = [
  'sky', 'emerald', 'amber', 'violet', 'rose', 'indigo',
  'teal', 'orange', 'lime', 'cyan', 'fuchsia', 'slate',
];

/** An unknown hue in the JSON must not blank a card — fall back, don't throw. */
function toTone(value: string): Tone {
  return (TONES.includes(value) ? value : 'slate') as Tone;
}

function localized(v: RawLocalized): LocalizedString {
  return { en: v.en, uz: v.uz, ru: v.ru };
}

function normalizeModules(trackId: string, m: RawModules): CodingModule[] {
  // `en` is authoritative: a short uz/ru array yields a fallback title rather
  // than an `undefined` that would render as blank.
  return m.en.map((en, i) => ({
    moduleId: `${trackId}-${i + 1}`,
    order: i + 1,
    title: { en, uz: m.uz[i] ?? en, ru: m.ru[i] ?? en },
  }));
}

let trackCounter = 0;

export const codingStages: CodingStage[] = source.stages.map((s, si) => ({
  stageId: s.id,
  level: si + 1,
  title: localized(s.title),
  goal: localized(s.goal),
  tone: toTone(s.tone),
  tracks: s.tracks.map((t) => ({
    trackId: t.id,
    stageId: s.id,
    order: ++trackCounter,
    title: localized(t.title),
    summary: localized(t.summary),
    icon: t.icon,
    tone: toTone(t.tone),
    typingFocus: t.typingFocus.split(' ').filter(Boolean),
    sample: t.sample,
    modules: normalizeModules(t.id, t.modules),
  })),
}));

/** Flat list in ladder order — the counts and the lookup both read from it. */
export const codingTracks: CodingTrack[] = codingStages.flatMap((s) => s.tracks);

export const codingTotals = {
  stages: codingStages.length,
  tracks: codingTracks.length,
  modules: codingTracks.reduce((n, t) => n + t.modules.length, 0),
};

export function findTrack(trackId: string | null | undefined): CodingTrack | null {
  if (!trackId) return null;
  return codingTracks.find((t) => t.trackId === trackId) ?? null;
}

export function findStage(stageId: string): CodingStage | null {
  return codingStages.find((s) => s.stageId === stageId) ?? null;
}
