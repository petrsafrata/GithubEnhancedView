import type {
    FileLabelRule
} from "./types";

const DEFAULT_FILE_LABEL_RULES:
    FileLabelRule[] = [
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
            borderColor: "#8957e5",
            enabled: true
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
            borderColor: "#f85149",
            enabled: true
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
            borderColor: "#388bfd",
            enabled: true
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
            borderColor: "#d29922",
            enabled: true
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
            borderColor: "#3fb950",
            enabled: true
        }
    ];

export function createDefaultFileLabelRules():
    FileLabelRule[] {
    return DEFAULT_FILE_LABEL_RULES.map(
        (rule) => ({
            ...rule,
            keywords: [
                ...rule.keywords
            ]
        })
    );
}