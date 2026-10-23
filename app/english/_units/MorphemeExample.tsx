import { useLocale } from "@/lib/locale";
import { STR } from "@/lib/uiStrings";
import { TreeTag, TreeBranch, MorphLeaf, PosLeaf } from "../_components";

const E = STR.english;

// Unit 4: the morpheme classification tree.
export function MorphemeExample() {
  const { locale } = useLocale();

  return (
    /* The classification tree, drawn left → right: morphemes → free /
       bound → their kinds. One shape + one example per leaf, one color
       per kind — compact enough to read in a single look. */
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 overflow-x-auto">
      <TreeBranch node={<TreeTag title={E.morpheme[locale]} accent />}>
        {/* ROOTS: the meaning part — free (words) or bound (bases) */}
        <TreeBranch
          node={
            <TreeTag
              title={E.rootsTitle[locale]}
              hint={E.rootsHint[locale]}
              tint="free"
            />
          }
        >
          <TreeBranch
            node={
              <TreeTag
                title={E.freeRootsTitle[locale]}
                hint={E.freeHint[locale]}
                tint="free"
              />
            }
          >
            <PosLeaf
              label={E.openClass[locale]}
              count="69k"
              items={[
                { t: E.posNoun[locale], n: "40k" },
                { t: E.posAdjective[locale], n: "15k" },
                { t: E.posVerb[locale], n: "12k" },
                { t: E.posAdverb[locale], n: "2k" },
              ]}
            />
            <PosLeaf
              label={E.closedClass[locale]}
              count="400–500"
              items={[
                { t: E.posPreposition[locale], n: "~150" },
                { t: E.posPronoun[locale], n: "~100" },
                { t: E.posQuantifier[locale], n: "~100" },
                { t: E.posConjunction[locale], n: "~50" },
                { t: E.posAuxiliary[locale], n: "~25" },
                { t: E.posArticle[locale], n: "3" },
              ]}
            />
          </TreeBranch>
          <TreeBranch
            node={
              <TreeTag
                title={E.boundRootsTitle[locale]}
                hint={E.boundHint[locale]}
                cls="border-emerald-500/20 bg-emerald-500/5"
              />
            }
          >
            <MorphLeaf
              name={E.boundBasesTitle[locale]}
              count="120"
              c="base"
              cols={[
                { p: "base", t: "cran-", b: true },
                { p: "root", t: "berry" },
              ]}
            />
          </TreeBranch>
        </TreeBranch>
        {/* AFFIXES: derivational / inflectional, by position inside */}
        <TreeBranch
          node={
            <TreeTag
              title={E.affixesTitle[locale]}
              hint={E.affixesHint[locale]}
              tint="bound"
            />
          }
        >
          <TreeBranch
            node={
              <TreeTag
                title={E.derivationalName[locale]}
                hint={E.derivationalShort[locale]}
              />
            }
          >
            <MorphLeaf
              name={E.prefixName[locale]}
              count="2k"
              c="prefix"
              cols={[
                { p: "prefix", t: "un-", b: true },
                { p: "root", t: "kind" },
              ]}
            />
            <MorphLeaf
              name={E.suffixName[locale]}
              count="1k"
              c="suffix"
              cols={[
                { p: "root", t: "kind" },
                { p: "suffix", t: "-ness", b: true },
              ]}
            />
          </TreeBranch>
          <TreeBranch
            node={
              <TreeTag
                title={E.inflectionalName[locale]}
                hint={E.inflectionalShort[locale]}
              />
            }
          >
            <MorphLeaf
              name={E.suffixName[locale]}
              count="8"
              c="inflect"
              cols={[
                { p: "root", t: "cat" },
                { p: "suffix", t: "-s", b: true },
              ]}
            />
          </TreeBranch>
          {/* Extension line = one tag level (w-32 tag + w-4 stub +
              pl-4), so Interfix starts on the Prefix/Suffix column. */}
          <div className="flex items-center">
            <span aria-hidden className="h-px w-40 shrink-0 bg-neutral-300 dark:bg-neutral-600" />
            <MorphLeaf
              name={E.interfixName[locale]}
              rare={E.tagRare[locale]}
              count="3"
              c="interfix"
              cols={[
                { p: "root", t: "speed" },
                { p: "interfix", t: "-o-", b: true },
                { p: "root", t: "meter" },
              ]}
            />
          </div>
        </TreeBranch>
        {/* Contracted forms: bound pieces that are neither root nor
            affix. Extension line = two tag levels (2 × (w-32 tag +
            w-4 stub + pl-4)), so the card starts on the leaf column
            shared by Prefix / Suffix / Interfix. */}
        <div className="flex items-center">
          <span aria-hidden className="h-px w-80 shrink-0 bg-neutral-300 dark:bg-neutral-600" />
          <MorphLeaf
            name={E.contractedTitle[locale]}
            count="7"
            c="contracted"
            cols={[
              { p: "root", t: "I" },
              { p: ["apos", "contr"], t: "'ll", b: true },
            ]}
          />
        </div>
      </TreeBranch>
    </div>
  );
}
