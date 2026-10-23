#!/usr/bin/env node
// Validates data/lessons.json (v4 authoring format).
// Run with: npm run validate:lessons
//
// Checks:
//   1. Every localized string has non-empty en / uz / ru
//   2. All ids are unique across the tree
//   3. Every step has a valid viewport, mode, and non-empty text
//   4. If a lesson declares `keys`, all characters used in its step
//      text are covered by them (the old "Law 1", now automatic).
//      Special keys ("Enter") and chords ("Ctrl+C") count as whole keys.
//   5. Every thumbnail svgId exists in the ThumbnailRegistry
//   6. Special-key/chord tokens appear only where the engine supports
//      them, and `prefill` (fix-the-typo drills) is well-formed

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const VIEWPORTS = new Set([
  "POSTURE_CHECK",
  "KEY_INTRO",
  "STANDARD_GYM",
  "GAME_NINJA_RUN",
  "CHAT_SIM",
  "SHORTCUT_DOJO",
]);

// ── Shortcut Dojo simulation — keep in sync with lib/typing/dojoSim.ts ──
// Simulating the task script at validation time rejects impossible lessons
// (copy with nothing selected, undo with no history, …).
const DOJO_ACTIONS = new Set([
  "Ctrl+A",
  "Ctrl+C",
  "Ctrl+V",
  "Ctrl+X",
  "Ctrl+Z",
  "Ctrl+Y",
  "Shift+ArrowRight",
  "Shift+ArrowLeft",
]);

function simulateDojo(doc, actions) {
  let words = doc.split(/\s+/).filter(Boolean);
  let sel = null; // [start, end)
  let clip = [];
  const undo = [];
  const redo = [];
  for (const [i, a] of actions.entries()) {
    const fail = (msg) => ({ failedAt: i, error: msg });
    switch (a) {
      case "Ctrl+A":
        if (!words.length) return fail("the document is empty");
        sel = [0, words.length];
        break;
      case "Shift+ArrowRight":
        if (!words.length) return fail("the document is empty");
        if (!sel) sel = [0, 1];
        else if (sel[1] >= words.length)
          return fail("the selection already reaches the end");
        else sel = [sel[0], sel[1] + 1];
        break;
      case "Shift+ArrowLeft":
        if (!sel || sel[1] - sel[0] <= 1) return fail("no selection to shrink");
        sel = [sel[0], sel[1] - 1];
        break;
      case "Ctrl+C":
        if (!sel) return fail("nothing is selected to copy");
        clip = words.slice(sel[0], sel[1]);
        break;
      case "Ctrl+X":
        if (!sel) return fail("nothing is selected to cut");
        undo.push({ words, sel });
        redo.length = 0;
        clip = words.slice(sel[0], sel[1]);
        words = [...words.slice(0, sel[0]), ...words.slice(sel[1])];
        sel = null;
        break;
      case "Ctrl+V": {
        if (!clip.length) return fail("the clipboard is empty");
        undo.push({ words, sel });
        redo.length = 0;
        words = sel
          ? [...words.slice(0, sel[0]), ...clip, ...words.slice(sel[1])]
          : [...words, ...clip];
        sel = null;
        break;
      }
      case "Ctrl+Z": {
        if (!undo.length) return fail("nothing to undo");
        redo.push({ words, sel });
        ({ words, sel } = undo.pop());
        break;
      }
      case "Ctrl+Y": {
        if (!redo.length) return fail("nothing to redo");
        undo.push({ words, sel });
        ({ words, sel } = redo.pop());
        break;
      }
    }
  }
  return null; // script is playable
}
const MODES = new Set(["learn", "careful", "strict", "free"]);
// Keep in sync with LESSON_TYPES in lib/typing/lessonTypes.tsx (this script can't import TS)
const TYPES = new Set(["lesson", "practice", "test", "game"]);
const UNGRADED_TYPES = new Set(["lesson", "practice"]);
const LOCALES = ["en", "uz", "ru"];
// Modes whose preset allows backspace (keep in sync with MODE_PRESETS in lib/typing/curriculum.ts)
const BACKSPACE_MODES = new Set(["careful", "strict"]);

// ── Special-key & chord tokens — keep in sync with lib/typing/keyTokens.ts ──
const SPECIAL_KEYS = new Set([
  "Enter",
  "Backspace",
  "Tab",
  "CapsLock",
  "Control",
  "Alt",
  "Shift",
]);
// Bare special keys allowed INSIDE STANDARD_GYM text (Enter = line break, Tab = indent)
const GYM_INLINE_SPECIALS = new Set(["Enter", "Tab"]);
const CHORD_MODIFIERS = new Set(["Ctrl", "Alt", "Shift"]);
const CHORD_NAMED_BASES = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "Delete",
]);

