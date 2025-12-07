"use client";

import { memo } from "react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

function ColorPickerComponent({ color, onChange }: ColorPickerProps) {
  return (
    <div className="flex justify-center items-center gap-[10px] mb-5 p-[10px] border-2 border-dashed border-border-inactive relative">
      <span className="text-sm font-pixel">いろをえらぶ →</span>
      <div
        className="w-10 h-10 border-[3px] border-border shadow-[2px_2px_0_rgba(0,0,0,0.1)]"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        aria-label="色を選択"
      />
    </div>
  );
}

export const ColorPicker = memo(ColorPickerComponent);
