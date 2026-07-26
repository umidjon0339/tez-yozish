// Validates data/phonemeLessons.json (the phoneme lesson template).
// Mirrors the runtime expectations of lib/phonemeCurriculum.ts and
// components/phonemes/PhonemeLessonRunner.tsx in plain JS — change them
// together. Run: npm run validate:phonemes
//
// Checks (same list as validate-letter-lessons.mjs):
//   1. Exactly one track with id "phonemes"; targetWpm is a number.
//   2. Lesson ids are unique, lowercase, URL-safe.
//   3. type is one of the course lesson types (lessonTypes.tsx).
//   4. kind is one the runner mounts (or "SOON" = coming-soon card).
//   5. Every title has non-empty en/uz/ru.
//   6. passStars is rejected — unlocking is accuracy-based (PASS_ACCURACY).
//   7. Thumbnail svgId exists in the ThumbnailRegistry.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(
  readFileSync(join(root, "data/phonemeLessons.json"), "utf8"),
);

const TYPES = ["lesson", "practice", "test", "game"];
// SHADE lessons are generated per-phoneme by lib/phonemeCurriculum.ts and
// never appear in the JSON template.
const KINDS = [
  "MEET",
  "SHADES",
  "TYPE",
  "HEAR",
  "SPELL",
  "PAIRS",
  "MASTER",
  "RAIN",
  "NINJA",
  "SOON",
];
const LOCALES = ["en", "uz", "ru"];

// svgIds scraped from the ThumbnailRegistry literal (same regex idiom as
// scripts/validate-lessons.mjs).
const lib = readFileSync(
  join(root, "components/thumbnails/SvgLibrary.tsx"),
  "utf8",
);
const block = lib.slice(lib.indexOf("ThumbnailRegistry"));
const registryIds = new Set(
  [...block.matchAll(/'([A-Z0-9_]+)':/g)].map((m) => m[1]),
);

const errors = [];

if (!Array.isArray(data.tracks) || data.tracks.length !== 1) {
  errors.push('root: `tracks` must be an array with exactly one track');
} else {
  const track = data.tracks[0];
  const t = `track "${track.id}"`;
  if (track.id !== "phonemes") {
    errors.push(`${t}: id must be "phonemes"`);
  }
  if (typeof track.targetWpm !== "number" || track.targetWpm < 0) {
    errors.push(`${t}: targetWpm must be a number >= 0`);
  }
  if (!Array.isArray(track.lessons) || track.lessons.length === 0) {
    errors.push(`${t}: lessons must be a non-empty array`);
  } else {
    const seen = new Set();
    for (const lesson of track.lessons) {
      const p = `${t} lesson "${lesson.id}"`;
      if (!/^[a-z][a-z0-9-]*$/.test(lesson.id ?? "")) {
        errors.push(`${p}: id must be lowercase URL-safe ([a-z0-9-])`);
      }
      if (seen.has(lesson.id)) errors.push(`${p}: duplicate lesson id`);
      seen.add(lesson.id);

      if (!TYPES.includes(lesson.type)) {
        errors.push(`${p}: type "${lesson.type}" not in ${TYPES.join(", ")}`);
      }
      if (!KINDS.includes(lesson.kind)) {
        errors.push(`${p}: kind "${lesson.kind}" not in ${KINDS.join(", ")}`);
      }
      for (const loc of LOCALES) {
        if (
          typeof lesson.title?.[loc] !== "string" ||
          lesson.title[loc].trim() === ""
        ) {
          errors.push(`${p}: title.${loc} missing or empty`);
        }
      }
      if (lesson.passStars !== undefined) {
        errors.push(
          `${p}: passStars is not used — phoneme unlocking is accuracy-based (PASS_ACCURACY in lib/phonemeCurriculum.ts)`,
        );
      }
      if (!lesson.thumbnail?.svgId) {
        errors.push(`${p}: thumbnail.svgId missing`);
      } else if (!registryIds.has(lesson.thumbnail.svgId)) {
        errors.push(
          `${p}: thumbnail svgId "${lesson.thumbnail.svgId}" is not in ThumbnailRegistry`,
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`✖ phonemeLessons.json: ${errors.length} problem(s)\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("✓ phonemeLessons.json is valid");
