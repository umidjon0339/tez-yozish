import React from "react";
import { useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import {
  L3,
  POS_G,
  PHRASE_TABLE,
  CLAUSE_ANATOMY,
  CLAUSE_TABLE,
  SENT_STRUCT,
  SENT_TYPES,
  SENT_EL,
  SENT_PATTERNS,
  SP_CARDS,
} from "../_data";

const E = STR.english;

// Unit 6: phrases, clauses and sentences.
export function SyntaxExample() {
  const { locale } = useLocale();

  return (
    <div className="flex flex-col gap-3">
      {(
        [
          {
            name: {
              en: "Subject & Predicate",
              uz: "Ega va kesim",
              ru: "Подлежащее и сказуемое",
            }[locale],
            desc: {
              en: "Every sentence splits into two parts.",
              uz: "Har bir gap ikki qismga bo'linadi.",
              ru: "Каждое предложение делится на две части.",
            }[locale],
            sp: true,
          },
          {
            name: E.phrase[locale],
            desc: E.phraseDesc[locale],
            table: PHRASE_TABLE,
          },
          {
            name: E.clause[locale],
            ctable: CLAUSE_TABLE,
          },
          {
            name: E.sentence[locale],
            desc: E.sentenceDesc[locale],
            sent: true,
          },
        ] as {
          name: string;
          desc?: string;
          sp?: boolean;
          sent?: boolean;
          table?: typeof PHRASE_TABLE;
          ctable?: typeof CLAUSE_TABLE;
        }[]
      ).map((sub) => (
        <div
          key={sub.name}
          className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-1.5"
        >
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {sub.name}
            </span>
            {sub.desc && (
              <span className="text-[13px] text-neutral-500 dark:text-neutral-400">
                {sub.desc}
              </span>
            )}
          </div>
          {sub.table && (
            <div className="mt-1.5 overflow-x-auto">
              <table className="w-full min-w-120 border-collapse text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                    <th className="w-8 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                      #
                    </th>
                    <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                      {E.phrase[locale]}
                    </th>
                    <th className="w-1/2 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                      {
                        {
                          en: "Structure",
                          uz: "Tuzilishi",
                          ru: "Структура",
                        }[locale]
                      }
                    </th>
                    <th className="w-40 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                      {POS_G.func[locale]}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sub.table.map((r, i) => (
                    <tr key={r.name.en}>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[12px] font-bold text-neutral-400 dark:text-neutral-500">
                        {i + 1}
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle">
                        <span className="block text-[12px] font-bold text-neutral-900 dark:text-neutral-100">
                          {r.name.en}
                        </span>
                        {locale !== "en" && (
                          <span className="block text-[10px] text-neutral-400 dark:text-neutral-500">
                            {r.name[locale]}
                          </span>
                        )}
                        {r.sub && (
                          <span className="block text-[10px] text-neutral-400 dark:text-neutral-500">
                            {r.sub}
                          </span>
                        )}
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-1.5 align-middle">
                        <table className="w-full table-fixed border-collapse">
                          <thead>
                            <tr>
                              {r.struct.map((s) => (
                                <th
                                  key={s.t.en}
                                  className={[
                                    "border border-neutral-200 dark:border-neutral-800 px-1 py-0.5 text-center text-[9px] font-semibold leading-tight",
                                    s.req
                                      ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                                      : "bg-neutral-50 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-500",
                                  ].join(" ")}
                                >
                                  {s.t[locale]}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              {r.struct.map((s) => (
                                <td
                                  key={s.t.en}
                                  className={[
                                    "border border-neutral-200 dark:border-neutral-800 px-1 py-0.5 text-center font-mono text-[10px] font-medium leading-tight",
                                    s.ex
                                      ? "text-neutral-700 dark:text-neutral-300"
                                      : "text-neutral-300 dark:text-neutral-600",
                                  ].join(" ")}
                                >
                                  {s.ex ?? "—"}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </td>
                      <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {r.func.map((f) => (
                            <span
                              key={f.en}
                              className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-1.5 py-px text-[10px] font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap"
                            >
                              {f[locale]}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* obligatory / optional legend for the structure cells */}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-neutral-200 dark:bg-neutral-700" />
                  {
                    {
                      en: "obligatory element",
                      uz: "majburiy bo'lak",
                      ru: "обязательный элемент",
                    }[locale]
                  }
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900" />
                  {
                    {
                      en: "optional element",
                      uz: "ixtiyoriy bo'lak",
                      ru: "необязательный элемент",
                    }[locale]
                  }
                </span>
              </div>
            </div>
          )}
          {sub.ctable && (
            <div className="mt-1.5 flex flex-col gap-3">
              {/* anatomy strip: every clause = Subject + Predicate */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  {
                    {
                      en: "Every clause =",
                      uz: "Har bir klauza =",
                      ru: "Каждая клауза =",
                    }[locale]
                  }
                </span>
                <table className="border-collapse">
                  <tbody>
                    <tr>
                      {CLAUSE_ANATOMY.map((s) => (
                        <th
                          key={s.en}
                          className="border border-neutral-200 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 text-center text-[9px] font-semibold leading-tight text-neutral-800 dark:text-neutral-200"
                        >
                          {s[locale]}
                        </th>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-120 border-collapse text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                      <th className="w-8 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        #
                      </th>
                      <th className="w-28 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.clause[locale]}
                      </th>
                      <th className="w-28 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.posColDef[locale]}
                      </th>
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {POS_G.begins[locale]}
                      </th>
                      <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {POS_G.func[locale]}
                      </th>
                      <th className="w-40 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                        {E.example[locale]}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sub.ctable.map((r, i, rows) => (
                      <React.Fragment key={r.name.en}>
                        {(i === 0 || !!rows[i - 1].dep !== !!r.dep) && (
                          /* divider row: independent rows above,
                             dependent rows below */
                          <tr>
                            <td
                              colSpan={6}
                              className="border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 px-2 py-1"
                            >
                              <span className="flex items-center text-[9px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                {r.dep
                                  ? {
                                      en: "Dependent — needs a main clause",
                                      uz: "Tobe — bosh klauzaga muhtoj",
                                      ru: "Зависимая — нужна главная клауза",
                                    }[locale]
                                  : {
                                      en: "Independent — can stand alone",
                                      uz: "Mustaqil — alohida tura oladi",
                                      ru: "Независимая — может стоять отдельно",
                                    }[locale]}
                              </span>
                            </td>
                          </tr>
                        )}
                        <tr>
                        <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[12px] font-bold text-neutral-400 dark:text-neutral-500">
                          {/* numbering restarts inside each group */}
                          {rows
                            .slice(0, i + 1)
                            .filter((x) => !!x.dep === !!r.dep).length}
                        </td>
                        <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle">
                          <span className="block text-[12px] font-bold text-neutral-900 dark:text-neutral-100">
                            {r.name.en}
                          </span>
                          {locale !== "en" && (
                            <span className="block text-[10px] text-neutral-400 dark:text-neutral-500">
                              {r.name[locale]}
                            </span>
                          )}
                          {r.sub && (
                            <span className="block text-[10px] text-neutral-400 dark:text-neutral-500">
                              {r.sub}
                            </span>
                          )}
                        </td>
                        <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[11px] leading-4 text-neutral-500 dark:text-neutral-400">
                          {r.def[locale]}
                        </td>
                        <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle">
                          {r.begins ? (
                            <div className="flex flex-wrap items-center justify-center gap-1">
                              {r.begins.map((s) => (
                                <span
                                  key={s.en}
                                  className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-1.5 py-px text-[10px] font-medium text-neutral-700 dark:text-neutral-300"
                                >
                                  {s[locale]}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="block text-center text-[11px] text-neutral-300 dark:text-neutral-600">
                              —
                            </span>
                          )}
                        </td>
                        <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle">
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {r.func.map((s) => (
                              <span
                                key={s.en}
                                className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-1.5 py-px text-[10px] font-medium text-neutral-700 dark:text-neutral-300"
                              >
                                {s[locale]}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center font-mono text-[11px] leading-snug">
                          <span className="text-neutral-400 dark:text-neutral-500">
                            {r.ex[0]}
                          </span>
                          <span className="font-bold text-neutral-900 dark:text-neutral-100 underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-2">
                            {r.ex[1]}
                          </span>
                          <span className="text-neutral-400 dark:text-neutral-500">
                            {r.ex[2]}
                          </span>
                        </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {sub.sp && (
            <div className="mt-1.5 flex flex-col gap-3">
              {/* patterns card: one sentence split into its two halves,
                  the predicate opened up into its parts, and the
                  pattern formulas those parts combine into */}
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-1.5">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                    {
                      {
                        en: "Patterns",
                        uz: "Qoliplar",
                        ru: "Модели",
                      }[locale]
                    }
                  </span>
                  <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                    {
                      {
                        en: "How the parts line up in a sentence.",
                        uz: "Bo'laklar gapda qanday tiziladi.",
                        ru: "Как части выстраиваются в предложении.",
                      }[locale]
                    }
                  </span>
                </div>
                {/* one table: the Subject/Predicate split on top,
                    each pattern's example spread under the parts */}
                <div className="mt-1 overflow-x-auto">
                  <table className="w-full min-w-120 border-collapse text-left">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                        <th
                          rowSpan={2}
                          className="w-8 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center align-middle"
                        >
                          #
                        </th>
                        <th
                          rowSpan={2}
                          className="w-36 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center align-middle"
                        >
                          {
                            {
                              en: "Formula",
                              uz: "Formula",
                              ru: "Формула",
                            }[locale]
                          }
                        </th>
                        <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                          {SP_CARDS[0].title[locale]}
                        </th>
                        <th
                          colSpan={4}
                          className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center"
                        >
                          {SP_CARDS[1].title[locale]}
                        </th>
                      </tr>
                      <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                        <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-1.5" />
                        {[SENT_EL.v, SENT_EL.o, SENT_EL.c, SENT_EL.a].map(
                          (t) => (
                            <th
                              key={t.en}
                              className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-1.5 text-center"
                            >
                              {t[locale]}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {SENT_PATTERNS.map((r, i) => {
                        const pick = (
                          f: (t: string) => boolean,
                        ): string | null => {
                          const xs = r.cols
                            .filter((c) => f(c.t.en.toLowerCase()))
                            .map((c) => c.ex);
                          return xs.length ? xs.join(" · ") : null;
                        };
                        const cells = [
                          pick((t) => t === "subject"),
                          pick((t) => t === "verb"),
                          pick(
                            (t) =>
                              t.includes("object") &&
                              !t.includes("complement"),
                          ),
                          pick((t) => t.includes("complement")),
                          pick((t) => t === "adverbial"),
                        ];
                        return (
                          <tr key={r.code}>
                            <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[12px] font-bold text-neutral-400 dark:text-neutral-500">
                              {i + 1}
                            </td>
                            <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[11px] font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                              {r.code}
                            </td>
                            {cells.map((x, j) => (
                              <td
                                key={j}
                                className={[
                                  "border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[11px] leading-tight",
                                  x
                                    ? "font-medium text-neutral-700 dark:text-neutral-300"
                                    : "text-neutral-300 dark:text-neutral-600",
                                ].join(" ")}
                              >
                                {x ?? "—"}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                  {(
                    [
                      ["S", SENT_EL.s],
                      ["V", SENT_EL.v],
                      ["O", SENT_EL.o],
                      ["C", SENT_EL.c],
                      ["A", SENT_EL.a],
                    ] as [string, L3][]
                  ).map(([l, t]) => (
                    <span key={l}>
                      <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">
                        {l}
                      </span>{" "}
                      = {t[locale]}
                    </span>
                  ))}
                </div>
              </div>
              {SP_CARDS.map((c) => (
                <div
                  key={c.title.en}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-1.5"
                >
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                      {c.title[locale]}
                    </span>
                    <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                      {c.desc[locale]}
                    </span>
                  </div>
                  <div className="mt-1 overflow-x-auto">
                    <table className="w-full min-w-120 border-collapse text-left">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                          <th className="w-8 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                            #
                          </th>
                          <th className="w-28 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                            {POS_G.types[locale]}
                          </th>
                          <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                            {E.posColDef[locale]}
                          </th>
                          <th className="w-56 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                            {E.example[locale]}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.kinds.map((k, i) => (
                          <tr key={k.name.en}>
                            <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[12px] font-bold text-neutral-400 dark:text-neutral-500">
                              {i + 1}
                            </td>
                            <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle">
                              <span className="block text-[12px] font-bold text-neutral-900 dark:text-neutral-100">
                                {k.name.en}
                              </span>
                              {locale !== "en" && (
                                <span className="block text-[10px] text-neutral-400 dark:text-neutral-500">
                                  {k.name[locale]}
                                </span>
                              )}
                            </td>
                            <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[11px] leading-4 text-neutral-500 dark:text-neutral-400">
                              {k.def[locale]}
                            </td>
                            <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center font-mono text-[11px] leading-snug">
                              <span className="text-neutral-400 dark:text-neutral-500">
                                {k.ex[0]}
                              </span>
                              <span className="font-bold text-neutral-900 dark:text-neutral-100 underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-2">
                                {k.ex[1]}
                              </span>
                              <span className="text-neutral-400 dark:text-neutral-500">
                                {k.ex[2]}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {c.forms && (
                    <div className="mt-2 flex flex-col gap-1">
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500">
                        {
                          {
                            en: "What can be a subject",
                            uz: "Ega nima bo'la oladi",
                            ru: "Чем может быть подлежащее",
                          }[locale]
                        }
                      </span>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-120 border-collapse text-left">
                          <tbody>
                            {c.forms.map((f) => (
                              <tr key={f.t.en}>
                                <td className="w-36 border border-neutral-200 dark:border-neutral-800 p-1.5 text-center align-middle text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                                  {f.t[locale]}
                                </td>
                                <td className="border border-neutral-200 dark:border-neutral-800 p-1.5 align-middle text-center font-mono text-[11px] leading-snug">
                                  <span className="text-neutral-400 dark:text-neutral-500">
                                    {f.ex[0]}
                                  </span>
                                  <span className="font-bold text-neutral-900 dark:text-neutral-100 underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-2">
                                    {f.ex[1]}
                                  </span>
                                  <span className="text-neutral-400 dark:text-neutral-500">
                                    {f.ex[2]}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {sub.sent && (
            <div className="mt-1.5 flex flex-col gap-3">
              {/* 1 — Structure: how clauses combine */}
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-1.5">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                    {
                      {
                        en: "Structure",
                        uz: "Tuzilishi",
                        ru: "Структура",
                      }[locale]
                    }
                  </span>
                  <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                    {
                      {
                        en: "How many clauses and how they join.",
                        uz: "Nechta klauza va ular qanday birikadi.",
                        ru: "Сколько клауз и как они соединяются.",
                      }[locale]
                    }
                  </span>
                </div>
                <div className="mt-1 overflow-x-auto">
                  <table className="w-full min-w-120 border-collapse text-left">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                        <th className="w-8 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                          #
                        </th>
                        <th className="w-36 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                          {
                            {
                              en: "Structure",
                              uz: "Tuzilishi",
                              ru: "Структура",
                            }[locale]
                          }
                        </th>
                        <th className="w-24 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                          {
                            {
                              en: "Main clause",
                              uz: "Bosh klauza",
                              ru: "Главная клауза",
                            }[locale]
                          }
                        </th>
                        <th className="w-24 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                          {
                            {
                              en: "Dependent clause",
                              uz: "Tobe klauza",
                              ru: "Зависимая клауза",
                            }[locale]
                          }
                        </th>
                        <th className="w-56 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                          {E.example[locale]}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {SENT_STRUCT.map((r, i) => (
                        <tr key={r.name.en}>
                          <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[12px] font-bold text-neutral-400 dark:text-neutral-500">
                            {i + 1}
                          </td>
                          <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle">
                            <span className="block text-[12px] font-bold text-neutral-900 dark:text-neutral-100">
                              {r.name.en}
                            </span>
                            {locale !== "en" && (
                              <span className="block text-[10px] text-neutral-400 dark:text-neutral-500">
                                {r.name[locale]}
                              </span>
                            )}
                          </td>
                          <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[13px] font-bold text-neutral-800 dark:text-neutral-200">
                            {r.m}
                          </td>
                          <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[13px] font-bold text-neutral-800 dark:text-neutral-200">
                            {r.d ?? (
                              <span className="font-sans text-[11px] font-normal text-neutral-300 dark:text-neutral-600">
                                —
                              </span>
                            )}
                          </td>
                          <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center font-mono text-[11px] leading-snug">
                            {r.ex.map((s, j) => (
                              <span
                                key={j}
                                className={
                                  s.k === "m"
                                    ? "font-bold text-neutral-900 dark:text-neutral-100"
                                    : s.k === "d"
                                      ? "text-neutral-700 dark:text-neutral-300 underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-2"
                                      : "text-neutral-400 dark:text-neutral-500"
                                }
                              >
                                {s.t}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* 2 — Types: what the sentence does */}
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-1.5">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                    {POS_G.types[locale]}
                  </span>
                  <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                    {
                      {
                        en: "What the sentence does.",
                        uz: "Gap nima qiladi.",
                        ru: "Что делает предложение.",
                      }[locale]
                    }
                  </span>
                </div>
                <div className="mt-1 overflow-x-auto">
                  <table className="w-full min-w-120 border-collapse text-left">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                        <th className="w-8 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                          #
                        </th>
                        <th className="w-36 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                          {POS_G.types[locale]}
                        </th>
                        <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                          {
                            {
                              en: "Purpose",
                              uz: "Maqsadi",
                              ru: "Цель",
                            }[locale]
                          }
                        </th>
                        <th className="w-20 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                          {
                            {
                              en: "Ends with",
                              uz: "Tugashi",
                              ru: "Знак в конце",
                            }[locale]
                          }
                        </th>
                        <th className="w-44 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                          {E.example[locale]}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {SENT_TYPES.map((r, i) => (
                        <tr key={r.name.en}>
                          <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[12px] font-bold text-neutral-400 dark:text-neutral-500">
                            {i + 1}
                          </td>
                          <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle">
                            <span className="block text-[12px] font-bold text-neutral-900 dark:text-neutral-100">
                              {r.name.en}
                            </span>
                            {locale !== "en" && (
                              <span className="block text-[10px] text-neutral-400 dark:text-neutral-500">
                                {r.name[locale]}
                              </span>
                            )}
                          </td>
                          <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center text-[11px] leading-4 text-neutral-500 dark:text-neutral-400">
                            {r.def[locale]}
                          </td>
                          <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center font-mono text-[15px] font-bold text-neutral-800 dark:text-neutral-200">
                            {r.mark}
                          </td>
                          <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center font-mono text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                            {r.ex}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
