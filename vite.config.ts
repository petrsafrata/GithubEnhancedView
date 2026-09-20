import {
    defineConfig
} from "vite";

import {
    resolve
} from "node:path";

export default defineConfig(
    ({ mode }) => {
        const buildingOptions =
            mode === "options";

        const entryName =
            buildingOptions
                ? "options"
                : "content";

        const entryPath =
            buildingOptions
                ? "src/options/index.ts"
                : "src/content/index.ts";

        return {
            build: {
                outDir: "dist",

                /*
                 * The content build cleans up the dist directory.
                 * The options build then
                 * simply adds options.js and CSS to it.
                 */
                emptyOutDir:
                    !buildingOptions,

                cssCodeSplit: true,

                rollupOptions: {
                    input: {
                        [entryName]:
                            resolve(
                                __dirname,
                                entryPath
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