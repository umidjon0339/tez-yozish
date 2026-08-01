"use client";

// The home test's settings, held in the module-level useSyncExternalStore
// idiom the rest of the app uses (lib/locale.tsx, handStyle.ts). It exists as a
// store rather than page state for one reason: the saved value can only be read
// on the client, and a store gives the server render a stable default instead
// of a hydration mismatch.

import { useSyncExternalStore } from "react";
import { DEFAULT_CONFIG, loadConfig, saveConfig, type TestConfig } from "@/lib/typingTest";

let cache: TestConfig | null = null;
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot(): TestConfig {
  cache ??= loadConfig();
  return cache;
}

// The server has no localStorage, so it always renders the defaults.
const getServerSnapshot = (): TestConfig => DEFAULT_CONFIG;

export function setTestConfig(next: TestConfig) {
  cache = next;
  saveConfig(next);
  listeners.forEach((l) => l());
}

export function useTestConfig(): TestConfig {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
