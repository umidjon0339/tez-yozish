import React from 'react';
import { ThumbnailParams } from '@/types/thumbnail';
import { ThumbnailRegistry } from './SvgLibrary';

interface DynamicThumbnailProps {
  svgId: string;
  params?: ThumbnailParams;
  className?: string;
}

export function DynamicThumbnail({ svgId, params, className = "w-full h-full" }: DynamicThumbnailProps) {
  // 1. Look up the component string in the registry
  const SvgComponent = ThumbnailRegistry[svgId];

  // 2. Safety net: If the JSON has a typo or the SVG doesn't exist, show a clean fallback
  if (!SvgComponent) {
    console.warn(`Thumbnail template '${svgId}' not found in registry.`);
    return (
      <div className={`bg-neutral-100 flex items-center justify-center text-neutral-400 font-mono text-xs ${className}`}>
        Missing SVG: {svgId}
      </div>
    );
  }

  // 3. Render the matched SVG and pass the parameters
  return <SvgComponent params={params} className={className} />;
}