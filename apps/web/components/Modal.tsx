"use client";

import { memo, useMemo, useEffect, useCallback } from "react";
import type { Post } from "@/types";

interface ModalProps {
    post: Post | null;
    onClose: () => void;
}

function ModalComponent({ post, onClose }: ModalProps) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (post) {
            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }
    }, [post, handleKeyDown]);

    const dateString = useMemo(() => {
        if (!post) return "";
        const date = new Date(post.created_at);
        return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;
    }, [post?.created_at]);

    const pixels = useMemo(() => {
        if (!post) return [];
        if (Array.isArray(post.pixels)) return post.pixels;
        try {
            const parsed = JSON.parse(post.pixels as unknown as string);
            if (Array.isArray(parsed)) {
                return parsed as string[];
            }
        } catch {
            // ignore
        }
        return Array(16).fill("#cccccc");
    }, [post?.pixels]);

    if (!post) return null;

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="border-border animate-popUp relative w-[300px] border-4 bg-white p-[30px] text-center shadow-[10px_10px_0_rgba(0,0,0,0.5)]">
                <button
                    type="button"
                    onClick={onClose}
                    className="bg-accent border-border hover:bg-border hover:text-accent absolute -right-5 -top-5 h-10 w-10 cursor-pointer rounded-full border-[3px] text-2xl leading-[35px]"
                    aria-label="閉じる"
                >
                    ×
                </button>

                <div className="bg-border border-border mx-auto mb-5 grid h-60 w-60 grid-cols-4 gap-[2px] border-[3px] p-[2px]">
                    {pixels.map((color, index) => (
                        <div
                            key={index}
                            className="h-full w-full"
                            style={{
                                backgroundColor: typeof color === "string" ? color : "#cccccc",
                            }}
                        />
                    ))}
                </div>

                <h3 id="modal-title" className="font-pixel mb-[5px] text-2xl font-bold">
                    {post.title}
                </h3>
                <p className="font-pixel text-sm text-[#666]">{dateString}</p>
            </div>
        </div>
    );
}

export const Modal = memo(ModalComponent);
