import type {
    FileFilterRule
} from "./types";

const DEFAULT_FILE_FILTER_PATTERNS =
    [
        ".editorconfig",
        ".gitattributes",
        ".gitignore",
        ".npmrc",

        ".prettierignore",
        ".prettierrc*",

        ".stylelintignore",
        ".stylelintrc*",

        "package-lock.json",
        "pnpm-lock.yaml",
        "yarn.lock",

        "eslint.config.*",
        "postcss.config.*",
        "tailwind.config.*",
        "vite.config.*",

        "tsconfig*.json",
        "jsconfig*.json"
    ];

export function createDefaultFileFilterRules():
    FileFilterRule[] {
    return DEFAULT_FILE_FILTER_PATTERNS.map(
        (pattern, index) => ({
            id:
                `default-filter-${index}`,

            pattern,

            enabled: true
        })
    );
}