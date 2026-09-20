import type {
    FileLabelRule
} from "../../../settings/types";

function tokenizeFilename(
    filename: string
): string[] {
    return filename
        /*
         * Splitting camelCase and PascalCase.
         */
        .replace(
            /([a-z0-9])([A-Z])/g,
            "$1 $2"
        )

        /*
         * Converting all separators to spaces.
         */
        .replace(
            /[^a-zA-Z0-9]+/g,
            " "
        )
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
}

/**
 * Returns all rules matching the filename.
 */
export function getMatchingFileLabelRules(
    filename: string,
    rules: FileLabelRule[]
): FileLabelRule[] {
    const tokens =
        tokenizeFilename(filename);

    if (tokens.length === 0) {
        return [];
    }

    return rules.filter((rule) => {
        if (!rule.enabled) {
            return false;
        }

        return rule.keywords.some(
            (keyword) =>
                tokens.includes(
                    keyword.toLowerCase()
                )
        );
    });
}