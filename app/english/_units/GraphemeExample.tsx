import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { useLocale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";
import { GRAPHEMES, SPELLINGS } from "@/lib/english/graphemes";
import {
  graphemeDone,
  graphemeStars,
  useGraphemeProgress,
} from "@/lib/english/graphemeProgress";
import {
  GRAPHEME_SIZES,
  GraphemeTile,
  VOWEL_GRAPHEMES,
  CONSONANT_GRAPHEMES,
  SPELL_MONO,
  SPELL_DI,
  SPELL_TRI,
  SPELL_CONS,
} from "../_data";
import {
  SubHeader,
  HeadCell,
  RowLabel,
  BodyCell,
  GraphemeLines,
  CellTiles,
  MapCell,
} from "../_components";

const E = STR.english;

// Unit 2: grapheme → phoneme and phoneme → grapheme tables, each linking to its course.
export function GraphemeExample() {
  const { locale } = useLocale();
  const graphemeProgress = useGraphemeProgress();
  const graphemesDone = GRAPHEMES.filter((x) =>
    graphemeDone(graphemeProgress, "graphemes", x.slug),
  ).length;
  const graphemesStars = GRAPHEMES.reduce(
    (sum, x) => sum + graphemeStars(graphemeProgress, "graphemes", x.slug),
    0,
  );
  const spellingsDone = SPELLINGS.filter((s) =>
    graphemeDone(graphemeProgress, "spellings", s.phoneme.slug),
  ).length;
  const spellingsStars = SPELLINGS.reduce(
    (sum, s) =>
      sum + graphemeStars(graphemeProgress, "spellings", s.phoneme.slug),
    0,
  );

  /* Counts + stars + chevron for the two grapheme sub-card headers. */
  const subStats = (done: number, total: number, stars: number) => (
    <>
      {done > 0 && (
        <>
          <span className="font-mono text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
            {done} / {total}
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            {stars}
          </span>
        </>
      )}
      <ChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
    </>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* 1) Grapheme → phoneme: the spellings, size × vowel/consonant */}
      <Link
        href="/english/graphemes"
        className="block rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white hover:shadow-md"
      >
        <SubHeader
          title={E.graphemeToPhoneme[locale]}
          hint={E.readingHint[locale]}
          stats={subStats(graphemesDone, GRAPHEMES.length, graphemesStars)}
        />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-120 border-collapse">
            <thead>
              <tr>
                <th className="w-32 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2" />
                <HeadCell>{STR.letters.filterVowels[locale]}</HeadCell>
                <HeadCell>{STR.letters.filterConsonants[locale]}</HeadCell>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  {
                    label: GRAPHEME_SIZES[0][locale],
                    v: VOWEL_GRAPHEMES[0],
                    c: CONSONANT_GRAPHEMES[0],
                    lines: true,
                    cGrid: [4, 5],
                  },
                  {
                    label: GRAPHEME_SIZES[1][locale],
                    v: VOWEL_GRAPHEMES[1],
                    c: CONSONANT_GRAPHEMES[1],
                    vGrid: [3, 4],
                    cGrid: [2, 4],
                  },
                  {
                    label: `${GRAPHEME_SIZES[2][locale]} · ${GRAPHEME_SIZES[3][locale]}`,
                    v: [...VOWEL_GRAPHEMES[2], ...VOWEL_GRAPHEMES[3]],
                    c: [
                      ...CONSONANT_GRAPHEMES[2],
                      ...CONSONANT_GRAPHEMES[3],
                    ],
                    vGrid: [3, 3],
                    cGrid: [2, 0],
                  },
                ] as {
                  label: string;
                  v?: GraphemeTile[];
                  c?: GraphemeTile[];
                  lines?: boolean;
                  vGrid?: [number, number];
                  cGrid?: [number, number];
                }[]
              ).map((row) => (
                <tr key={row.label}>
                  <RowLabel>{row.label}</RowLabel>
                  <BodyCell>
                    {!row.v || row.v.length === 0 ? (
                      <span className="text-neutral-300 dark:text-neutral-600">—</span>
                    ) : row.lines || !row.vGrid ? (
                      <GraphemeLines tiles={row.v} tint="plain" />
                    ) : (
                      <CellTiles
                        tiles={row.v}
                        tint="plain"
                        grid={row.vGrid}
                      />
                    )}
                  </BodyCell>
                  <BodyCell>
                    <CellTiles
                      tiles={row.c ?? []}
                      tint="plain"
                      grid={row.cGrid ?? [4, 0]}
                    />
                  </BodyCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Link>

      {/* 2) Phoneme → grapheme: each sound with its common spellings */}
      <Link
        href="/english/spellings"
        className="block rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all hover:border-neutral-950 dark:hover:border-white hover:ring-1 hover:ring-neutral-950 dark:hover:ring-white hover:shadow-md"
      >
        <SubHeader
          title={E.phonemeToGrapheme[locale]}
          hint={E.spellingHint[locale]}
          stats={subStats(spellingsDone, SPELLINGS.length, spellingsStars)}
        />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-120 border-collapse">
            <thead>
              <tr>
                <th className="w-32 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2" />
                <HeadCell>{STR.letters.filterVowels[locale]}</HeadCell>
                <HeadCell>{STR.letters.filterConsonants[locale]}</HeadCell>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  { label: STR.phonemes.groupMono, items: SPELL_MONO },
                  { label: STR.phonemes.groupDi, items: SPELL_DI },
                  { label: STR.phonemes.groupTri, items: SPELL_TRI },
                ] as const
              ).map((group, i) => (
                <tr key={group.label.en}>
                  <RowLabel>{group.label[locale]}</RowLabel>
                  <BodyCell w="w-2/3">
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((m) => (
                        <MapCell key={m.s} {...m} />
                      ))}
                    </div>
                  </BodyCell>
                  {i === 0 && (
                    <BodyCell rowSpan={3} w="w-1/3">
                      <div className="flex flex-wrap gap-1.5">
                        {SPELL_CONS.map((m) => (
                          <MapCell key={m.s} {...m} />
                        ))}
                      </div>
                    </BodyCell>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* UK / US legend */}
        <div className="mt-3 flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900" />
            UK + US
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-sky-500/30 bg-sky-500/10" />
            {E.ukOnly[locale]}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-rose-500/30 bg-rose-500/10" />
            {E.usOnly[locale]}
          </span>
        </div>
      </Link>
    </div>
  );
}
