"use client";

import { useCallback, useRef } from "react";

export function useWorkTime(idleThresholdSeconds = 60) {
    const lastActiveRef = useRef<number | null>(null);
    const totalMsRef = useRef(0);

    const markActive = useCallback(() => {
        const now = Date.now();

        if (lastActiveRef.current === null) {
            lastActiveRef.current = now;
            return;
        }

        const diff = now - lastActiveRef.current;
        if (diff < idleThresholdSeconds * 1000) {
            totalMsRef.current += diff;
        }

        lastActiveRef.current = now;
    }, [idleThresholdSeconds]);

    const finalize = useCallback(() => {
        const now = Date.now();

        if (lastActiveRef.current !== null) {
            const diff = now - lastActiveRef.current;
            if (diff < idleThresholdSeconds * 1000) {
                totalMsRef.current += diff;
            }
        }

        const seconds = Math.floor(totalMsRef.current / 1000);
        lastActiveRef.current = now;
        return seconds;
    }, [idleThresholdSeconds]);

    const reset = useCallback(() => {
        lastActiveRef.current = null;
        totalMsRef.current = 0;
    }, []);

    return { markActive, finalize, reset };
}
