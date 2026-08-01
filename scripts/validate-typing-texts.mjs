#!/usr/bin/env node
/**
 * Validates `data/typing-texts.json` — the single source of every word and
 * sentence the home-page typing test can produce (docs/home-test.md §9).
 *
 * The check that matters: the curriculum mode joins two files by a **subject
 * slug**, and nothing else enforces that join. Renaming a subject in
 * `data/k-12-curriculum.json` silently orphans its text for every grade that
 * teaches it, and the test quietly falls back to generic words — no error, no
 * blank screen, just the wrong content. That has already happened once
 * ("Foreign Language" -> "English Language"), which is why this script exists.
 *
 *   npm run validate:texts
 */

import { readFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const texts = read("../data/typing-texts.json");
const k12 = read("../data/k-12-curriculum.json");

/** Mirrors `slugify` in lib/k12.ts — keep the two in step. */
const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const errors = [];
const warnings = [];

// ── shape ──
const LANGS = ["en", "uz"];
const BANDS = Object.keys(texts.bands ?? {});
if (!BANDS.length) errors.push("`bands` is empty — no grade maps to a band.");

for (const lang of LANGS) {
  const bank = texts.words?.[lang];
  if (!Array.isArray(bank) || bank.length < 50) {
    errors.push(`words.${lang}: expected a bank of at least 50 words, got ${bank?.length ?? 0}.`);
  }
  for (const w of bank ?? []) {
    if (/\s/.test(w)) errors.push(`words.${lang}: "${w}" contains a space — a space is always a word boundary.`);
  }
  const quotes = texts.quotes?.[lang];
  if (!Array.isArray(quotes) || !quotes.length) errors.push(`quotes.${lang}: no quotes.`);
  for (const q of quotes ?? []) {
    if (!q.text || !q.source) errors.push(`quotes.${lang}: every quote needs both \`text\` and \`source\`.`);
  }
}

// Every grade must land in exactly one band.
const banded = new Map();
for (const [band, grades] of Object.entries(texts.bands ?? {})) {
  for (const g of grades) {
    if (banded.has(g)) errors.push(`grade ${g} is in two bands: ${banded.get(g)} and ${band}.`);
    banded.set(g, band);
  }
}
for (const g of Object.keys(k12)) {
  if (!banded.has(Number(g))) errors.push(`grade ${g} is in no band — it would fall back to "middle".`);
}

// ── the join with the curriculum ──
const needed = new Map(); // slug -> grades that teach it
for (const [grade, row] of Object.entries(k12)) {
  for (const name of row.en) {
    const slug = slugify(name);
    if (!needed.has(slug)) needed.set(slug, []);
    needed.get(slug).push(grade);
  }
}

const have = new Set(Object.keys(texts.subjects ?? {}).map((k) => k.split("@")[0]));
for (const [slug, grades] of needed) {
  if (!have.has(slug)) {
    errors.push(
      `subject "${slug}" is taught in grade(s) ${grades.join(", ")} but has no entry in typing-texts.json ` +
        `— those grades would silently fall back to the generic word bank.`,
    );
  }
}
for (const slug of have) {
  if (!needed.has(slug)) warnings.push(`subject "${slug}" is in typing-texts.json but no grade teaches it.`);
}

// ── every subject entry must be usable ──
for (const [key, entry] of Object.entries(texts.subjects ?? {})) {
  const [, band] = key.split("@");
  if (band && !BANDS.includes(band)) {
    errors.push(`"${key}": unknown band "${band}" (known: ${BANDS.join(", ")}).`);
  }
  for (const lang of LANGS) {
    const t = entry[lang];
    if (!t) {
      errors.push(`"${key}": missing the "${lang}" block.`);
      continue;
    }
    if (!t.sentences?.length && !t.words?.length) {
      errors.push(`"${key}".${lang}: has neither sentences nor words — nothing to type.`);
    }
    for (const w of t.words ?? []) {
      if (/\s/.test(w)) errors.push(`"${key}".${lang}: word "${w}" contains a space.`);
    }
  }
}

// ── report ──
for (const w of warnings) console.warn(`warn  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error ${e}`);
  console.error(`\n${errors.length} error(s) in data/typing-texts.json`);
  process.exit(1);
}
console.log(
  `typing-texts.json ok — ${have.size} subjects covering ${needed.size} taught by the curriculum, ` +
    `${LANGS.map((l) => `${texts.words[l].length} ${l} words`).join(", ")}.`,
);
