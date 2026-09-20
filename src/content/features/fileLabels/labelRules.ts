import type {
    FileLabelRule
} from "./types";

export const defaultFileLabelRules: FileLabelRule[] = [
    {
        id: "auth",
        label: "AUTH",

        keywords: [
            "auth",
            "authentication",
            "authorization",
            "login",
            "signin",
            "jwt",
            "oauth"
        ],

        textColor: "#d8b9ff",
        backgroundColor: "#3b1e5d",
        borderColor: "#8957e5"
    },

    {
        id: "security",
        label: "SECURITY",

        keywords: [
            "security",
            "secure",
            "password",
            "permission",
            "permissions",
            "role",
            "roles"
        ],

        textColor: "#ffb8b0",
        backgroundColor: "#5a1e1e",
        borderColor: "#f85149"
    },

    {
        id: "api",
        label: "API",

        keywords: [
            "api",
            "endpoint",
            "controller",
            "rest"
        ],

        textColor: "#a5d6ff",
        backgroundColor: "#17365d",
        borderColor: "#388bfd"
    },

    {
        id: "config",
        label: "CONFIG",

        keywords: [
            "config",
            "configuration",
            "settings",
            "properties"
        ],

        textColor: "#f8e3a1",
        backgroundColor: "#4d3b12",
        borderColor: "#d29922"
    },

    {
        id: "test",
        label: "TEST",

        keywords: [
            "test",
            "tests",
            "testing",
            "spec",
            "specs"
        ],

        textColor: "#aff5b4",
        backgroundColor: "#1b4721",
        borderColor: "#3fb950"
    }
];

/**
 * Splits the filename into individual words.
 *
 * Examples:
 *
 * JwtAuthenticationFilter.java
 * -> jwt, authentication, filter, java
 *
 * security-config.ts
 * -> security, config, ts
 *
 * api_controller.py
 * -> api, controller, py
 */
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
    filename: string
): FileLabelRule[] {
    const tokens =
        tokenizeFilename(filename);

    if (tokens.length === 0) {
        return [];
    }

    return defaultFileLabelRules.filter(
        (rule) => {
            return rule.keywords.some(
                (keyword) =>
                    tokens.includes(
                        keyword.toLowerCase()
                    )
            );
        }
    );
}