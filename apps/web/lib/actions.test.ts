import { describe, expect, it, beforeEach, vi } from "vitest";

import { exchangeArt } from "./actions";

const rpcMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => ({
        rpc: rpcMock,
    })),
}));

vi.mock("next/headers", () => ({
    headers: vi.fn(() => new Headers({ "x-forwarded-for": "203.0.113.1" })),
}));

const validPixels = Array(16).fill("#ff0000");
const validFingerprint = "00000000-0000-4000-8000-000000000000";

describe("exchangeArt action", () => {
    beforeEach(() => {
        rpcMock.mockReset();
        process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
        process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    });

    it("returns error when pixels contain invalid hex", async () => {
        const invalid = [...validPixels];
        invalid[3] = "#gggggg";

        const result = await exchangeArt({
            title: "abc",
            pixels: invalid,
            fingerprint: validFingerprint,
            workSeconds: 10,
        });

        expect(result.success).toBe(false);
        if (result.success) throw new Error("expected failure");
        expect(result.error).toContain("無効な色");
    });

    it("rejects all-white canvas with empty title", async () => {
        const white = Array(16).fill("#ffffff");

        const result = await exchangeArt({
            title: "",
            pixels: white,
            fingerprint: validFingerprint,
            workSeconds: 0,
        });

        expect(result.success).toBe(false);
        if (result.success) throw new Error("expected failure");
        expect(result.error).toContain("キャンバスが真っ白");
    });

    it("passes fingerprint/ip/work_seconds and parses pixels array from RPC", async () => {
        const rpcPixels = Array(16).fill("#ffb7b2");
        rpcMock.mockResolvedValue({
            data: {
                id: "post-1",
                title: "t",
                pixels: JSON.stringify(rpcPixels),
                created_at: "2024-01-01T00:00:00Z",
            },
            error: null,
        });

        const result = await exchangeArt({
            title: "t",
            pixels: validPixels,
            fingerprint: validFingerprint,
            workSeconds: 15,
        });

        expect(rpcMock).toHaveBeenCalledWith("exchange_art", {
            new_title: "t",
            new_pixels: validPixels,
            client_fingerprint: validFingerprint,
            client_ip: "203.0.113.1",
            work_seconds: 15,
        });

        expect(result.success).toBe(true);
        if (!result.success) throw new Error("expected success");
        expect(result.post?.pixels).toEqual(rpcPixels);
    });
});
