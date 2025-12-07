"use client";

import { memo } from "react";

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
}

function ColorPickerComponent({ color, onChange }: ColorPickerProps) {
    return (
        <div className="border-border-inactive relative mb-5 flex items-center justify-center gap-[10px] border-2 border-dashed p-[10px]">
            <span className="font-pixel text-sm">いろをえらぶ →</span>
            <div
                className="border-border h-10 w-10 border-[3px] shadow-[2px_2px_0_rgba(0,0,0,0.1)]"
                style={{ backgroundColor: color }}
                aria-hidden="true"
            />
            <input
                type="color"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                aria-label="色を選択"
            />
        </div>
    );
}

export const ColorPicker = memo(ColorPickerComponent);
