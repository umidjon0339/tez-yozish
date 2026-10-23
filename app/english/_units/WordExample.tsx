import { useLocale } from "@/lib/core/locale";
import { STR } from "@/lib/core/uiStrings";
import { POS_TABLE } from "../_data";
import { PosTree } from "../_components";

const E = STR.english;

// Unit 5: the ten parts of speech.
export function WordExample() {
  const { locale } = useLocale();

  return (
    /* The 10 parts of speech — every word fits one of these */
    <div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 border-collapse text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                <th className="w-8 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                  #
                </th>
                <th className="w-28 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                  {E.posColName[locale]}
                </th>
                <th className="w-36 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                  {E.posColDef[locale]}
                </th>
                <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                  {E.posColClass[locale]}
                </th>
                <th className="w-20 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 text-center">
                  {E.example[locale]}
                </th>
              </tr>
            </thead>
            <tbody>
              {POS_TABLE.map((r, i) => (
                <tr key={r.name.en}>
                  <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle font-mono text-[12px] font-bold text-neutral-400 dark:text-neutral-500">
                    {i + 1}
                  </td>
                  <td className="border border-neutral-200 dark:border-neutral-800 p-2 text-center align-middle">
                    <span className="block text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
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
                  <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle">
                    <div className="flex flex-col gap-1">
                      {r.groups.map((g) => (
                        <div
                          key={g.label.en}
                          className={
                            g.tree || g.matrix
                              ? "flex items-start gap-1"
                              : "flex flex-wrap items-center gap-1"
                          }
                        >
                          <span className="w-20 shrink-0 text-[9px] uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500">
                            {g.label[locale]}
                          </span>
                          {g.matrix ? (
                            <table className="w-full table-fixed border-collapse">
                              <thead>
                                <tr>
                                  <th className="w-14 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-1 py-0.5 text-center font-mono text-[9px] font-bold text-neutral-500 dark:text-neutral-400">
                                    12
                                  </th>
                                  {g.matrix.cols.map((c) => (
                                    <th
                                      key={c.en}
                                      className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-0.5 py-0.5 text-center text-[8px] uppercase font-semibold leading-tight text-neutral-400 dark:text-neutral-500"
                                    >
                                      {c[locale]}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {g.matrix.rows.map((row) => (
                                  <tr key={row.t.en}>
                                    <th className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-1.5 py-0.5 text-left text-[9px] uppercase tracking-wide font-semibold text-neutral-400 dark:text-neutral-500">
                                      {row.t[locale]}
                                    </th>
                                    {row.cells.map((c, ci) => (
                                      <td
                                        key={ci}
                                        className="border border-neutral-200 dark:border-neutral-800 px-1 py-0.5 text-center font-mono text-[10px] font-medium leading-tight text-neutral-700 dark:text-neutral-300"
                                      >
                                        {c}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : g.tree ? (
                            <PosTree nodes={g.tree} locale={locale} />
                          ) : (
                            g.subs?.map((s) => (
                              <span
                                key={s.en}
                                className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-1.5 py-px text-[10px] font-medium text-neutral-700 dark:text-neutral-300"
                              >
                                {s[locale]}
                              </span>
                            ))
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="border border-neutral-200 dark:border-neutral-800 p-2 align-middle text-center font-mono text-[12px] font-semibold text-neutral-700 dark:text-neutral-300">
                    {r.ex.map((w) => (
                      <span key={w} className="block whitespace-nowrap">
                        {w}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  );
}
