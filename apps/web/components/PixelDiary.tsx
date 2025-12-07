"use client";

import { useState, useCallback, useEffect } from "react";
import type { ChangeEvent } from "react";
import { Canvas } from "./Canvas";
import { ColorPicker } from "./ColorPicker";
import { Album } from "./Album";
import { Modal } from "./Modal";
import { useAlbum } from "@/hooks/useAlbum";
import { useWorkTime } from "@/hooks/useWorkTime";
import { exchangeArt } from "@/lib/actions";
import { getFingerprint } from "@/lib/fingerprint";
import type { Post } from "@/types";

const INITIAL_PIXELS = Array(16).fill("#ffffff");
const DEFAULT_COLOR = "#ffb7b2";

export function PixelDiary() {
    const [pixels, setPixels] = useState<string[]>(INITIAL_PIXELS);
    const [currentColor, setCurrentColor] = useState(DEFAULT_COLOR);
    const [title, setTitle] = useState("");
    const [fingerprint, setFingerprint] = useState("");
    const [isExchanging, setIsExchanging] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    const { posts, addPost, removePost } = useAlbum();
    const { markActive, finalize, reset: resetWork } = useWorkTime(60);

    useEffect(() => {
        setFingerprint(getFingerprint());
    }, []);

    const handlePixelClick = useCallback(
        (index: number) => {
            markActive();
            setPixels((prev) => {
                const newPixels = [...prev];
                newPixels[index] = currentColor;
                return newPixels;
            });
        },
        [currentColor, markActive]
    );

    const resetCanvas = useCallback(() => {
        setPixels(INITIAL_PIXELS);
        setTitle("");
        resetWork();
    }, [resetWork]);

    const handleExchange = useCallback(async () => {
        setIsExchanging(true);

        try {
            const workSeconds = finalize();
            const fp = fingerprint || getFingerprint();

            const result = await exchangeArt({
                title,
                pixels,
                fingerprint: fp,
                workSeconds,
            });

            if (!result.success) {
                alert(result.error);
                return;
            }

            if (result.duplicate && result.post) {
                const shouldSave = confirm(result.message);
                if (shouldSave) {
                    addPost(result.post);
                }
            } else {
                if (result.post) {
                    addPost(result.post);
                }
                alert(result.message);
            }

            resetCanvas();
        } catch (error) {
            console.error("Exchange error:", error);
            alert("エラーが発生しました");
        } finally {
            setIsExchanging(false);
        }
    }, [title, pixels, addPost, finalize, fingerprint, resetCanvas]);

    const handleViewPost = useCallback((post: Post) => {
        setSelectedPost(post);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedPost(null);
    }, []);

    const handleDeletePost = useCallback(
        (postId: string) => {
            removePost(postId);
        },
        [removePost]
    );

    const handleTitleChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            markActive();
            setTitle(e.target.value);
        },
        [markActive]
    );

    const handleColorChange = useCallback(
        (value: string) => {
            markActive();
            setCurrentColor(value);
        },
        [markActive]
    );

    return (
        <>
            <div className="bg-container-bg border-border mb-10 w-[300px] border-[3px] p-6 text-center">
                <h1 className="font-pixel mb-[15px] text-xl font-bold tracking-[2px]">
                    いまのきぶん
                </h1>

                <Canvas
                    pixels={pixels}
                    currentColor={currentColor}
                    onPixelClick={handlePixelClick}
                />

                <ColorPicker color={currentColor} onChange={handleColorChange} />

                <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="タイトル(5もじまで)"
                    maxLength={5}
                    className="font-pixel border-border mb-[15px] w-[180px] border-[3px] bg-[#f9f9f9] p-2 text-center text-base outline-none"
                />

                <button
                    type="button"
                    onClick={handleExchange}
                    disabled={isExchanging}
                    className="bg-accent text-border border-border font-pixel active:bg-border active:text-accent w-full cursor-pointer border-[3px] px-5 py-3 text-lg font-bold disabled:cursor-not-allowed disabled:bg-[#ccc] disabled:text-[#888]"
                >
                    {isExchanging ? "つうしんちゅう..." : "こうかんする"}
                </button>
            </div>

            <Album posts={posts} onView={handleViewPost} onDelete={handleDeletePost} />

            <Modal post={selectedPost} onClose={handleCloseModal} />
        </>
    );
}
