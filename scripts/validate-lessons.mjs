#!/usr/bin/env node
// Validates data/lessons.json (v4 authoring format).
// Run with: npm run validate:lessons
//
// Checks:
//   1. Every localized string has non-empty en / uz / ru
//   2. All ids are unique across the tree
//   3. Every step has a valid viewport, mode, and non-empty text
//   4. If a lesson declares `keys`, all characters used in its step
//      text are covered by them (the old "Law 1", now automatic)
//   5. Every thumbnail svgId exists in the ThumbnailRegistry

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const VIEWPORTS = new Set([
  "POSTURE_CHECK",
  "KEY_INTRO",
  "STANDARD_GYM",
  "GAME_NINJA_RUN",
]);
const MODES = new Set(["learn", "careful", "strict", "free"]);
// Keep in sync with LESSON_TYPES in lib/lessonTypes.tsx (this script can't import TS)
const TYPES = new Set(["lesson", "practice", "test", "game"]);
const UNGRADED_TYPES = new Set(["lesson", "practice"]);
const LOCALES = ["en", "uz", "ru"];

const errors = [];
const warnings = [];

// ── Load data ──
let course;
try {
  course = JSON.parse(readFileSync(join(root, "data/lessons.json"), "utf8"));
} catch (e) {
  console.error(`✗ data/lessons.json is not valid JSON: ${e.message}`);
  process.exit(1);
}

// ── Registry ids from SvgLibrary.tsx ──
let registryIds = new Set();
try {
  const lib = readFileSync(
    join(root, "components/thumbnails/SvgLibrary.tsx"),
    "utf8",
  );
  const block = lib.slice(lib.indexOf("ThumbnailRegistry"));
  for (const m of block.matchAll(/'([A-Z0-9_]+)':/g)) registryIds.add(m[1]);
} catch {
  warnings.push("Could not read SvgLibrary.tsx — skipping thumbnail checks");
  registryIds = null;
}

const seenIds = new Map(); // id -> path

function checkId(id, path) {
  if (!id || typeof id !== "string") {
    errors.push(`${path}: missing "id"`);
    return;
  }
  if (seenIds.has(id)) {
    errors.push(`${path}: duplicate id "${id}" (also at ${seenIds.get(id)})`);
  } else {
    seenIds.set(id, path);
  }
}

function checkLocalized(obj, path) {
  if (!obj || typeof obj !== "object") {
    errors.push(`${path}: missing localized text`);
    return;
  }
  for (const loc of LOCALES) {
    if (!obj[loc] || !String(obj[loc]).trim()) {
      errors.push(`${path}: missing "${loc}" translation`);
    }
  }
}

function checkThumbnail(thumb, path) {
  if (!thumb) return;
  if (thumb.svgId && registryIds && !registryIds.has(thumb.svgId)) {
    errors.push(
      `${path}: thumbnail svgId "${thumb.svgId}" is not in ThumbnailRegistry`,
    );
  }
  if (!thumb.svgId && !thumb.imageSrc) {
    warnings.push(`${path}: thumbnail has neither svgId nor imageSrc`);
  }
}

function tokensOf(text) {
  if (Array.isArray(text)) return text.filter(Boolean);
  if (typeof text === "string") return text.split(/\s+/).filter(Boolean);
  return null;
}

// ── Walk the tree ──
checkId(course.id, "course");
checkLocalized(course.title, "course.title");
checkThumbnail(course.thumbnail, "course");

let lessonCount = 0;
let stepCount = 0;

for (const [ci, chapter] of (course.chapters ?? []).entries()) {
  const cPath = `chapter[${ci}]`;
  checkId(chapter.id, cPath);
  checkLocalized(chapter.title, `${cPath}.title`);
  if (chapter.description) checkLocalized(chapter.description, `${cPath}.description`);

  for (const [si, section] of (chapter.sections ?? []).entries()) {
    const sPath = `${cPath}.section[${si}]`;
    checkId(section.id, sPath);
    checkLocalized(section.title, `${sPath}.title`);
    checkThumbnail(section.thumbnail, sPath);

    for (const [li, lesson] of (section.lessons ?? []).entries()) {
      const lPath = `${sPath}.lesson[${li}] (${lesson.id ?? "?"})`;
      lessonCount++;
      checkId(lesson.id, lPath);
      checkLocalized(lesson.title, `${lPath}.title`);
      if (lesson.goal) checkLocalized(lesson.goal, `${lPath}.goal`);
      checkThumbnail(lesson.thumbnail, lPath);

      if (lesson.type && !TYPES.has(lesson.type)) {
        errors.push(`${lPath}: invalid type "${lesson.type}"`);
      }
      if (
        lesson.passStars !== undefined &&
        (typeof lesson.passStars !== "number" ||
          lesson.passStars < 0 ||
          lesson.passStars > 5)
      ) {
        errors.push(`${lPath}: passStars must be a number between 0 and 5`);
      }
      const effectiveType = lesson.type ?? "practice";
      if (UNGRADED_TYPES.has(effectiveType) && lesson.passStars > 0) {
        errors.push(
          `${lPath}: type "${effectiveType}" is ungraded — passStars must be 0 or omitted`,
        );
      }
      if (!Array.isArray(lesson.steps) || lesson.steps.length === 0) {
        errors.push(`${lPath}: has no steps`);
        continue;
      }

      const declaredKeys = lesson.keys
        ? new Set(lesson.keys.map((k) => k.toLowerCase()))
        : null;

      for (const [sti, step] of lesson.steps.entries()) {
        const stPath = `${lPath}.step[${sti}]`;
        stepCount++;

        if (!VIEWPORTS.has(step.viewport)) {
          errors.push(`${stPath}: invalid viewport "${step.viewport}"`);
        }
        if (step.mode !== undefined && !MODES.has(step.mode)) {
          errors.push(`${stPath}: invalid mode "${step.mode}"`);
        }
        checkLocalized(step.instruction, `${stPath}.instruction`);

        const tokens = tokensOf(step.text);
        if (!tokens || tokens.length === 0) {
          errors.push(`${stPath}: "text" is empty or missing`);
          continue;
        }
        if (declaredKeys) {
          for (const token of tokens) {
            for (const ch of token.toLowerCase()) {
              if (!declaredKeys.has(ch)) {
                errors.push(
                  `${stPath}: character "${ch}" in "${token}" is not in the lesson's keys [${[...declaredKeys].join(", ")}]`,
                );
              }
            }
          }
        }
        if (step.targetWPM !== undefined && (typeof step.targetWPM !== "number" || step.targetWPM < 0)) {
          errors.push(`${stPath}: targetWPM must be a non-negative number`);
        }
        if (step.maxMistakes !== undefined && (typeof step.maxMistakes !== "number" || step.maxMistakes < 0)) {
          errors.push(`${stPath}: maxMistakes must be a non-negative number`);
        }
      }
    }
  }
}

// ── Report ──
for (const w of warnings) console.warn(`⚠ ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error(`\n${errors.length} error(s) in data/lessons.json`);
  process.exit(1);
}
console.log(
  `✓ lessons.json is valid — ${lessonCount} lesson(s), ${stepCount} step(s), all 3 locales complete`,
);
