"use client";

import { memo } from "react";

interface CanvasProps {
  pixels: string[];
  currentColor: string;
  onPixelClick: (index: number) => void;
}

function CanvasComponent({ pixels, currentColor, onPixelClick }: CanvasProps) {
  return (
    <div
      className="grid grid-cols-4 gap-[2px] w-[200px] h-[200px] mx-auto mb-5 bg-border border-[3px] border-border p-[2px]"
      role="grid"
      aria-label="4x4 ピクセルキャンバス"
    >
      {pixels.map((color, index) => (
        <button
          key={index}
          type="button"
          className="w-full h-full cursor-pointer transition-colors hover:opacity-80"
          style={{ backgroundColor: color }}
          onClick={() => onPixelClick(index)}
          aria-label={`ピクセル ${index + 1}`}
          aria-pressed={color !== "#ffffff"}
        />
      ))}
    </div>
  );
}

export const Canvas = memo(CanvasComponent);
