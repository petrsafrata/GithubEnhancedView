import {
    defineConfig
} from "vite";

import {
    resolve
} from "node:path";

export default defineConfig(
    ({ mode }) => {
        const entries = {
            content: {
                name: "content",
                path:
                    "src/content/index.ts"
            },

            options: {
                name: "options",
                path:
                    "src/options/index.ts"
            },

            background: {
                name: "background",
                path:
                    "src/background/index.ts"
            }
        } as const;

        const selectedEntry =
            mode === "options"
                ? entries.options
                : mode === "background"
                    ? entries.background
                    : entries.content;

        return {
            build: {
                outDir: "dist",

                /*
                 * Only the first content build
                 * will clean the dist directory.
                 */
                emptyOutDir:
                    mode === "content",

                cssCodeSplit: true,

                rollupOptions: {
                    input: {
                        [selectedEntry.name]:
                            resolve(
                                __dirname,
                                selectedEntry.path
                            )
                    },

                    output: {
                        entryFileNames:
                            "[name].js",

                        chunkFileNames:
                            "[name].js",

                        assetFileNames:
                            "[name][extname]"
                    }
                }
            }
        };
    }
);