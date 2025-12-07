import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import { useWorkTime } from "./useWorkTime";

describe("useWorkTime", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("accumulates active time when interactions are within the idle threshold", () => {
        const { result } = renderHook(() => useWorkTime(60));

        act(() => {
            result.current.markActive();
        });

        act(() => {
            vi.advanceTimersByTime(10_000);
            result.current.markActive();
        });

        act(() => {
            vi.advanceTimersByTime(5_000);
        });

        let total = 0;
        act(() => {
            total = result.current.finalize();
        });

        expect(total).toBe(15);
    });

    it("ignores idle gaps beyond threshold and starts a new segment", () => {
        const { result } = renderHook(() => useWorkTime(5));

        act(() => result.current.markActive()); // t=0

        act(() => {
            vi.advanceTimersByTime(3_000);
            result.current.markActive(); // +3s
        });

        act(() => {
            vi.advanceTimersByTime(7_000); // idle gap > threshold
            result.current.markActive(); // restart, no addition
        });

        act(() => {
            vi.advanceTimersByTime(2_000);
        });

        let total = 0;
        act(() => {
            total = result.current.finalize();
        });

        expect(total).toBe(5); // 3s first segment + 2s second segment
    });

    it("resets counters when reset is called", () => {
        const { result } = renderHook(() => useWorkTime(10));

        act(() => {
            result.current.markActive();
            vi.advanceTimersByTime(4_000);
        });

        act(() => {
            result.current.reset();
        });

        act(() => {
            vi.advanceTimersByTime(3_000);
            result.current.markActive();
        });

        let total = 0;
        act(() => {
            total = result.current.finalize();
        });

        expect(total).toBe(0); // reset cleared previous segment; new segment has no duration yet
    });
});
