"use client";

const STORAGE_KEY = "pixel_diary_fingerprint";
let memoryFingerprint: string | null = null;

function generateFingerprint(): string {
    const uuid = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function";
    if (uuid) {
        return crypto.randomUUID();
    }

    // Simple fallback UUID v4-ish
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function getFingerprint(): string {
    if (typeof window === "undefined") {
        if (!memoryFingerprint) {
            memoryFingerprint = generateFingerprint();
        }
        return memoryFingerprint;
    }

    if (memoryFingerprint) {
        return memoryFingerprint;
    }

    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
            memoryFingerprint = stored;
            return stored;
        }
    } catch {
        // localStorage unavailable; fall back to memory
    }

    const fingerprint = generateFingerprint();
    memoryFingerprint = fingerprint;

    try {
        window.localStorage.setItem(STORAGE_KEY, fingerprint);
    } catch {
        // Ignore storage errors; memory cache will be used
    }

    return fingerprint;
}

export function clearFingerprintCache() {
    memoryFingerprint = null;
    if (typeof window !== "undefined") {
        try {
            window.localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Ignore storage errors
        }
    }
}

export { STORAGE_KEY };
