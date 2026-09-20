import {
    createDefaultExtensionSettings
} from "./defaultSettings";

import {
    createDefaultFileLabelRules
} from "./defaultLabelRules";

import {
    createDefaultFileFilterRules
} from "./defaultFilterRules";

import type {
    ExtensionSettings,
    FileFilterRule,
    FileLabelRule
} from "./types";

const SETTINGS_STORAGE_KEY =
    "gev-extension-settings";

const LEGACY_FILTER_STORAGE_KEY =
    "gev-file-filter-enabled";

const DEFAULT_TEXT_COLOR =
    "#f0f6fc";

const DEFAULT_BACKGROUND_COLOR =
    "#30363d";

const DEFAULT_BORDER_COLOR =
    "#6e7681";

function getStoredSettings(
    value: unknown
): Partial<ExtensionSettings> {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return {};
    }

    return value as
        Partial<ExtensionSettings>;
}

function getBooleanValue(
    value: unknown,
    fallback: boolean
): boolean {
    return typeof value === "boolean"
        ? value
        : fallback;
}

function getStringValue(
    value: unknown,
    fallback: string
): string {
    if (
        typeof value !== "string" ||
        value.trim().length === 0
    ) {
        return fallback;
    }

    return value.trim();
}

function getColorValue(
    value: unknown,
    fallback: string
): string {
    if (
        typeof value !== "string" ||
        !/^#[0-9a-f]{6}$/i.test(value)
    ) {
        return fallback;
    }

    return value;
}

function getKeywords(
    value: unknown
): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return Array.from(
        new Set(
            value
                .filter(
                    (
                        keyword
                    ): keyword is string =>
                        typeof keyword ===
                        "string"
                )
                .map((keyword) =>
                    keyword
                        .trim()
                        .toLowerCase()
                )
                .filter(Boolean)
        )
    );
}

function sanitizeLabelRule(
    value: unknown,
    index: number
): FileLabelRule | null {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return null;
    }

    const rule =
        value as Partial<FileLabelRule>;

    return {
        id:
            getStringValue(
                rule.id,
                `custom-label-${index}`
            ),

        label:
            getStringValue(
                rule.label,
                "LABEL"
            ),

        keywords:
            getKeywords(
                rule.keywords
            ),

        textColor:
            getColorValue(
                rule.textColor,
                DEFAULT_TEXT_COLOR
            ),

        backgroundColor:
            getColorValue(
                rule.backgroundColor,
                DEFAULT_BACKGROUND_COLOR
            ),

        borderColor:
            getColorValue(
                rule.borderColor,
                DEFAULT_BORDER_COLOR
            ),

        enabled:
            getBooleanValue(
                rule.enabled,
                true
            )
    };
}

function getLabelRules(
    value: unknown
): FileLabelRule[] {
    if (!Array.isArray(value)) {
        return createDefaultFileLabelRules();
    }

    const ids =
        new Set<string>();

    const rules:
        FileLabelRule[] = [];

    value.forEach((item, index) => {
        const rule =
            sanitizeLabelRule(
                item,
                index
            );

        if (
            !rule ||
            ids.has(rule.id)
        ) {
            return;
        }

        ids.add(rule.id);
        rules.push(rule);
    });

    return rules;
}

function sanitizeFilterRule(
    value: unknown,
    index: number
): FileFilterRule | null {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return null;
    }

    const rule =
        value as Partial<FileFilterRule>;

    const pattern =
        getStringValue(
            rule.pattern,
            ""
        );

    if (!pattern) {
        return null;
    }

    return {
        id:
            getStringValue(
                rule.id,
                `custom-filter-${index}`
            ),

        pattern,

        enabled:
            getBooleanValue(
                rule.enabled,
                true
            )
    };
}

function getFilterRules(
    value: unknown
): FileFilterRule[] {
    /*
     * Migration from an older configuration:
     * If the rules haven't been saved yet,
     * we'll use the default list.
     */
    if (!Array.isArray(value)) {
        return createDefaultFileFilterRules();
    }

    const ids =
        new Set<string>();

    const rules:
        FileFilterRule[] = [];

    value.forEach((item, index) => {
        const rule =
            sanitizeFilterRule(
                item,
                index
            );

        if (
            !rule ||
            ids.has(rule.id)
        ) {
            return;
        }

        ids.add(rule.id);
        rules.push(rule);
    });

    return rules;
}

export async function getExtensionSettings():
    Promise<ExtensionSettings> {
    const defaults =
        createDefaultExtensionSettings();

    const stored =
        await chrome.storage.local.get([
            SETTINGS_STORAGE_KEY,
            LEGACY_FILTER_STORAGE_KEY
        ]);

    const settings =
        getStoredSettings(
            stored[SETTINGS_STORAGE_KEY]
        );

    return {
        fileIconsEnabled:
            getBooleanValue(
                settings.fileIconsEnabled,
                defaults.fileIconsEnabled
            ),

        fileLabelsEnabled:
            getBooleanValue(
                settings.fileLabelsEnabled,
                defaults.fileLabelsEnabled
            ),

        fileFilterEnabled:
            getBooleanValue(
                settings.fileFilterEnabled,
                getBooleanValue(
                    stored[
                        LEGACY_FILTER_STORAGE_KEY
                    ],
                    defaults.fileFilterEnabled
                )
            ),

        fileLabelRules:
            getLabelRules(
                settings.fileLabelRules
            ),

        fileFilterRules:
            getFilterRules(
                settings.fileFilterRules
            )
    };
}

export async function saveExtensionSettings(
    settings: ExtensionSettings
): Promise<void> {
    await chrome.storage.local.set({
        [SETTINGS_STORAGE_KEY]:
            settings
    });
}

/**
 * Observes changes to the settings.
 *
 * The returned function will detach the listener.
 */
export function observeExtensionSettings(
    callback: (
        settings: ExtensionSettings
    ) => void
): () => void {
    const listener = (
        changes: {
            [key: string]:
                chrome.storage.StorageChange;
        },
        areaName: string
    ): void => {
        if (areaName !== "local") {
            return;
        }

        if (
            !changes[
                SETTINGS_STORAGE_KEY
            ]
        ) {
            return;
        }

        void getExtensionSettings()
            .then(callback);
    };

    chrome.storage.onChanged.addListener(
        listener
    );

    return () => {
        chrome.storage.onChanged.removeListener(
            listener
        );
    };
}