import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        include: ["**/*.{test,spec}.{ts,tsx}"],
        exclude: ["node_modules/**", "e2e/**/*", "playwright.config.ts"],
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "./"),
        },
    },
});
