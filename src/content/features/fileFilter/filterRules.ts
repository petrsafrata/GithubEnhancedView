const hiddenFilenames = new Set([
    ".editorconfig",
    ".gitattributes",
    ".gitignore",
    ".npmrc",
    ".prettierignore",
    ".prettierrc",
    ".stylelintignore",
    ".stylelintrc",

    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock"
]);

const hiddenPatterns: RegExp[] = [
    /^\.eslintrc(?:\..+)?$/i,
    /^\.prettierrc(?:\..+)?$/i,
    /^\.stylelintrc(?:\..+)?$/i,

    /^eslint\.config\..+$/i,
    /^postcss\.config\..+$/i,
    /^tailwind\.config\..+$/i,
    /^vite\.config\..+$/i,

    /^tsconfig(?:\..+)?\.json$/i,
    /^jsconfig(?:\..+)?\.json$/i
];

export function shouldHideFile(
    filename: string
): boolean {
    const normalizedFilename =
        filename.trim().toLowerCase();

    if (
        hiddenFilenames.has(
            normalizedFilename
        )
    ) {
        return true;
    }

    return hiddenPatterns.some(
        (pattern) =>
            pattern.test(
                normalizedFilename
            )
    );
}