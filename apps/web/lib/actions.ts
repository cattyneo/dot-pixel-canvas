"use server";

import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Post } from "@/types";

function getSupabaseConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        throw new Error(
            "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
        );
    }

    return { url, serviceKey };
}

const hexColorSchema = z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "無効な色が含まれています");

const exchangeArtSchema = z.object({
    title: z.string().max(5, "タイトルは5文字以内です").optional(),
    pixels: z.array(hexColorSchema).length(16, "16色の配列が必要です"),
    fingerprint: z
        .string()
        .regex(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            "fingerprintが不正です"
        ),
    workSeconds: z.number().int().min(0).max(3600).optional(),
});

export type ExchangeResult =
    | { success: true; post: Post | null; message: string; duplicate?: boolean }
    | { success: false; error: string };

const sanitizeTitle = (title?: string) => {
    const cleaned = (title ?? "").replace(/\p{C}/gu, "");
    const trimmed = cleaned.trim();
    return trimmed === "" ? "むだい" : trimmed;
};

const isAllWhiteCanvas = (pixels: string[]) =>
    pixels.every((color) => color.toLowerCase() === "#ffffff");

async function getClientIp(): Promise<string | null> {
    try {
        const forwardedHeaders = await headers();
        const forwarded = forwardedHeaders.get("x-forwarded-for");
        if (!forwarded) return null;
        return forwarded.split(",")[0]?.trim() || null;
    } catch {
        return null;
    }
}

function normalizePixels(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value as string[];
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed as string[];
            }
        } catch {
            // fall through
        }
    }

    return [];
}

function normalizePost(data: any): Post {
    return {
        id: data.id,
        title: data.title,
        pixels: normalizePixels(data.pixels),
        created_at: data.created_at,
    };
}

export async function exchangeArt(input: {
    title: string;
    pixels: string[];
    fingerprint: string;
    workSeconds?: number;
}): Promise<ExchangeResult> {
    const validation = exchangeArtSchema.safeParse({
        title: input.title,
        pixels: input.pixels,
        fingerprint: input.fingerprint,
        workSeconds: input.workSeconds ?? 0,
    });

    if (!validation.success) {
        return {
            success: false,
            error: validation.error.errors[0]?.message || "入力が不正です",
        };
    }

    const parsed = validation.data;
    const sanitizedPixels = parsed.pixels.map((c) => c.trim());
    const sanitizedTitle = sanitizeTitle(parsed.title);

    if (isAllWhiteCanvas(sanitizedPixels) && sanitizedTitle === "むだい") {
        return {
            success: false,
            error: "キャンバスが真っ白で、タイトルもありません",
        };
    }

    const { url, serviceKey } = getSupabaseConfig();
    const supabase = createClient(url, serviceKey);
    const clientIp = await getClientIp();

    try {
        const { data, error } = await supabase.rpc("exchange_art", {
            new_title: sanitizedTitle,
            new_pixels: sanitizedPixels,
            client_fingerprint: parsed.fingerprint,
            client_ip: clientIp,
            work_seconds: parsed.workSeconds ?? 0,
        });

        if (error) {
            return {
                success: false,
                error: `エラー: ${error.message}`,
            };
        }

        if (data?.duplicate) {
            const post = normalizePost(data);
            return {
                success: true,
                duplicate: true,
                post,
                message: "他の人が作成済みです。アルバムに保存しますか？",
            };
        }

        if (data) {
            const post = normalizePost(data);
            return {
                success: true,
                post,
                message: "あなたの元に新しい絵がやってきました",
            };
        }

        return {
            success: true,
            post: null,
            message:
                "投稿ありがとう！交換相手がいなかったので、あなたの絵は誰かが来るまで保管されます",
        };
    } catch (e) {
        return {
            success: false,
            error: "通信エラーが発生しました",
        };
    }
}
