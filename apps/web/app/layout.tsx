import type { Metadata, Viewport } from "next";
import { DotGothic16 } from "next/font/google";
import "./globals.css";

const dotGothic = DotGothic16({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-dot-gothic",
    display: "swap",
    preload: true,
});

export const metadata: Metadata = {
    title: "4x4 Pixel Diary",
    description: "4x4ピクセルアートを描いて他のユーザーと交換する日記アプリ",
    keywords: ["pixel art", "diary", "exchange", "4x4"],
    authors: [{ name: "dot-pixel-canvas" }],
    // 一時的に検索エンジンから非公開（公開時に削除）
    robots: {
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false,
        },
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#fffbf0",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <body className={`${dotGothic.variable} font-pixel`}>{children}</body>
        </html>
    );
}
