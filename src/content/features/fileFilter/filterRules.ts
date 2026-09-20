import type {
    FileFilterRule
} from "../../../settings/types";

/**
 * Converts a simple glob pattern
 * into a regular expression.
 *
 * Supported:
 *
 * * -> any number of characters
 * ? -> exactly one character
 */
function globToRegExp(
    pattern: string
): RegExp {
    const escaped =
        pattern
            .replace(
                /[.+^${}()|[\]\\]/g,
                "\\$&"
            )
            .replace(
                /\*/g,
                ".*"
            )
            .replace(
                /\?/g,
                "."
            );

    return new RegExp(
        `^${escaped}$`,
        "i"
    );
}

function matchesRule(
    filename: string,
    rule: FileFilterRule
): boolean {
    if (!rule.enabled) {
        return false;
    }

    const pattern =
        rule.pattern.trim();

    if (!pattern) {
        return false;
    }

    return globToRegExp(
        pattern
    ).test(filename);
}

export function shouldHideFile(
    filename: string,
    rules: FileFilterRule[]
): boolean {
    const normalizedFilename =
        filename.trim();

    return rules.some(
        (rule) =>
            matchesRule(
                normalizedFilename,
                rule
            )
    );
}