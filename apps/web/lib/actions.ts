"use server";

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

const exchangeArtSchema = z.object({
    title: z.string().max(5, "タイトルは5文字以内です"),
    pixels: z.array(z.string()).length(16, "16色の配列が必要です"),
});

export type ExchangeResult =
    | { success: true; post: Post | null; message: string }
    | { success: false; error: string };

export async function exchangeArt(
    title: string,
    pixels: string[]
): Promise<ExchangeResult> {
    // Validate input
    const validation = exchangeArtSchema.safeParse({ title, pixels });
    if (!validation.success) {
        return {
            success: false,
            error: validation.error.errors[0]?.message || "入力が不正です",
        };
    }

    // Check if canvas is all white and title is empty
    const isCanvasWhite = pixels.every((color) => color === "#ffffff");
    const isTitleEmpty = !title || title.trim() === "";

    if (isCanvasWhite && isTitleEmpty) {
        return {
            success: false,
            error: "キャンバスが真っ白で、タイトルもありません。絵を描くか、タイトルをつけてね。",
        };
    }

    const { url, serviceKey } = getSupabaseConfig();
    const supabase = createClient(url, serviceKey);
    const finalTitle = title.trim() || "むだい";

    try {
        const { data, error } = await supabase.rpc("exchange_art", {
            new_title: finalTitle,
            new_pixels: pixels,
        });

        if (error) {
            console.error("Supabase RPC error:", error);
            return {
                success: false,
                error: `エラー: ${error.message}`,
            };
        }

        if (data) {
            return {
                success: true,
                post: data as Post,
                message: "あなたの元に新しい絵がやってきました",
            };
        }

        return {
            success: true,
            post: null,
            message: "投稿ありがとう！交換相手がいなかったので、あなたの絵は誰かが来るまで保管されます",
        };
    } catch (e) {
        console.error("Exchange error:", e);
        return {
            success: false,
            error: "通信エラーが発生しました",
        };
    }
}