// "Ctrl+C" → { mods: ["Ctrl"], base: "C" }; plain text like "1+1" → null
function parseChord(token) {
  if (!token.includes("+")) return null;
  const parts = token.split("+");
  if (parts.length < 2 || parts.some((p) => p === "")) return null;
  const mods = parts.slice(0, -1);
  const base = parts[parts.length - 1];
  const seen = new Set();
  for (const m of mods) {
    if (!CHORD_MODIFIERS.has(m) || seen.has(m)) return null;
    seen.add(m);
  }
  if (!/^[a-zA-Z0-9]$/.test(base) && !CHORD_NAMED_BASES.has(base)) return null;
  return { mods, base };
}

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

        let tokens;
        if (step.viewport === "CHAT_SIM") {
          // Chat steps carry a conversation instead of text. Typed content =
          // every "you" turn + the Enter that sends it (mirrors curriculum.ts).
          if (step.text !== undefined) {
            errors.push(`${stPath}: CHAT_SIM steps use "chat", not "text"`);
          }
          if (step.dojo !== undefined) {
            errors.push(`${stPath}: "dojo" only works in SHORTCUT_DOJO steps`);
          }
          if (!Array.isArray(step.chat) || step.chat.length === 0) {
            errors.push(`${stPath}: CHAT_SIM needs a non-empty "chat" array`);
            continue;
          }
          tokens = [];
          let youTurns = 0;
          for (const [ti, turn] of step.chat.entries()) {
            const tPath = `${stPath}.chat[${ti}]`;
            if (!turn || (turn.from !== "them" && turn.from !== "you")) {
              errors.push(`${tPath}: "from" must be "them" or "you"`);
              continue;
            }
            if (typeof turn.text !== "string" || !turn.text.trim()) {
              errors.push(`${tPath}: "text" is empty or missing`);
              continue;
            }
            if (turn.from !== "you") continue;
            youTurns++;
            for (const tok of turn.text.split(/\s+/).filter(Boolean)) {
              if (SPECIAL_KEYS.has(tok) || parseChord(tok)) {
                errors.push(
                  `${tPath}: "${tok}" — chat messages are plain typed text`,
                );
                continue;
              }
              tokens.push(tok);
            }
            tokens.push("Enter");
          }
          if (youTurns === 0) {
            errors.push(
              `${stPath}: chat needs at least one "you" turn to type`,
            );
            continue;
          }
        } else if (step.viewport === "SHORTCUT_DOJO") {
          // Dojo steps carry a document + task script instead of text.
          if (step.text !== undefined) {
            errors.push(`${stPath}: SHORTCUT_DOJO steps use "dojo", not "text"`);
          }
          const dojo = step.dojo;
          if (
            !dojo ||
            typeof dojo.doc !== "string" ||
            !dojo.doc.trim() ||
            !Array.isArray(dojo.tasks) ||
            dojo.tasks.length === 0
          ) {
            errors.push(
              `${stPath}: SHORTCUT_DOJO needs "dojo" with a non-empty "doc" and "tasks"`,
            );
            continue;
          }
          tokens = [];
          let broken = false;
          for (const [ti, task] of dojo.tasks.entries()) {
            const tPath = `${stPath}.dojo.tasks[${ti}]`;
            if (!task || !DOJO_ACTIONS.has(task.do)) {
              errors.push(
                `${tPath}: "do" must be one of ${[...DOJO_ACTIONS].join(", ")}`,
              );
              broken = true;
              continue;
            }
            checkLocalized(task.say, `${tPath}.say`);
            tokens.push(task.do);
          }
          // Coverage of the doc's characters (they are read, not typed) is
          // not enforced — but the task script must actually be playable.
          if (!broken) {
            const result = simulateDojo(
              dojo.doc,
              dojo.tasks.map((t) => t.do),
            );
            if (result) {
              errors.push(
                `${stPath}.dojo.tasks[${result.failedAt}]: "${dojo.tasks[result.failedAt].do}" is impossible here — ${result.error}`,
              );
            }
          }
        } else {
          if (step.chat !== undefined) {
            errors.push(`${stPath}: "chat" only works in CHAT_SIM steps`);
          }
          if (step.dojo !== undefined) {
            errors.push(`${stPath}: "dojo" only works in SHORTCUT_DOJO steps`);
          }
          tokens = tokensOf(step.text);
          if (!tokens || tokens.length === 0) {
            errors.push(`${stPath}: "text" is empty or missing`);
            continue;
          }
        }
        for (const token of tokens) {
          const isSpecial = SPECIAL_KEYS.has(token);
          const chord = isSpecial ? null : parseChord(token);

          // A token that starts with a modifier name but doesn't parse is a
          // chord typo ("Ctrl+", "Ctrl+Esc") — plain math like "1+1" is fine.
          if (!isSpecial && !chord && token.includes("+")) {
            if (CHORD_MODIFIERS.has(token.split("+")[0])) {
              errors.push(
                `${stPath}: "${token}" looks like a chord but is malformed (write it like "Ctrl+C")`,
              );
              continue;
            }
          }

          // Where each token kind is allowed
          if (step.viewport === "GAME_NINJA_RUN" && (isSpecial || chord)) {
            errors.push(
              `${stPath}: "${token}" — game steps use plain words only`,
            );
          } else if (
            step.viewport === "STANDARD_GYM" &&
            isSpecial &&
            !GYM_INLINE_SPECIALS.has(token)
          ) {
            errors.push(
              `${stPath}: bare "${token}" cannot sit inside gym text — only ${[...GYM_INLINE_SPECIALS].join("/")} can (teach the others in KEY_INTRO steps)`,
            );
          } else if (
            step.viewport === "POSTURE_CHECK" &&
            (isSpecial || chord)
          ) {
            errors.push(
              `${stPath}: "${token}" — posture steps hold plain character keys only`,
            );
          }

          // Key coverage (Law 1): special keys and chords count as whole keys
          if (declaredKeys) {
            if (isSpecial || chord) {
              if (!declaredKeys.has(token.toLowerCase())) {
                errors.push(
                  `${stPath}: "${token}" is not in the lesson's keys [${[...declaredKeys].join(", ")}]`,
                );
              }
            } else {
              for (const ch of token.toLowerCase()) {
                if (!declaredKeys.has(ch)) {
                  errors.push(
                    `${stPath}: character "${ch}" in "${token}" is not in the lesson's keys [${[...declaredKeys].join(", ")}]`,
                  );
                }
              }
            }
          }
        }

        // prefill — fix-the-typo drills: pre-typed wrong text the learner repairs
        if (step.prefill !== undefined) {
          const pre = tokensOf(step.prefill);
          if (!pre || pre.length === 0) {
            errors.push(`${stPath}: "prefill" is empty — omit it instead`);
          } else if (step.viewport !== "STANDARD_GYM") {
            errors.push(`${stPath}: prefill only works in STANDARD_GYM steps`);
          } else if (!BACKSPACE_MODES.has(step.mode ?? "careful")) {
            errors.push(
              `${stPath}: prefill needs a backspace-enabled mode ("careful" or "strict")`,
            );
          } else if (pre.length > tokens.length) {
            errors.push(
              `${stPath}: prefill has ${pre.length} tokens but the text only has ${tokens.length}`,
            );
          } else {
            let differs = false;
            let broken = false;
            for (const [pi, p] of pre.entries()) {
              const t = tokens[pi];
              if (SPECIAL_KEYS.has(p) || parseChord(p) || SPECIAL_KEYS.has(t) || parseChord(t)) {
                errors.push(
                  `${stPath}: prefill covers plain text tokens only ("${p}" over "${t}")`,
                );
                broken = true;
              } else if (p.length !== t.length) {
                errors.push(
                  `${stPath}: prefill token "${p}" must match the length of "${t}"`,
                );
                broken = true;
              } else if (p !== t) {
                differs = true;
              }
            }
            if (!differs && !broken) {
              warnings.push(
                `${stPath}: prefill is identical to the text — nothing to fix`,
              );
            }
          }
        }
        if (step.targetWPM !== undefined && (typeof step.targetWPM !== "number" || step.targetWPM < 0)) {
          errors.push(`${stPath}: targetWPM must be a non-negative number`);
        }
        if (step.maxMistakes !== undefined && (typeof step.maxMistakes !== "number" || step.maxMistakes < 0)) {
          errors.push(`${stPath}: maxMistakes must be a non-negative number`);
        }
        if (step.gameSpeed !== undefined) {
          if (typeof step.gameSpeed !== "number" || step.gameSpeed <= 0) {
            errors.push(`${stPath}: gameSpeed must be a positive number`);
          } else if (step.viewport !== "GAME_NINJA_RUN") {
            warnings.push(`${stPath}: gameSpeed has no effect outside GAME_NINJA_RUN steps`);
          } else if (step.gameSpeed < 0.3 || step.gameSpeed > 3) {
            warnings.push(`${stPath}: gameSpeed ${step.gameSpeed} is outside the sane 0.3–3 range`);
          }
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
