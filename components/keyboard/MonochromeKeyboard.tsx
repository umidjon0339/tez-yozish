'use client';

import React, { useEffect, useRef, memo } from 'react';

// Maps real keyboard event strings to SVG path IDs
const KEY_ID_MAP: Record<string, string> = {
  ' ': 'space',
  '1': 'key-1', '2': 'key-2', '3': 'key-3', '4': 'key-4', '5': 'key-5',
  '6': 'key-6', '7': 'key-7', '8': 'key-8', '9': 'key-9', '0': 'key-0',
  '~': 'tilda', '`': 'tilda',
  '-': 'minus', '_': 'minus',
  '=': 'equal', '+': 'equal',
  '[': 'open-bracket', '{': 'open-bracket',
  ']': 'close-bracket', '}': 'close-bracket',
  '\\': 'backslash', '|': 'backslash',
  ';': 'semicolon', ':': 'semicolon',
  '\'': 'quote', '"': 'quote',
  ',': 'comma', '<': 'comma',
  '.': 'dot', '>': 'dot',
  '/': 'slash', '?': 'slash',
  'backspace': 'backspace',
  'enter': 'enter',
  'tab': 'tab',
};

function getSvgTargetId(char: string | null): string | null {
  if (!char) return null;
  const lower = char.toLowerCase();
  return KEY_ID_MAP[lower] || lower; 
}

