// Validates data/letterLessons.json (the letter/codes lesson templates).
// Mirrors the runtime expectations of lib/english/letterCurriculum.ts and
// components/letters/LetterLessonRunner.tsx in plain JS — change them
// together. Run: npm run validate:letters
//
// Checks:
//   1. Track ids are exactly "letters" and "codes"; targetWpm is a number.
//   2. Lesson ids are unique per track, lowercase, URL-safe.
//   3. type is one of the course lesson types (lessonTypes.tsx).
//   4. kind is one the runner mounts (or "SOON" = coming-soon card).
//   5. Every title has non-empty en/uz/ru.
//   6. passStars (when present) is 0..5; ungraded types must not require stars.
//   7. Thumbnail svgId exists in the ThumbnailRegistry.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(
  readFileSync(join(root, "data/letterLessons.json"), "utf8"),
);

const TRACK_IDS = ["letters", "codes"];
const TYPES = ["lesson", "practice", "test", "game"];
const UNGRADED = new Set(["lesson", "practice"]);
const KINDS = {
  letters: ["MEET", "TYPE", "CAPS", "HEAR", "MIX", "RAIN", "SOON"],
  codes: ["CODES_LEARN", "SOON"],
};
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

if (!Array.isArray(data.tracks)) {
  errors.push("root: `tracks` must be an array");
} else {
  const seenTracks = new Set();
  for (const track of data.tracks) {
    const t = `track "${track.id}"`;
    if (!TRACK_IDS.includes(track.id)) {
      errors.push(`${t}: id must be one of ${TRACK_IDS.join(", ")}`);
    }
    if (seenTracks.has(track.id)) errors.push(`${t}: duplicate track id`);
    seenTracks.add(track.id);
    if (typeof track.targetWpm !== "number" || track.targetWpm < 0) {
      errors.push(`${t}: targetWpm must be a number >= 0`);
    }
    if (!Array.isArray(track.lessons) || track.lessons.length === 0) {
      errors.push(`${t}: lessons must be a non-empty array`);
      continue;
    }
    const seen = new Set();
    const kinds = KINDS[track.id] ?? [];
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
      if (!kinds.includes(lesson.kind)) {
        errors.push(`${p}: kind "${lesson.kind}" not in ${kinds.join(", ")}`);
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
        if (
          !Number.isInteger(lesson.passStars) ||
          lesson.passStars < 0 ||
          lesson.passStars > 5
        ) {
          errors.push(`${p}: passStars must be an integer 0..5`);
        }
        if (UNGRADED.has(lesson.type) && lesson.passStars > 0) {
          errors.push(`${p}: ungraded type "${lesson.type}" cannot require stars`);
        }
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
  for (const id of TRACK_IDS) {
    if (!seenTracks.has(id)) errors.push(`root: missing track "${id}"`);
  }
}

if (errors.length > 0) {
  console.error(`✖ letterLessons.json: ${errors.length} problem(s)\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("✓ letterLessons.json is valid");
