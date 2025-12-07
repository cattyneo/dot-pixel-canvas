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
            className="bg-border border-border mx-auto mb-5 grid h-[200px] w-[200px] grid-cols-4 gap-[2px] border-[3px] p-[2px]"
            role="grid"
            aria-label="4x4 ピクセルキャンバス"
        >
            {pixels.map((color, index) => (
                <button
                    key={index}
                    type="button"
                    className="h-full w-full cursor-pointer transition-colors hover:opacity-80"
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
