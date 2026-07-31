"use client";

// The keycap layer + the hands layer, stacked and aligned — the one place that
// knows how the two different viewBox baselines line up (see docs/keyboard.md).
// Used by the lesson runtime and the home page hero; retune the two configs
// below together.

import React from "react";
import dynamic from "next/dynamic";
import { NewKeyboard } from "@/components/keyboard/new_keyboard";
import { Keyboard as HandsKeyboard } from "@/components/keyboard/hands";
import { getHandStyle, useHandStyle, type HandArtVariant } from "@/components/keyboard/handStyle";
import {
  DEFAULT_HAND_OPACITY,
  handTintVars,
  useHandColors,
  useHandOpacities,
} from "@/components/keyboard/handColor";

export const KEYBOARD_CONFIG = { scale: 0.75, offsetX: 0, offsetY: 0 };
export const HANDS_CONFIG = { scale: 1.33, offsetX: 37, offsetY: 105 };

/* The reshaped female hand is another full copy of the pose sheet (~470 KB of
   path data), so it loads as its own chunk only once someone picks it. It
   shares the classic art's props, viewBox and pose ids, so HANDS_CONFIG
   covers every variant. */
type HandsProps = {
  expectedKey: string | string[] | null;
  className?: string;
  style?: React.CSSProperties;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
};

const HANDS_BY_VARIANT: Record<HandArtVariant, React.ComponentType<HandsProps>> = {
  classic: HandsKeyboard,
  female: dynamic(() => import("@/components/keyboard/handsFemale").then((m) => m.FemaleKeyboard), {
    ssr: false,
  }),
};

export interface LayoutConfig {
  keyboardScale: number;
  keyboardY: number;
  handsScale: number;
  handsY: number;
}

export interface KeyPressInfo {
  key: string;
  isCorrect: boolean;
  id: number;
}

export function KeyboardWithHands({
  expectedKey,
  activeKeys,
  isDark,
  isColorful,
  lastPress,
  isHandsVisible = true,
  config,
  className,
}: {
  expectedKey: string | string[] | null;
  activeKeys?: string[];
  isDark: boolean;
  isColorful: boolean;
  lastPress?: KeyPressInfo | null;
  isHandsVisible?: boolean;
  config?: LayoutConfig;
  /** extra classes for the stage wrapper (sizing only — keep `kb-stage`) */
  className?: string;
}) {
  const kbScale = config?.keyboardScale ?? KEYBOARD_CONFIG.scale;
  const kbY = config?.keyboardY ?? KEYBOARD_CONFIG.offsetY;
  const hnScale = config?.handsScale ?? HANDS_CONFIG.scale;
  const hnY = config?.handsY ?? HANDS_CONFIG.offsetY;

  const handStyle = getHandStyle(useHandStyle());
  const Hands = HANDS_BY_VARIANT[handStyle.variant];
  // The learner's color for this style, expanded into the --hand-* CSS
  // variables the hands svg reads. Memoized so the memo'd <Hands> keeps a
  // referentially stable style prop across keystrokes.
  const handColor = useHandColors()[handStyle.id] ?? null;
  const handTint = React.useMemo(
    () => handTintVars(handStyle.id, handColor),
    [handStyle.id, handColor],
  );
  const handOpacity = useHandOpacities()[handStyle.id] ?? DEFAULT_HAND_OPACITY;
  // A style with its own theme (the flesh look) defines light and dark itself,
  // so it keeps `theme-dark` only as a modifier rather than being replaced by it.
  const handsTheme = handStyle.theme
    ? `${handStyle.theme}${isDark ? " theme-dark" : ""}`
    : isDark
      ? "theme-dark"
      : "theme-bone";

  return (
    <div
      className={`kb-stage relative w-full aspect-[683.3/254] mx-auto ${
        className ?? "max-w-4xl mt-auto"
      } ${isColorful ? "colorful-mode" : ""}`}
    >
      <div className="absolute top-0 left-0 z-0 w-full h-full flex justify-center items-end">
        <NewKeyboard
          expectedKey={expectedKey}
          activeKeys={activeKeys}
          scale={kbScale}
          offsetX={KEYBOARD_CONFIG.offsetX}
          offsetY={kbY}
          lastPress={lastPress}
        />
      </div>
      {isHandsVisible && (
        <div
          className="absolute top-0 left-0 z-10 pointer-events-none w-full h-full overflow-visible flex justify-center items-end"
          style={{ opacity: handOpacity }}
        >
          <Hands
            expectedKey={expectedKey}
            className={`w-full h-full overflow-visible ${handsTheme}`}
            style={handTint}
            scale={hnScale}
            offsetX={HANDS_CONFIG.offsetX}
            offsetY={hnY}
          />
        </div>
      )}
    </div>
  );
}