export const MonochromeKeyboard = memo(function MonochromeKeyboard({ expectedKey }: { expectedKey: string | null }) {
  const svgRef = useRef<SVGSVGElement>(null);

  // ─── ZERO-LATENCY C++ DOM BYPASS ───
  useEffect(() => {
    if (!svgRef.current) return;
    const dom = svgRef.current;

    // 1. Shut off previous active paths and text labels
    dom.querySelectorAll('.active').forEach(el => el.classList.remove('active'));

    if (!expectedKey) return;
    const targetId = getSvgTargetId(expectedKey);
    if (!targetId) return;

    // 2a. Ignite the path container
    const keyPath = dom.querySelector(`#keys path#${targetId}`);
    if (keyPath) keyPath.classList.add('active');

    // 2b. Ignite the painted text glyph inside #letters
    const targetGlyphString = expectedKey === ' ' ? 'space' : expectedKey.toLowerCase();
    const allTextNodes = dom.querySelectorAll('#letters text');
    
    allTextNodes.forEach((node) => {
      // For text elements like `<text>tab</text>`, `trim().toLowerCase()` works.
      if (node.textContent?.trim().toLowerCase() === targetGlyphString) {
        node.classList.add('active');
      }
    });

  }, [expectedKey]);

  return (
    <div className="w-full max-w-3xl mx-auto select-none pointer-events-none">
      <svg 
        ref={svgRef}
        viewBox="0 0 683.3 254" 
        className="w-full h-auto"
      >
        <style dangerouslySetInnerHTML={{ __html: `
          .edc-st0 {fill: none;stroke: #777777;stroke-width: 0.5;stroke-miterlimit: 10;}
          .edc-st1 {
            opacity: 0;
            font-family: 'ArialMT', 'Arial', 'Helvetica', 'sans-serif';
            font-size: 15px;
          }
          .edc-st2 {
            opacity: 1;
            fill: #777777;
          }

          .b {font-size: 26px;}
          .b2 {font-size: 24px;}
          .s {font-size: 12px;}

          path.active {fill: rgb(121, 187, 255);}
          path.deadkey {fill: orange;}
          path.correct {stroke: #c2ea9a;stroke-width: 4;}
          path.incorrect {fill: #e97e7e;}
          path.clickable:hover {cursor: pointer;stroke-width: 2px;}

          text {user-select: none;opacity: 0;}
          text.active {fill: #ffffff;}
          text.incorrect {fill: white;}
        `}} />
        <g id="keys">
          <path id="iso-key" className="edc-st0" d="M58.4,53.7c0,1.7-1.4,3-3,3H18.9c-1.6,0-3-1.3-3-3V18.3c0-1.7,1.3-3,3-3h36.5c1.6,0,3,1.3,3,3V53.7z"></path>
          <path id="key-1" className="edc-st0" d="M103.4,53.7c0,1.7-1.3,3-3,3H63.9c-1.7,0-3-1.3-3-3V18.3c0-1.6,1.3-3,3-3h36.5c1.7,0,3,1.4,3,3V53.7z"></path>
          <path id="q" className="edc-st0" d="M126.7,97.6c0,1.6-1.3,3-3,3H87.2c-1.7,0-3-1.4-3-3V62.3c0-1.6,1.3-3,3-3h36.5c1.7,0,3,1.4,3,3V97.6z"></path>
          <path id="a" className="edc-st0" d="M137.4,141.5c0,1.6-1.4,3-3,3H97.9c-1.7,0-3-1.4-3-3v-35.4c0-1.7,1.3-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z"></path>
          <path id="z" className="edc-st0" d="M160.8,185.4c0,1.7-1.4,3-3,3h-36.5c-1.7,0-3-1.3-3-3v-35.3c0-1.7,1.3-3,3-3h36.5c1.6,0,3,1.3,3,3V185.4z"></path>
          <path id="shift-left" className="edc-st0" d="M69.9,185.4c0,1.7-1.4,3-3,3h-48c-1.7,0-3-1.3-3-3v-35.3c0-1.7,1.3-3,3-3h48c1.6,0,3,1.3,3,3V185.4z"></path>
          <path id="tilda" className="edc-st0" d="M115.4,185.4c0,1.7-1.4,3-3,3H75.9c-1.7,0-3-1.3-3-3v-35.3c0-1.7,1.3-3,3-3h36.5c1.6,0,3,1.3,3,3V185.4z"></path>
          <path id="x" className="edc-st0" d="M205.8,185.4c0,1.7-1.4,3-3,3h-36.5c-1.7,0-3-1.3-3-3v-35.3c0-1.6,1.3-3,3-3h36.5c1.6,0,3,1.4,3,3V185.4z"></path>
          <path id="c" className="edc-st0" d="M250.8,185.4c0,1.7-1.4,3-3,3h-36.5c-1.7,0-3-1.3-3-3v-35.3c0-1.6,1.3-3,3-3h36.5c1.6,0,3,1.4,3,3V185.4z"></path>
          <path id="v" className="edc-st0" d="M295.8,185.4c0,1.7-1.4,3-3,3h-36.5c-1.7,0-3-1.3-3-3v-35.3c0-1.6,1.3-3,3-3h36.5c1.6,0,3,1.4,3,3V185.4z"></path>
          <path id="b" className="edc-st0" d="M340.8,185.4c0,1.7-1.4,3-3,3h-36.6c-1.6,0-3-1.3-3-3v-35.3c0-1.6,1.4-3,3-3h36.6c1.6,0,3,1.4,3,3V185.4z"></path>
          <path id="n" className="edc-st0" d="M385.8,185.4c0,1.7-1.4,3-3,3h-36.5c-1.6,0-3-1.3-3-3v-35.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V185.4z"></path>
          <path id="m" className="edc-st0" d="M430.8,185.4c0,1.7-1.4,3-3,3h-36.5c-1.6,0-3-1.3-3-3v-35.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V185.4z"></path>
          <path id="comma" className="edc-st0" d="M475.8,185.4c0,1.7-1.4,3-3,3h-36.5c-1.6,0-3-1.3-3-3v-35.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V185.4z"></path>
          <path id="dot" className="edc-st0" d="M520.8,185.4c0,1.7-1.3,3-3,3h-36.5c-1.6,0-3-1.3-3-3v-35.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V185.4z"></path>
          <path id="slash" className="edc-st0" d="M565.8,185.4c0,1.7-1.3,3-3,3h-36.5c-1.6,0-3-1.3-3-3v-35.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V185.4z"></path>
          <path id="s" className="edc-st0" d="M182.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z"></path>
          <path id="d" className="edc-st0" d="M227.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z"></path>
          <path id="f" className="edc-st0" d="M272.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z"></path>
          <path id="g" className="edc-st0" d="M317.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z"></path>
          <path id="h" className="edc-st0" d="M362.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z"></path>
          <path id="j" className="edc-st0" d="M407.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z"></path>
          <path id="k" className="edc-st0" d="M452.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z"></path>
          <path id="l" className="edc-st0" d="M497.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z"></path>
          <path id="semicolon" className="edc-st0" d="M542.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z"></path>
          <path id="quote" className="edc-st0" d="M587.4,141.5c0,1.6-1.4,3-3,3h-36.5c-1.7,0-3-1.4-3-3v-35.4c0-1.7,1.3-3,3-3h36.5c1.6,0,3,1.3,3,3V141.5z"></path>
          <path id="w" className="edc-st0" d="M171.7,97.6c0,1.6-1.3,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V97.6z"></path>
          <path id="e" className="edc-st0" d="M216.7,97.6c0,1.6-1.3,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.7,1.4-3,3-3h36.5c1.7,0,3,1.3,3,3V97.6z"></path>
          <path id="r" className="edc-st0" d="M261.7,97.6c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V97.6z"></path>
          <path id="t" className="edc-st0" d="M306.7,97.6c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V97.6z"></path>
          <path id="y" className="edc-st0" d="M351.7,97.6c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V97.6z"></path>
          <path id="u" className="edc-st0" d="M396.7,97.6c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V97.6z"></path>
          <path id="i" className="edc-st0" d="M441.7,97.6c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V97.6z"></path>
          <path id="o" className="edc-st0" d="M486.7,97.6c0,1.6-1.4,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V97.6z"></path>
          <path id="p" className="edc-st0" d="M531.7,97.6c0,1.6-1.3,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V97.6z"></path>
          <path id="open-bracket" className="edc-st0" d="M576.7,97.6c0,1.6-1.3,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V97.6z"></path>
          <path id="close-bracket" className="edc-st0" d="M621.7,97.6c0,1.6-1.3,3-3,3h-36.5c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V97.6z"></path>
          <path id="backslash" className="edc-st0" d="M634.8,141.4c0,1.6-1.3,3-3,3h-38.6c-1.6,0-3-1.4-3-3v-35.2c0-1.6,1.4-3,3-3h38.6c1.7,0,3,1.4,3,3V141.4z"></path>
          <path id="enter" className="edc-st0" d="M668.9,141.4c0,1.6-1.3,3-3,3h-25.3c-1.7,0-3-1.4-3-3v-36.1c0-2.6-2.1-4.7-4.7-4.7h-5.6c-1.7,0-3-1.3-3-3V62.3c0-1.7,1.3-3,3-3h38.5c1.7,0,3.1,1.4,3.1,3V141.4z"></path>
          <path id="key-2" className="edc-st0" d="M148.4,53.7c0,1.7-1.4,3-3,3h-36.5c-1.6,0-3-1.3-3-3V18.3c0-1.6,1.4-3,3-3h36.5c1.6,0,3,1.4,3,3V53.7z"></path>
          <path id="key-3" className="edc-st0" d="M193.4,53.7c0,1.7-1.4,3-3,3h-36.5c-1.7,0-3-1.3-3-3V18.3c0-1.6,1.3-3,3-3h36.5c1.6,0,3,1.4,3,3V53.7z"></path>
          <path id="key-4" className="edc-st0" d="M238.4,53.7c0,1.7-1.4,3-3,3H199c-1.7,0-3-1.3-3-3V18.3c0-1.7,1.3-3,3-3h36.5c1.6,0,3,1.3,3,3v35.4H238.4z"></path>
          <path id="key-5" className="edc-st0" d="M283.4,53.7c0,1.7-1.3,3-3,3h-36.5c-1.7,0-3-1.3-3-3V18.3c0-1.7,1.3-3,3-3h36.5c1.7,0,3,1.3,3,3V53.7z"></path>
          <path id="key-6" className="edc-st0" d="M328.4,53.7c0,1.7-1.3,3-3,3h-36.5c-1.6,0-3-1.3-3-3V18.3c0-1.7,1.4-3,3-3h36.5c1.7,0,3,1.3,3,3V53.7z"></path>
          <path id="key-7" className="edc-st0" d="M373.4,53.7c0,1.7-1.3,3-3,3h-36.5c-1.6,0-3-1.3-3-3V18.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V53.7z"></path>
          <path id="key-8" className="edc-st0" d="M418.4,53.7c0,1.7-1.3,3-3,3h-36.5c-1.6,0-3-1.3-3-3V18.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V53.7z"></path>
          <path id="key-9" className="edc-st0" d="M463.4,53.7c0,1.7-1.3,3-3,3h-36.5c-1.6,0-3-1.3-3-3V18.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V53.7z"></path>
          <path id="key-0" className="edc-st0" d="M508.4,53.7c0,1.7-1.3,3-3,3h-36.5c-1.6,0-3-1.3-3-3V18.3c0-1.6,1.4-3,3-3h36.5c1.7,0,3,1.4,3,3V53.7z"></path>
          <path id="minus" className="edc-st0" d="M553.4,53.7c0,1.7-1.4,3-3,3h-36.5c-1.7,0-3-1.3-3-3V18.3c0-1.7,1.4-3,3-3h36.5c1.6,0,3,1.3,3,3V53.7z"></path>
          <path id="equal" className="edc-st0" d="M598.4,53.7c0,1.7-1.4,3-3,3h-36.5c-1.7,0-3-1.3-3-3V18.3c0-1.6,1.3-3,3-3h36.5c1.6,0,3,1.4,3,3V53.7z"></path>
          <path id="backspace" className="edc-st0" d="M668.8,53.7c0,1.7-1.3,3-3,3h-61.9c-1.7,0-3-1.3-3-3V18.3c0-1.6,1.3-3,3-3h61.9c1.7,0,3,1.4,3,3V53.7z"></path>
          <path id="tab" className="edc-st0" d="M81.7,97.6c0,1.6-1.3,3-3,3H18.9c-1.6,0-3-1.4-3-3V62.3c0-1.6,1.3-3,3-3h59.8c1.7,0,3,1.4,3,3V97.6z"></path>
          <path id="capslock" className="edc-st0" d="M92.4,141.5c0,1.6-1.3,3-3,3H18.9c-1.6,0-3-1.4-3-3v-35.4c0-1.7,1.3-3,3-3h70.4c1.7,0,3,1.3,3,3L92.4,141.5L92.4,141.5z"></path>
          <path id="control" className="edc-st0 hide-on-bone" d="M105,236c0,1.6-1.3,3-3,3H18.9c-1.6,0-3-1.4-3-3v-42c0-1.7,1.3-3,3-3H102c1.7,0,3,1.3,3,3V236z"></path>
          <path id="option-left" className="edc-st0 hide-on-bone" d="M182.4,236c0,1.7-1.4,3-3,3h-68.8c-1.7,0-3-1.3-3-3v-42c0-1.7,1.3-3,3-3h68.8c1.6,0,3,1.3,3,3V236z"></path>
          <path id="option-right" className="edc-st0 hide-on-bone" d="M531.8,191c1.7,0,3,1.4,3,3v42c0,1.7-1.3,3-3,3h-62.9c-1.6,0-3-1.3-3-3v-42c0-1.6,1.4-3,3-3H531.8z"></path>
          <path className="edc-st0 hide-on-bone" d="M668.8,236.1c0,1.7-1.3,3-3,3H540.3c-1.6,0-3-1.3-3-3v-42c0-1.6,1.4-3,3-3h125.5c1.7,0,3,1.4,3,3V236.1z"></path>
          <path id="space" className="edc-st0" d="M460.4,191c1.6,0,3,1.4,3,3v42c0,1.7-1.4,3-3,3H187.5c-1.6,0-3-1.3-3-3v-42c0-1.6,1.4-3,3-3H460.4z"></path>
          <path id="shift-right" className="edc-st0" d="M668.8,185.4c0,1.7-1.3,3-3,3h-94.5c-1.6,0-3-1.3-3-3v-35.3c0-1.6,1.4-3,3-3h94.5c1.7,0,3,1.4,3,3V185.4z"></path>
        </g>
        <g id="letters">
          <text transform="matrix(1 0 0 1 33.4902 31.804)" className="edc-st1 edc-st2">±</text>
          <text transform="matrix(1 0 0 1 33.4902 50.804)" className="edc-st1 edc-st2">§</text>
          <text transform="matrix(1 0 0 1 90.6458 163.6643)" className="edc-st1 edc-st2" dx="0" dy="0">~</text>
          <text transform="matrix(1 0 0 1 91.6521 181.0408)" className="edc-st1 edc-st2" dx="0" dy="0">`</text>
          <text transform="matrix(1 0 0 1 78.626 50.407)" className="edc-st1 edc-st2" dx="0" dy="0">1</text>
          <text transform="matrix(1 0 0 1 123.2991 51.1765)" className="edc-st1 edc-st2" dx="0" dy="0">2</text>
          <text transform="matrix(1 0 0 1 169.6841 51.4041)" className="edc-st1 edc-st2" dx="0" dy="0">3</text>
          <text transform="matrix(1 0 0 1 213.0757 51.4041)" className="edc-st1 edc-st2" dx="0" dy="0">4</text>
          <text transform="matrix(1 0 0 1 258.0723 51.4041)" className="edc-st1 edc-st2" dx="0" dy="0">5</text>
          <text transform="matrix(1 0 0 1 303.2822 51.0891)" className="edc-st1 edc-st2" dx="0" dy="0">6</text>
          <text transform="matrix(1 0 0 1 349.5063 51.0891)" className="edc-st1 edc-st2" dx="0" dy="0">7</text>
          <text transform="matrix(1 0 0 1 393.281 51.2158)" className="edc-st1 edc-st2" dx="0" dy="0">8</text>
          <text transform="matrix(1 0 0 1 438.5742 51.2158)" className="edc-st1 edc-st2" dx="0" dy="0">9</text>
          <text transform="matrix(1 0 0 1 483.4907 51.2158)" className="edc-st1 edc-st2" dx="0" dy="0">0</text>
          <text transform="matrix(1 0 0 1 530.4011 50.407)" className="edc-st1 edc-st2" dx="0" dy="0">-</text>
          <text transform="matrix(1 0 0 1 573.5195 51.2158)" className="edc-st1 edc-st2" dx="0" dy="0">=</text>
          <text transform="matrix(1 0 0 1 80.5513 31.7605)" className="edc-st1 edc-st2" dx="0" dy="0">!</text>
          <text transform="matrix(1 0 0 1 119.8564 30.45)" className="edc-st1 edc-st2" dx="0" dy="0">@</text>
          <text transform="matrix(1 0 0 1 169.6841 31.76)" className="edc-st1 edc-st2" dx="0" dy="0">#</text>
          <text transform="matrix(1 0 0 1 213.0757 31.217)" className="edc-st1 edc-st2" dx="0" dy="0">$</text>
          <text transform="matrix(1 0 0 1 255.5747 30.8318)" className="edc-st1 edc-st2" dx="0" dy="0">%</text>
          <text transform="matrix(1 0 0 1 303.9556 32.4426)" className="edc-st1 edc-st2" dx="0" dy="0">^</text>
          <text transform="matrix(1 0 0 1 348.2554 31.76)" className="edc-st1 edc-st2" dx="0" dy="0">&amp;</text>
          <text transform="matrix(1 0 0 1 394.5334 32.8235)" className="edc-st1 edc-st2" dx="0" dy="0">*</text>
          <text transform="matrix(1 0 0 1 440.3076 30.6436)" className="edc-st1 edc-st2" dx="0" dy="0">(</text>
          <text transform="matrix(1 0 0 1 485.1646 30.6436)" className="edc-st1 edc-st2" dx="0" dy="0">)</text>
          <text transform="matrix(1 0 0 1 528.7588 25.5422)" className="edc-st1 edc-st2" dx="0" dy="0">_</text>
          <text transform="matrix(1 0 0 1 573.5195 32.4421)" className="edc-st1 edc-st2" dx="0" dy="0">+</text>
          <text transform="matrix(1 0 0 1 95.9087 75.4744)" className="edc-st1" dx="0" dy="0">Q</text>
          <text transform="matrix(1 0 0 1 95.9087 93.4744)" className="edc-st1 edc-st2 b" dx="-2.068756103515625" dy="-6">q</text>
          <text transform="matrix(1 0 0 1 140.3645 75.4744)" className="edc-st1" dx="0" dy="0">W</text>
          <text transform="matrix(1 0 0 1 140.3645 93.4744)" className="edc-st1 edc-st2 b" dx="-3" dy="-6">w</text>
          <text transform="matrix(1 0 0 1 188.5942 75.4744)" className="edc-st1" dx="0" dy="0">E</text>
          <text transform="matrix(1 0 0 1 188.5942 93.4744)" className="edc-st1 edc-st2 b" dx="-2.0687499046325684" dy="-6">e</text>
          <text transform="matrix(1 0 0 1 231.9934 75.4744)" className="edc-st1" dx="0" dy="0">R</text>
          <text transform="matrix(1 0 0 1 231.9934 93.4744)" className="edc-st1 edc-st2 b" dx="-0.8937499523162842" dy="-6">r</text>
          <text transform="matrix(1 0 0 1 278.6079 75.4744)" className="edc-st1" dx="0" dy="0">T</text>
          <text transform="matrix(1 0 0 1 278.6079 93.4744)" className="edc-st1 edc-st2 b" dx="-0.22499990463256836" dy="-6">t</text>
          <text transform="matrix(1 0 0 1 323.5137 75.4744)" className="edc-st1" dx="0" dy="0">Y</text>
          <text transform="matrix(1 0 0 1 323.5137 93.4744)" className="edc-st1 edc-st2 b" dx="-1.8000001907348633" dy="-6">y</text>
          <text transform="matrix(1 0 0 1 368.1387 75.4744)" className="edc-st1" dx="0" dy="0">U</text>
          <text transform="matrix(1 0 0 1 368.1387 93.4744)" className="edc-st1 edc-st2 b" dx="-2.0687499046325684" dy="-6">u</text>
          <text transform="matrix(1 0 0 1 416.5557 75.4744)" className="edc-st1" dx="0" dy="0">I</text>
          <text transform="matrix(1 0 0 1 416.5557 93.4744)" className="edc-st1 edc-st2 b" dx="-0.21874988079071045" dy="-6">i</text>
          <text transform="matrix(1 0 0 1 456.9639 75.4744)" className="edc-st1" dx="0" dy="0">O</text>
          <text transform="matrix(1 0 0 1 456.9639 93.4744)" className="edc-st1 edc-st2 b" dx="-2.0687499046325684" dy="-6">o</text>
          <text transform="matrix(1 0 0 1 503.9336 75.4744)" className="edc-st1" dx="0" dy="0">P</text>
          <text transform="matrix(1 0 0 1 503.9336 93.4744)" className="edc-st1 edc-st2 b" dx="-2.0687499046325684" dy="-6">p</text>
          <text transform="matrix(1 0 0 1 108.1345 120.3303)" className="edc-st1" dx="0" dy="0">A</text>
          <text transform="matrix(1 0 0 1 108.1345 138.3303)" className="edc-st1 edc-st2 b" dx="-2.1999998092651367" dy="-6">a</text>
          <text transform="matrix(1 0 0 1 153.0134 120.3303)" className="edc-st1" dx="0" dy="0">S</text>
          <text transform="matrix(1 0 0 1 153.0134 138.3303)" className="edc-st1 edc-st2 b" dx="-1.7562501430511475" dy="-6">s</text>
          <text transform="matrix(1 0 0 1 198.5242 120.3303)" className="edc-st1" dx="0" dy="0">D</text>
          <text transform="matrix(1 0 0 1 198.5242 138.3303)" className="edc-st1 edc-st2 b" dx="-2.068737506866455" dy="-6">d</text>
          <text transform="matrix(1 0 0 1 245.1121 120.3303)" className="edc-st1" dx="0" dy="0">F</text>
          <text transform="matrix(1 0 0 1 245.1121 138.3303)" className="edc-st1 edc-st2 b" dx="-0.5999999046325684" dy="-6">f</text>
          <text transform="matrix(1 0 0 1 287.4753 120.3303)" className="edc-st1" dx="0" dy="0">G</text>
          <text transform="matrix(1 0 0 1 287.4753 138.3303)" className="edc-st1 edc-st2 b" dx="-2.0687499046325684" dy="-6">g</text>
          <text transform="matrix(1 0 0 1 333.5886 120.3303)" className="edc-st1" dx="0" dy="0">H</text>
          <text transform="matrix(1 0 0 1 333.5886 138.3303)" className="edc-st1 edc-st2 b" dx="-2.0687499046325684" dy="-6">h</text>
          <text transform="matrix(1 0 0 1 380.2693 120.3303)" className="edc-st1" dx="0" dy="0">J</text>
          <text transform="matrix(1 0 0 1 380.2693 138.3303)" className="edc-st1 edc-st2 b" dx="-0.21875" dy="-6">j</text>
          <text transform="matrix(1 0 0 1 425.0181 120.3303)" className="edc-st1" dx="0" dy="0">K</text>
          <text transform="matrix(1 0 0 1 425.0181 138.3303)" className="edc-st1 edc-st2 b" dx="-1.8000001907348633" dy="-6">k</text>
          <text transform="matrix(1 0 0 1 471.8706 120.3303)" className="edc-st1" dx="0" dy="0">L</text>
          <text transform="matrix(1 0 0 1 471.8706 138.3303)" className="edc-st1 edc-st2 b" dx="-0.2187255620956421" dy="-6">l</text>
          <text transform="matrix(1 0 0 1 132.7896 163.7458)" className="edc-st1" dx="0" dy="0">Z</text>
          <text transform="matrix(1 0 0 1 132.7896 181.7458)" className="edc-st1 edc-st2 b" dx="-1.7562439441680908" dy="-6">z</text>
          <text transform="matrix(1 0 0 1 177.2339 163.7458)" className="edc-st1" dx="0" dy="0">X</text>
          <text transform="matrix(1 0 0 1 177.2339 181.7458)" className="edc-st1 edc-st2 b" dx="-1.512500286102295" dy="-6">x</text>
          <text transform="matrix(1 0 0 1 220.5415 163.7458)" className="edc-st1" dx="0" dy="0">C</text>
          <text transform="matrix(1 0 0 1 220.5415 181.7458)" className="edc-st1 edc-st2 b" dx="-1.7562501430511475" dy="-6">c</text>
          <text transform="matrix(1 0 0 1 267.3972 163.7458)" className="edc-st1" dx="0" dy="0">V</text>
          <text transform="matrix(1 0 0 1 267.3972 181.7458)" className="edc-st1 edc-st2 b" dx="-1.8000001907348633" dy="-6">v</text>
          <text transform="matrix(1 0 0 1 312.0098 163.7458)" className="edc-st1" dx="0" dy="0">B</text>
          <text transform="matrix(1 0 0 1 312.0098 181.7458)" className="edc-st1 edc-st2 b" dx="-2.0687499046325684" dy="-6">b</text>
          <text transform="matrix(1 0 0 1 356.4863 163.7458)" className="edc-st1" dx="0" dy="0">N</text>
          <text transform="matrix(1 0 0 1 356.4863 181.7458)" className="edc-st1 edc-st2 b" dx="-2.0687499046325684" dy="-6">n</text>
          <text transform="matrix(1 0 0 1 399.6816 163.7458)" className="edc-st1" dx="0" dy="0">M</text>
          <text transform="matrix(1 0 0 1 399.6816 181.7458)" className="edc-st1 edc-st2 b" dx="-3.5874996185302734" dy="-6">m</text>
          <text transform="matrix(1 0 0 1 519.074 136.7126)" className="edc-st1 edc-st2" dx="0" dy="0">;</text>
          <text transform="matrix(1 0 0 1 519.074 119.3762)" className="edc-st1 edc-st2" dx="0" dy="0">:</text>
          <text transform="matrix(1 0 0 1 451.3286 180.041)" className="edc-st1 edc-st2 b2" dx="-1.2562499046325684" dy="0">,</text>
          <text transform="matrix(1 0 0 1 450.2827 164.3396)" className="edc-st1 edc-st2" dx="0" dy="0">&lt;</text>
          <text transform="matrix(1 0 0 1 495.9731 181.041)" className="edc-st1 edc-st2 b2" dx="-1.2562499046325684" dy="0">.</text>
          <text transform="matrix(1 0 0 1 494.9275 164.3396)" className="edc-st1 edc-st2" dx="0" dy="0">&gt;</text>
          <text transform="matrix(1 0 0 1 543.4077 181.0408)" className="edc-st1 edc-st2" dx="0" dy="0">/</text>
          <text transform="matrix(1 0 0 1 541.3276 163.2498)" className="edc-st1 edc-st2" dx="0" dy="0">?</text>
          <text transform="matrix(1 0 0 1 565.6211 138.7126)" className="edc-st1 edc-st2" dx="0" dy="0">'</text>
          <text transform="matrix(1 0 0 1 565.6211 120.3762)" className="edc-st1 edc-st2" dx="0" dy="0">"</text>
          <text transform="matrix(1 0 0 1 553.3923 94.426)" className="edc-st1 edc-st2" dx="0" dy="0">[</text>
          <text transform="matrix(1 0 0 1 552.9709 74.877)" className="edc-st1 edc-st2" dx="0" dy="0">&#123;</text>
          <text transform="matrix(1 0 0 1 598.7656 94.426)" className="edc-st1 edc-st2" dx="0" dy="0">]</text>
          <text transform="matrix(1 0 0 1 598.3442 74.7849)" className="edc-st1 edc-st2" dx="0" dy="0">&#125;</text>
          <text transform="matrix(1 0 0 1 610.4075 140.6807)" className="edc-st1 edc-st2" dx="0" dy="0">{"\\"}</text>
          <text transform="matrix(1 0 0 1 610.5442 118.677)" className="edc-st1 edc-st2" dx="0" dy="0">|</text>
          <text id="text-tab" transform="matrix(1 0 0 1 23.3467 93.2341)" className="edc-st1 s edc-st2">tab</text>
          <text id="text-caps-lock" transform="matrix(1 0 0 1 23.3467 137.7126)" className="edc-st1 s edc-st2">caps lock</text>
          <text id="text-shift-left" transform="matrix(1 0 0 1 23.3467 181.0408)" className="edc-st1 s edc-st2">shift</text>
          <text id="text-shift-right" transform="matrix(1 0 0 1 641.8259 180.0408)" className="edc-st1 s edc-st2">shift</text>
          <text id="text-backspace" transform="matrix(1 0 0 1 606.4653 51.1765)" className="edc-st1 s edc-st2">backspace</text>
          <text id="text-enter" transform="matrix(1 0 0 1 635.6479 72.5581)" className="edc-st1 s edc-st2">enter</text>
          <text id="text-option-left" transform="matrix(1 0 0 1 129.2339 231.4646)" className="edc-st1 s edc-st2">option</text>
          <text id="text-space" transform="matrix(1 0 0 1 199.7898 232.4646)" className="edc-st1 s edc-st2">space</text>
          <text id="text-option-right" transform="matrix(1 0 0 1 483.8865 231.4646)" className="edc-st1 s edc-st2">option</text>
          <text id="text-control" transform="matrix(1 0 0 1 23.3467 232.4651)" className="edc-st1 s edc-st2">control </text>
        </g>
      </svg>
    </div>
  );
});
