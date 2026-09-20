import {
    DEFAULT_EXTENSION_SETTINGS
} from "./defaultSettings";

import type {
    ExtensionSettings
} from "./types";

const SETTINGS_STORAGE_KEY =
    "gev-extension-settings";

const LEGACY_FILTER_STORAGE_KEY =
    "gev-file-filter-enabled";

function getStoredSettings(
    value: unknown
): Partial<ExtensionSettings> {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return {};
    }

    return value as Partial<ExtensionSettings>;
}

function getBooleanValue(
    value: unknown,
    fallback: boolean
): boolean {
    return typeof value === "boolean"
        ? value
        : fallback;
}

/**
 * Loads the complete settings.
 *
 * Missing values will be filled in
 * from the default configuration.
 */
export async function getExtensionSettings():
    Promise<ExtensionSettings> {
    const stored =
        await chrome.storage.local.get([
            SETTINGS_STORAGE_KEY,
            LEGACY_FILTER_STORAGE_KEY
        ]);

    const settings =
        getStoredSettings(
            stored[SETTINGS_STORAGE_KEY]
        );

    const legacyFilterValue =
        stored[
            LEGACY_FILTER_STORAGE_KEY
        ];

    return {
        fileIconsEnabled:
            getBooleanValue(
                settings.fileIconsEnabled,
                DEFAULT_EXTENSION_SETTINGS
                    .fileIconsEnabled
            ),

        fileLabelsEnabled:
            getBooleanValue(
                settings.fileLabelsEnabled,
                DEFAULT_EXTENSION_SETTINGS
                    .fileLabelsEnabled
            ),

        fileFilterEnabled:
            getBooleanValue(
                settings.fileFilterEnabled,
                getBooleanValue(
                    legacyFilterValue,
                    DEFAULT_EXTENSION_SETTINGS
                        .fileFilterEnabled
                )
            )
    };
}

/**
 * Saves the complete settings.
 */
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