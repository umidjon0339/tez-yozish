'use client';

import React, { useEffect, useRef, memo } from 'react';
import { KEY_ID_MAP, requiresShift, shiftIdFor } from './keymap';

interface NewKeyboardProps {
  expectedKey: string | string[] | null;
  activeKeys?: string[];
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  lastPress?: { key: string; isCorrect: boolean; id: number } | null;
}

export const NewKeyboard = memo(function NewKeyboard({ expectedKey, activeKeys, offsetX = 0, offsetY = 0, scale = 1, lastPress }: NewKeyboardProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate viewBox dimensions based on scale
  const baseW = 683.3;
  const baseH = 254;
  const w = baseW / scale;
  const h = baseH / scale;
  
  // Keep the scaling centered
  const x = 0 - offsetX + (baseW - w) / 2;
  const y = 0 - offsetY + (baseH - h) / 2;

  useEffect(() => {
    if (!svgRef.current) return;
    const dom = svgRef.current;

    // Reset active and pressed classes
    const activeElements = dom.querySelectorAll('.active');
    activeElements.forEach(el => el.classList.remove('active'));
    
    const pressedElements = dom.querySelectorAll('.pressed');
    pressedElements.forEach(el => el.classList.remove('pressed'));

    if (expectedKey) {
      const keys = Array.isArray(expectedKey) ? expectedKey : [expectedKey];
      keys.forEach(key => {
        const targetId = KEY_ID_MAP[key.toLowerCase()] || key.toLowerCase();
        
        if (targetId) {
          const targetPath = dom.querySelector(`path#${targetId}`);
          if (targetPath) {
            targetPath.classList.add('active');
          }

          if (requiresShift(key)) {
            const shiftId = shiftIdFor(targetId);
            dom.querySelector(`path#${shiftId}`)?.classList.add('active');
            dom.querySelector(`text#text-${shiftId}`)?.classList.add('active');
          }

          // Highlight text elements
          const targetTextId = `text-${targetId}`;
          const textById = dom.querySelector(`text#${targetTextId}`);
          if (textById) {
            textById.classList.add('active');
          } else {
            // Find text by content for letters and symbols, ignoring hidden alternate labels
            const allTexts = Array.from(dom.querySelectorAll('text.edc-st2'));
            const matchingTexts = allTexts.filter(t => t.textContent?.trim().toLowerCase() === key.toLowerCase());
            matchingTexts.forEach(t => t.classList.add('active'));
          }
        }
      });
    }

    if (activeKeys) {
      activeKeys.forEach(key => {
        const targetId = KEY_ID_MAP[key.toLowerCase()] || key.toLowerCase();
        if (targetId) {
          const targetPath = dom.querySelector(`path#${targetId}`);
          if (targetPath) {
            targetPath.classList.add('pressed');
          }
        }
      });
    }
  }, [expectedKey, activeKeys]);

  useEffect(() => {
    if (!svgRef.current || !lastPress) return;
    const dom = svgRef.current;

    const targetId = KEY_ID_MAP[lastPress.key.toLowerCase()] || lastPress.key.toLowerCase();
    const targetPath = dom.querySelector(`path#${targetId}`);

    if (targetPath) {
      const cls = lastPress.isCorrect ? 'correct' : 'incorrect';
      targetPath.classList.add(cls);

      const timeoutId = setTimeout(() => {
        targetPath.classList.remove(cls);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        targetPath.classList.remove(cls);
      };
    }
  }, [lastPress]);

  return (
    <svg
      ref={svgRef}
      viewBox={`${x} ${y} ${w} ${h}`}
      aria-hidden="true"
      className="w-full h-full select-none pointer-events-none theme-bees overflow-visible keyboard-svg"
    >
      <style type="text/css" dangerouslySetInnerHTML={{ __html: `
        /* Keys carry their zone color at opacity 0 (not fill:none) so the
           active/colorful tints can FADE in and out — none→color can't
           interpolate, opacity can. */
        .keyboard-svg .edc-st0 {fill: var(--fz, #777777);fill-opacity: 0;stroke: #777777;stroke-width: 0.5;stroke-miterlimit: 10;}

        /* MacBook-style case: the rounded slab the keys sit in. Sits outside
           #keys so colorful-mode tints and highlights never touch it. */
        .keyboard-svg .kb-case {
          fill: #f4f4f3;
          stroke: #e2e2e0;
          stroke-width: 1;
        }
        .dark .keyboard-svg .kb-case {
          fill: #171717;
          stroke: #2e2e2e;
        }

        /* Smooth everything: the target highlight glides from key to key and
           the colorful tints fade on toggle… */
        .keyboard-svg path { transition: fill .18s ease, fill-opacity .18s ease, stroke .18s ease; }
        .keyboard-svg text { transition: fill .18s ease; }
        /* …but keystroke feedback stays instant — latency reads as lag. */
        .keyboard-svg path.pressed,
        .keyboard-svg path.correct,
        .keyboard-svg path.incorrect { transition: none; }
        /* Apple keycap typography: San Francisco (SF Pro) on Apple devices,
           falling back to the page's Inter (visually closest) elsewhere.
           Sizes follow real MacBook keycap proportions — legend cap-height is
           ~25% of the 42.5-unit key width: 16px letters, 14px stacked
           symbol pairs, 9px lowercase modifier words, 11px ⌘/⌥/⌃ symbols. */
        .keyboard-svg .edc-st1 {
          opacity: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', var(--font-inter, 'Inter'), 'Helvetica Neue', 'Segoe UI', 'Arial', sans-serif;
          font-size: 14px;
        }
        .keyboard-svg .edc-st2 {
          opacity: 1;
          fill: #171717;
        }
        .dark .keyboard-svg .edc-st2 {
          fill: #e5e5e5;
        }

        .keyboard-svg .b {font-size: 16px;}
        .keyboard-svg .b2 {font-size: 14px;}
        .keyboard-svg .s, .keyboard-svg .se, .keyboard-svg .sc {font-size: 9px;}
        .keyboard-svg .m {font-size: 11px;}

        /* Target key: the finger's own color (--fz from globals.css), steady —
           no glow, no pulse. On the plain keyboard the fill is a soft tint so
           the colored guide finger crossing the key doesn't stack into a
           doubled border; on the colorful (tinted) keyboard the target must
           outshine the 22% key tints, so it goes solid. */
        /* Breathing shadow that draws the eye to the key to press. The shadow
           color rides on currentColor (set from --fz in a normal declaration)
           because var() inside these @keyframes resolved against the wrong
           key. Only the shadow animates — the key's color stays constant. */
        .keyboard-svg path.active {
          fill: var(--fz, #3b82f6) !important;
          fill-opacity: 0.45 !important;
          stroke: var(--fz, #3b82f6);
          stroke-width: 1.5px;
          color: var(--fz, #3b82f6);
          animation: kb-target-pulse 1.1s ease-in-out infinite;
        }
        .colorful-mode .keyboard-svg path.active {
          fill-opacity: 1 !important;
        }
        @keyframes kb-target-pulse {
          0%, 100% { filter: drop-shadow(0 0 1px currentColor); }
          50% { filter: drop-shadow(0 0 6px currentColor); }
        }
        @media (prefers-reduced-motion: reduce) {
          .keyboard-svg path.active {
            animation: none;
            filter: drop-shadow(0 0 4px currentColor);
          }
        }
        .keyboard-svg path.pressed { stroke: #22c55e !important; stroke-width: 3px !important; fill: #dcfce7 !important; fill-opacity: 1 !important; }
        .dark .keyboard-svg path.pressed { fill: #166534 !important; }
        .keyboard-svg path.deadkey {fill: orange;}
        .keyboard-svg path.correct {stroke: #22c55e !important; stroke-width: 4px !important;}
        .keyboard-svg path.incorrect {stroke: #ef4444 !important; stroke-width: 4px !important; fill: #fecaca !important; fill-opacity: 1 !important;}
        .dark .keyboard-svg path.incorrect { fill: #c76767ff !important; }
        .keyboard-svg path.clickable:hover {cursor: pointer;stroke-width: 2px;}

        .keyboard-svg text {user-select: none;opacity: 0;}
        /* Legends anchor on the key's center x so they stay centered no matter
           which font the OS substitutes for Arial; the small modifier labels
           (tab/shift/…) keep their edge alignment. */
        .keyboard-svg #letters text { text-anchor: middle; }
        .keyboard-svg #letters text.s { text-anchor: start; }
        .keyboard-svg #letters text.se { text-anchor: end; }
        /* Legend of the target key. Plain keyboard (soft 45% tint): a dark/light
           letter like every other key reads best. Colorful keyboard (solid deep
           fills): white in light mode, near-black on the bright dark-mode hues;
           the faint halo keeps it readable on every hue. */
        .keyboard-svg text.active {
          fill: #171717;
          opacity: 1;
        }
        .dark .keyboard-svg text.active {
          fill: #e5e5e5;
        }
        .colorful-mode .keyboard-svg text.active {
          fill: #ffffff;
          stroke: rgba(23, 23, 23, 0.35);
          stroke-width: 0.6px;
          paint-order: stroke;
        }
        .dark .colorful-mode .keyboard-svg text.active {
          fill: #171717;
          stroke: rgba(255, 255, 255, 0.3);
        }
        .keyboard-svg text.incorrect {fill: white;}
      `}} />
      <g id="keys">
        <path id="tilda" className="edc-st0" d="M58.4,53.7c0,1.7-1.4,3-3,3H18.9c-1.6,0-3-1.3-3-3V18.3c0-1.7,1.3-3,3-3h36.5c1.6,0,3,1.3,3,3V53.7z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="key-1" className="edc-st0" d="M103.4,53.7c0,1.7-1.3,3-3,3H63.9c-1.7,0-3-1.3-3-3V18.3c0-1.6,1.3-3,3-3h36.5c1.7,0,3,1.4,3,3V53.7z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="q" className="edc-st0" d="M126.7,97.6c0,1.6-1.3,3-3,3H87.2c-1.7,0-3-1.4-3-3V62.3c0-1.6,1.3-3,3-3h36.5c1.7,0,3,1.4,3,3V97.6z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="a" className="edc-st0" d="M137.4,141.5c0,1.6-1.4,3-3,3H97.9c-1.7,0-3-1.4-3-3v-35.4c0-1.7,1.3-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="z" className="edc-st0" d="M160.8,185.4c0,1.7-1.4,3-3,3h-36.5c-1.7,0-3-1.3-3-3v-35.3c0-1.7,1.3-3,3-3h36.5c1.6,0,3,1.3,3,3V185.4z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="shift-left" className="edc-st0" d="M115.4,185.4c0,1.7-1.4,3-3,3H18.9c-1.6,0-3-1.3-3-3v-35.3c0-1.7,1.3-3,3-3h93.5c1.6,0,3,1.3,3,3V185.4z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="x" className="edc-st0" d="M205.8,185.4c0,1.7-1.4,3-3,3h-36.5c-1.7,0-3-1.3-3-3v-35.3c0-1.6,1.3-3,3-3h36.5c1.6,0,3,1.4,3,3V185.4z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="c" className="edc-st0" d="M250.8,185.4c0,1.7-1.4,3-3,3h-36.5c-1.7,0-3-1.3-3-3v-35.3c0-1.6,1.3-3,3-3h36.5c1.6,0,3,1.4,3,3V185.4z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="v" className="edc-st0" d="M295.8,185.4c0,1.7-1.4,3-3,3h-36.5c-1.7,0-3-1.3-3-3v-35.3c0-1.6,1.3-3,3-3h36.5c1.6,0,3,1.4,3,3V185.4z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="b" className="edc-st0" d="M340.8,185.4c0,1.7-1.4,3-3,3h-36.6c-1.6,0-3-1.3-3-3v-35.3c0-1.6,1.4-3,3-3h36.6c1.6,0,3,1.4,3,3V185.4z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="n" className="edc-st0" d="M385.8,185.4c0,1.7-1.4,3-3,3h-36.5c-1.6,0-3-1.3-3-3v-35.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V185.4z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="m" className="edc-st0" d="M430.8,185.4c0,1.7-1.4,3-3,3h-36.5c-1.6,0-3-1.3-3-3v-35.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V185.4z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="comma" className="edc-st0" d="M475.8,185.4c0,1.7-1.4,3-3,3h-36.5c-1.6,0-3-1.3-3-3v-35.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V185.4z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="dot" className="edc-st0" d="M520.8,185.4c0,1.7-1.3,3-3,3h-36.5c-1.6,0-3-1.3-3-3v-35.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V185.4z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="slash" className="edc-st0" d="M565.8,185.4c0,1.7-1.3,3-3,3h-36.5c-1.6,0-3-1.3-3-3v-35.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V185.4z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="s" className="edc-st0" d="M182.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="d" className="edc-st0" d="M227.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="f" className="edc-st0" d="M272.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="g" className="edc-st0" d="M317.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="h" className="edc-st0" d="M362.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="j" className="edc-st0" d="M407.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="k" className="edc-st0" d="M452.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="l" className="edc-st0" d="M497.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="semicolon" className="edc-st0" d="M542.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="quote" className="edc-st0" d="M587.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.7,0-3-1.4-3-3v-35.4c0-1.7,1.3-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="w" className="edc-st0" d="M171.7,97.6c0,1.6-1.3,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V97.6z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="e" className="edc-st0" d="M216.7,97.6c0,1.6-1.3,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.7,1.4-3,3-3h36.5c1.7,0,3,1.3,3,3V97.6z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="r" className="edc-st0" d="M261.7,97.6c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V97.6z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="t" className="edc-st0" d="M306.7,97.6c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V97.6z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="y" className="edc-st0" d="M351.7,97.6c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V97.6z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="u" className="edc-st0" d="M396.7,97.6c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V97.6z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="i" className="edc-st0" d="M441.7,97.6c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V97.6z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="o" className="edc-st0" d="M486.7,97.6c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V97.6z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="p" className="edc-st0" d="M531.7,97.6c0,1.6-1.3,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V97.6z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="open-bracket" className="edc-st0" d="M576.7,97.6c0,1.6-1.3,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V97.6z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="close-bracket" className="edc-st0" d="M621.7,97.6c0,1.6-1.3,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V97.6z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="backslash" className="edc-st0" d="M668.8,97.6c0,1.6-1.3,3-3,3h-38.6c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h38.6c1.7,0,3,1.4,3,3V97.6z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="enter" className="edc-st0" d="M668.8,141.5c0,1.6-1.3,3-3,3h-72.9c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h72.9c1.7,0,3,1.3,3,3V141.5z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="key-2" className="edc-st0" d="M148.4,53.7c0,1.7-1.4,3-3,3h-36.5c-1.6,0-3-1.3-3-3V18.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V53.7z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="key-3" className="edc-st0" d="M193.4,53.7c0,1.7-1.4,3-3,3h-36.5c-1.7,0-3-1.3-3-3V18.3c0-1.6,1.3-3,3-3h36.5c1.6,0,3,1.4,3,3V53.7z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="key-4" className="edc-st0" d="M238.4,53.7c0,1.7-1.4,3-3,3H199c-1.7,0-3-1.3-3-3V18.3c0-1.7,1.3-3,3-3h36.5c1.6,0,3,1.3,3,3v35.4H238.4z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="key-5" className="edc-st0" d="M283.4,53.7c0,1.7-1.3,3-3,3h-36.5c-1.7,0-3-1.3-3-3V18.3c0-1.7,1.3-3,3-3h36.5c1.7,0,3,1.3,3,3V53.7z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="key-6" className="edc-st0" d="M328.4,53.7c0,1.7-1.3,3-3,3h-36.5c-1.6,0-3-1.3-3-3V18.3c0-1.7,1.4-3,3-3h36.5c1.7,0,3,1.3,3,3V53.7z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="key-7" className="edc-st0" d="M373.4,53.7c0,1.7-1.3,3-3,3h-36.5c-1.6,0-3-1.3-3-3V18.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V53.7z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="key-8" className="edc-st0" d="M418.4,53.7c0,1.7-1.3,3-3,3h-36.5c-1.6,0-3-1.3-3-3V18.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V53.7z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="key-9" className="edc-st0" d="M463.4,53.7c0,1.7-1.3,3-3,3h-36.5c-1.6,0-3-1.3-3-3V18.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V53.7z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="key-0" className="edc-st0" d="M508.4,53.7c0,1.7-1.3,3-3,3h-36.5c-1.6,0-3-1.3-3-3V18.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V53.7z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="minus" className="edc-st0" d="M553.4,53.7c0,1.7-1.4,3-3,3h-36.5c-1.7,0-3-1.3-3-3V18.3c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V53.7z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="equal" className="edc-st0" d="M598.4,53.7c0,1.7-1.4,3-3,3h-36.5c-1.7,0-3-1.3-3-3V18.3c0-1.6,1.3-3,3-3h36.5c1.6,0,3,1.4,3,3V53.7z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="backspace" className="edc-st0" d="M668.8,53.7c0,1.7-1.3,3-3,3h-61.9c-1.7,0-3-1.3-3-3V18.3c0-1.6,1.3-3,3-3h61.9c1.7,0,3,1.4,3,3V53.7z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="tab" className="edc-st0" d="M81.7,97.6c0,1.6-1.3,3-3,3H18.9c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.3-3,3-3h59.8c1.7,0,3,1.4,3,3V97.6z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="capslock" className="edc-st0" d="M92.4,141.5c0,1.6-1.3,3-3,3H18.9c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.3-3,3-3h70.4c1.7,0,3,1.3,3,3L92.4,141.5L92.4,141.5z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="control" className="edc-st0 hide-on-bone" d="M58.4,236c0,1.7-1.4,3-3,3H18.9c-1.7,0-3-1.3-3-3v-42c0-1.7,1.3-3,3-3h36.5c1.6,0,3,1.3,3,3V236z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="fn" className="edc-st0 hide-on-bone" d="M103.4,236c0,1.7-1.4,3-3,3H63.9c-1.7,0-3-1.3-3-3v-42c0-1.7,1.3-3,3-3h36.5c1.6,0,3,1.3,3,3V236z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="win" className="edc-st0 hide-on-bone" d="M148.4,236c0,1.7-1.4,3-3,3h-36.5c-1.7,0-3-1.3-3-3v-42c0-1.7,1.3-3,3-3h36.5c1.6,0,3,1.3,3,3V236z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="alt-left" className="edc-st0 hide-on-bone" d="M203.4,236c0,1.7-1.4,3-3,3h-46.5c-1.7,0-3-1.3-3-3v-42c0-1.7,1.3-3,3-3h46.5c1.6,0,3,1.3,3,3V236z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="alt-right" className="edc-st0 hide-on-bone" d="M489.8,236c0,1.7-1.4,3-3,3h-46.5c-1.7,0-3-1.3-3-3v-42c0-1.7,1.3-3,3-3h46.5c1.6,0,3,1.3,3,3V236z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="control-right" className="edc-st0 hide-on-bone" d="M534.8,236c0,1.7-1.4,3-3,3h-36.5c-1.7,0-3-1.3-3-3v-42c0-1.7,1.3-3,3-3h36.5c1.6,0,3,1.3,3,3V236z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        {/* ◀ and ▶ run the full 42-unit height of the bottom row (same shape as
            control-right), the way a real MacBook cluster does — only ▲/▼ are
            half-height. Anything shorter leaves dead case above them. */}
        <path id="arrow-left" className="edc-st0 hide-on-bone" d="M579.5,236c0,1.7-1.4,3-3,3h-36.2c-1.7,0-3-1.3-3-3v-42c0-1.7,1.3-3,3-3h36.2c1.6,0,3,1.3,3,3V236z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="arrow-up" className="edc-st0 hide-on-bone" d="M624.2,210.8c0,1.6-1.3,3-3,3H585c-1.6,0-3-1.4-3-3V194c0-1.6,1.4-3,3-3h36.2c1.7,0,3,1.4,3,3V210.8z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="arrow-down" className="edc-st0 hide-on-bone" d="M624.2,236c0,1.6-1.3,3-3,3H585c-1.6,0-3-1.4-3-3v-16.8c0-1.6,1.4-3,3-3h36.2c1.7,0,3,1.4,3,3V236z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="arrow-right" className="edc-st0 hide-on-bone" d="M668.8,236c0,1.7-1.4,3-3,3h-36.1c-1.7,0-3-1.3-3-3v-42c0-1.7,1.3-3,3-3h36.1c1.6,0,3,1.3,3,3V236z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="space" className="edc-st0" d="M431.8,191c1.6,0,3,1.4,3,3v42c0,1.7-1.4,3-3,3H208.9c-1.6,0-3-1.3-3-3v-42c0-1.6,1.4-3,3-3H431.8z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
        <path id="shift-right" className="edc-st0" d="M668.8,185.4c0,1.7-1.3,3-3,3h-94.5c-1.6,0-3-1.3-3-3v-35.3c0-1.6,1.4-3,3-3h94.5c1.7,0,3,1.4,3,3V185.4z" stroke="#777777" fill="none" strokeWidth="0.5px"></path>
      </g>
      <g id="letters">
        <text transform="matrix(1 0 0 1 37.15 31.804)" className="edc-st1 edc-st2">~</text>
        <text transform="matrix(1 0 0 1 37.15 50.804)" className="edc-st1 edc-st2">`</text>
        <text transform="matrix(1 0 0 1 82.15 50.407)" className="edc-st1 edc-st2" dx="0" dy="0">1</text>
        <text transform="matrix(1 0 0 1 127.15 51.1765)" className="edc-st1 edc-st2" dx="0" dy="0">2</text>
        <text transform="matrix(1 0 0 1 172.15 51.4041)" className="edc-st1 edc-st2" dx="0" dy="0">3</text>
        <text transform="matrix(1 0 0 1 217.15 51.4041)" className="edc-st1 edc-st2" dx="0" dy="0">4</text>
        <text transform="matrix(1 0 0 1 262.15 51.4041)" className="edc-st1 edc-st2" dx="0" dy="0">5</text>
        <text transform="matrix(1 0 0 1 307.15 51.0891)" className="edc-st1 edc-st2" dx="0" dy="0">6</text>
        <text transform="matrix(1 0 0 1 352.15 51.0891)" className="edc-st1 edc-st2" dx="0" dy="0">7</text>
        <text transform="matrix(1 0 0 1 397.15 51.2158)" className="edc-st1 edc-st2" dx="0" dy="0">8</text>
        <text transform="matrix(1 0 0 1 442.15 51.2158)" className="edc-st1 edc-st2" dx="0" dy="0">9</text>
        <text transform="matrix(1 0 0 1 487.15 51.2158)" className="edc-st1 edc-st2" dx="0" dy="0">0</text>
        <text transform="matrix(1 0 0 1 532.15 50.407)" className="edc-st1 edc-st2" dx="0" dy="0">-</text>
        <text transform="matrix(1 0 0 1 577.15 51.2158)" className="edc-st1 edc-st2" dx="0" dy="0">=</text>
        <text transform="matrix(1 0 0 1 82.15 31.7605)" className="edc-st1 edc-st2" dx="0" dy="0">!</text>
        <text transform="matrix(1 0 0 1 127.15 30.45)" className="edc-st1 edc-st2" dx="0" dy="0">@</text>
        <text transform="matrix(1 0 0 1 172.15 31.76)" className="edc-st1 edc-st2" dx="0" dy="0">#</text>
        <text transform="matrix(1 0 0 1 217.15 31.217)" className="edc-st1 edc-st2" dx="0" dy="0">$</text>
        <text transform="matrix(1 0 0 1 262.15 30.8318)" className="edc-st1 edc-st2" dx="0" dy="0">%</text>
        <text transform="matrix(1 0 0 1 307.15 32.4426)" className="edc-st1 edc-st2" dx="0" dy="0">^</text>
        <text transform="matrix(1 0 0 1 352.15 31.76)" className="edc-st1 edc-st2" dx="0" dy="0">&amp;</text>
        <text transform="matrix(1 0 0 1 397.15 32.8235)" className="edc-st1 edc-st2" dx="0" dy="0">*</text>
        <text transform="matrix(1 0 0 1 442.15 30.6436)" className="edc-st1 edc-st2" dx="0" dy="0">(</text>
        <text transform="matrix(1 0 0 1 487.15 30.6436)" className="edc-st1 edc-st2" dx="0" dy="0">)</text>
        <text transform="matrix(1 0 0 1 532.15 25.5422)" className="edc-st1 edc-st2" dx="0" dy="0">_</text>
        <text transform="matrix(1 0 0 1 577.15 32.4421)" className="edc-st1 edc-st2" dx="0" dy="0">+</text>
        <text transform="matrix(1 0 0 1 105.45 75.4744)" className="edc-st1" dx="0" dy="0">Q</text>
        <text transform="matrix(1 0 0 1 105.45 93.4744)" className="edc-st1 edc-st2 b" dx="0" dy="-7.8">Q</text>
        <text transform="matrix(1 0 0 1 150.45 75.4744)" className="edc-st1" dx="0" dy="0">W</text>
        <text transform="matrix(1 0 0 1 150.45 93.4744)" className="edc-st1 edc-st2 b" dx="0" dy="-7.8">W</text>
        <text transform="matrix(1 0 0 1 195.45 75.4744)" className="edc-st1" dx="0" dy="0">E</text>
        <text transform="matrix(1 0 0 1 195.45 93.4744)" className="edc-st1 edc-st2 b" dx="0" dy="-7.8">E</text>
        <text transform="matrix(1 0 0 1 240.45 75.4744)" className="edc-st1" dx="0" dy="0">R</text>
        <text transform="matrix(1 0 0 1 240.45 93.4744)" className="edc-st1 edc-st2 b" dx="0" dy="-7.8">R</text>
        <text transform="matrix(1 0 0 1 285.45 75.4744)" className="edc-st1" dx="0" dy="0">T</text>
        <text transform="matrix(1 0 0 1 285.45 93.4744)" className="edc-st1 edc-st2 b" dx="0" dy="-7.8">T</text>
        <text transform="matrix(1 0 0 1 330.45 75.4744)" className="edc-st1" dx="0" dy="0">Y</text>
        <text transform="matrix(1 0 0 1 330.45 93.4744)" className="edc-st1 edc-st2 b" dx="0" dy="-7.8">Y</text>
        <text transform="matrix(1 0 0 1 375.45 75.4744)" className="edc-st1" dx="0" dy="0">U</text>
        <text transform="matrix(1 0 0 1 375.45 93.4744)" className="edc-st1 edc-st2 b" dx="0" dy="-7.8">U</text>
        <text transform="matrix(1 0 0 1 420.45 75.4744)" className="edc-st1" dx="0" dy="0">I</text>
        <text transform="matrix(1 0 0 1 420.45 93.4744)" className="edc-st1 edc-st2 b" dx="0" dy="-7.8">I</text>
        <text transform="matrix(1 0 0 1 465.45 75.4744)" className="edc-st1" dx="0" dy="0">O</text>
        <text transform="matrix(1 0 0 1 465.45 93.4744)" className="edc-st1 edc-st2 b" dx="0" dy="-7.8">O</text>
        <text transform="matrix(1 0 0 1 510.45 75.4744)" className="edc-st1" dx="0" dy="0">P</text>
        <text transform="matrix(1 0 0 1 510.45 93.4744)" className="edc-st1 edc-st2 b" dx="0" dy="-7.8">P</text>
        <text transform="matrix(1 0 0 1 116.15 120.3303)" className="edc-st1" dx="0" dy="0">A</text>
        <text transform="matrix(1 0 0 1 116.15 138.3303)" className="edc-st1 edc-st2 b" dx="0" dy="-8.8">A</text>
        <text transform="matrix(1 0 0 1 161.15 120.3303)" className="edc-st1" dx="0" dy="0">S</text>
        <text transform="matrix(1 0 0 1 161.15 138.3303)" className="edc-st1 edc-st2 b" dx="0" dy="-8.8">S</text>
        <text transform="matrix(1 0 0 1 206.15 120.3303)" className="edc-st1" dx="0" dy="0">D</text>
        <text transform="matrix(1 0 0 1 206.15 138.3303)" className="edc-st1 edc-st2 b" dx="0" dy="-8.8">D</text>
        <text transform="matrix(1 0 0 1 251.15 120.3303)" className="edc-st1" dx="0" dy="0">F</text>
        <text transform="matrix(1 0 0 1 251.15 138.3303)" className="edc-st1 edc-st2 b" dx="0" dy="-8.8">F</text>
        <text transform="matrix(1 0 0 1 296.15 120.3303)" className="edc-st1" dx="0" dy="0">G</text>
        <text transform="matrix(1 0 0 1 296.15 138.3303)" className="edc-st1 edc-st2 b" dx="0" dy="-8.8">G</text>
        <text transform="matrix(1 0 0 1 341.15 120.3303)" className="edc-st1" dx="0" dy="0">H</text>
        <text transform="matrix(1 0 0 1 341.15 138.3303)" className="edc-st1 edc-st2 b" dx="0" dy="-8.8">H</text>
        <text transform="matrix(1 0 0 1 386.15 120.3303)" className="edc-st1" dx="0" dy="0">J</text>
        <text transform="matrix(1 0 0 1 386.15 138.3303)" className="edc-st1 edc-st2 b" dx="0" dy="-8.8">J</text>
        <text transform="matrix(1 0 0 1 431.15 120.3303)" className="edc-st1" dx="0" dy="0">K</text>
        <text transform="matrix(1 0 0 1 431.15 138.3303)" className="edc-st1 edc-st2 b" dx="0" dy="-8.8">K</text>
        <text transform="matrix(1 0 0 1 476.15 120.3303)" className="edc-st1" dx="0" dy="0">L</text>
        <text transform="matrix(1 0 0 1 476.15 138.3303)" className="edc-st1 edc-st2 b" dx="0" dy="-8.8">L</text>
        <text transform="matrix(1 0 0 1 139.55 163.7458)" className="edc-st1" dx="0" dy="0">Z</text>
        <text transform="matrix(1 0 0 1 139.55 181.7458)" className="edc-st1 edc-st2 b" dx="0" dy="-6.7">Z</text>
        <text transform="matrix(1 0 0 1 184.55 163.7458)" className="edc-st1" dx="0" dy="0">X</text>
        <text transform="matrix(1 0 0 1 184.55 181.7458)" className="edc-st1 edc-st2 b" dx="0" dy="-6.7">X</text>
        <text transform="matrix(1 0 0 1 229.55 163.7458)" className="edc-st1" dx="0" dy="0">C</text>
        <text transform="matrix(1 0 0 1 229.55 181.7458)" className="edc-st1 edc-st2 b" dx="0" dy="-6.7">C</text>
        <text transform="matrix(1 0 0 1 274.55 163.7458)" className="edc-st1" dx="0" dy="0">V</text>
        <text transform="matrix(1 0 0 1 274.55 181.7458)" className="edc-st1 edc-st2 b" dx="0" dy="-6.7">V</text>
        <text transform="matrix(1 0 0 1 319.55 163.7458)" className="edc-st1" dx="0" dy="0">B</text>
        <text transform="matrix(1 0 0 1 319.55 181.7458)" className="edc-st1 edc-st2 b" dx="0" dy="-6.7">B</text>
        <text transform="matrix(1 0 0 1 364.55 163.7458)" className="edc-st1" dx="0" dy="0">N</text>
        <text transform="matrix(1 0 0 1 364.55 181.7458)" className="edc-st1 edc-st2 b" dx="0" dy="-6.7">N</text>
        <text transform="matrix(1 0 0 1 409.55 163.7458)" className="edc-st1" dx="0" dy="0">M</text>
        <text transform="matrix(1 0 0 1 409.55 181.7458)" className="edc-st1 edc-st2 b" dx="0" dy="-6.7">M</text>
        <text transform="matrix(1 0 0 1 521.15 136.7126)" className="edc-st1 edc-st2" dx="0" dy="0">;</text>
        <text transform="matrix(1 0 0 1 521.15 119.3762)" className="edc-st1 edc-st2" dx="0" dy="0">:</text>
        <text transform="matrix(1 0 0 1 454.55 180.041)" className="edc-st1 edc-st2 b2" dx="0" dy="0">,</text>
        <text transform="matrix(1 0 0 1 454.55 164.3396)" className="edc-st1 edc-st2" dx="0" dy="0">&lt;</text>
        <text transform="matrix(1 0 0 1 499.55 181.041)" className="edc-st1 edc-st2 b2" dx="0" dy="0">.</text>
        <text transform="matrix(1 0 0 1 499.55 164.3396)" className="edc-st1 edc-st2" dx="0" dy="0">&gt;</text>
        <text transform="matrix(1 0 0 1 544.55 181.0408)" className="edc-st1 edc-st2" dx="0" dy="0">/</text>
        <text transform="matrix(1 0 0 1 544.55 163.2498)" className="edc-st1 edc-st2" dx="0" dy="0">?</text>
        <text transform="matrix(1 0 0 1 566.15 138.7126)" className="edc-st1 edc-st2" dx="0" dy="0">&apos;</text>
        <text transform="matrix(1 0 0 1 566.15 120.3762)" className="edc-st1 edc-st2" dx="0" dy="0">&quot;</text>
        <text transform="matrix(1 0 0 1 555.45 94.426)" className="edc-st1 edc-st2" dx="0" dy="0">[</text>
        <text transform="matrix(1 0 0 1 555.45 74.877)" className="edc-st1 edc-st2" dx="0" dy="0">&#123;</text>
        <text transform="matrix(1 0 0 1 600.45 94.426)" className="edc-st1 edc-st2" dx="0" dy="0">]</text>
        <text transform="matrix(1 0 0 1 600.45 74.7849)" className="edc-st1 edc-st2" dx="0" dy="0">&#125;</text>
        <text transform="matrix(1 0 0 1 646.5 94.426)" className="edc-st1 edc-st2" dx="0" dy="0">&#92;</text>
        <text transform="matrix(1 0 0 1 646.5 74.877)" className="edc-st1 edc-st2" dx="0" dy="0">|</text>
        <text id="text-tab" transform="matrix(1 0 0 1 23.3467 93.2341)" className="edc-st1 s edc-st2">tab</text>
        <text id="text-caps-lock" transform="matrix(1 0 0 1 23.3467 137.7126)" className="edc-st1 s edc-st2">caps lock</text>
        <circle className="edc-st2" cx="23.1" cy="111.9" r="2.1"></circle>
        <text id="text-shift-left" transform="matrix(1 0 0 1 23.3467 181.0408)" className="edc-st1 s edc-st2">shift</text>
        <text id="text-shift-right" transform="matrix(1 0 0 1 661.4 181.0408)" className="edc-st1 se edc-st2">shift</text>
        <text id="text-backspace" transform="matrix(1 0 0 1 661.4 51.1765)" className="edc-st1 se edc-st2">backspace</text>
        <text id="text-enter" transform="matrix(1 0 0 1 661.4 137.7126)" className="edc-st1 se edc-st2">enter</text>
        <text id="text-control" transform="matrix(1 0 0 1 37.15 218.3)" className="edc-st1 sc edc-st2">Ctrl</text>
        <text id="text-fn" transform="matrix(1 0 0 1 82.15 218.3)" className="edc-st1 sc edc-st2">Fn</text>
        <path id="text-win" className="edc-st2" d="M121.9,209.7h4.5v4.5h-4.5z M128,209.7h4.5v4.5h-4.5z M121.9,215.8h4.5v4.5h-4.5z M128,215.8h4.5v4.5h-4.5z"></path>
        <text id="text-alt-left" transform="matrix(1 0 0 1 177.15 218.3)" className="edc-st1 sc edc-st2">Alt</text>
        <text id="text-alt-right" transform="matrix(1 0 0 1 463.55 218.3)" className="edc-st1 sc edc-st2">Alt</text>
        <text id="text-control-right" transform="matrix(1 0 0 1 513.55 218.3)" className="edc-st1 sc edc-st2">Ctrl</text>
        {/* ◀ / ▶ re-centred on the full-height caps (was y 224.9, the old
            half-height centre); ▲ / ▼ keep theirs. */}
        <path className="edc-st2" d="M561.2,212.3l-5.6,2.7l5.6,2.7z"></path>
        <path className="edc-st2" d="M600.4,205.1l2.7-5.6l2.7,5.6z"></path>
        <path className="edc-st2" d="M600.4,224.9h5.4l-2.7,5.6z"></path>
        <path className="edc-st2" d="M645.6,212.3l5.6,2.7l-5.6,2.7z"></path>
      </g>
    </svg>
  );
});
