import { describe, expect, it, beforeEach, vi } from "vitest";

import { clearFingerprintCache, getFingerprint } from "./fingerprint";

const STORAGE_KEY = "pixel_diary_fingerprint";
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("fingerprint", () => {
    beforeEach(() => {
        clearFingerprintCache();
        vi.resetAllMocks();
    });

    it("creates and stores a fingerprint when none exists", () => {
        window.localStorage.getItem = vi.fn().mockReturnValue(null);
        const setItem = vi.fn();
        window.localStorage.setItem = setItem;

        const fp = getFingerprint();

        expect(fp).toMatch(uuidRegex);
        expect(setItem).toHaveBeenCalledWith(STORAGE_KEY, fp);
    });

    it("returns existing fingerprint from localStorage without regenerating", () => {
        window.localStorage.getItem = vi.fn().mockReturnValue("existing-uuid");
        const setItem = vi.fn();
        window.localStorage.setItem = setItem;

        const fp = getFingerprint();

        expect(fp).toBe("existing-uuid");
        expect(setItem).not.toHaveBeenCalled();
    });

    it("falls back to memory cache when localStorage is unavailable", () => {
        window.localStorage.getItem = vi.fn(() => {
            throw new Error("disabled");
        });
        window.localStorage.setItem = vi.fn(() => {
            throw new Error("disabled");
        });

        const first = getFingerprint();
        const second = getFingerprint();

        expect(first).toMatch(uuidRegex);
        expect(second).toBe(first);
    });
});
