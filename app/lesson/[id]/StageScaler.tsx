import React, { useEffect, useRef, useState } from "react";

// ─── GAME-STAGE SCALER ───
// The arena renders at a fixed design size and scales to fit the available
// space, like a game canvas. Zooming the browser can never cause scrolling.
const STAGE_W = 1100;
const STAGE_H = 780;

export function StageScaler({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setScale(Math.min(r.width / STAGE_W, r.height / STAGE_H, 1.15));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden"
    >
      <div
        style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}
        className="flex flex-col items-center shrink-0"
      >
        {children}
      </div>
    </div>
  );
}
