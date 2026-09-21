import {
    CONTENT_CONFIGURATION_CHANGED_MESSAGE,
    GET_CONTENT_CONFIGURATION_MESSAGE,
    SET_FILE_FILTER_ENABLED_MESSAGE
} from "../../shared/contentConfigurationMessages";

import type {
    ContentConfiguration,
    ContentConfigurationChangedMessage,
    ContentRepositoryMapping
} from "../../shared/contentConfigurationMessages";

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null
    );
}

function parseRepositoryMapping(
    value: unknown
): ContentRepositoryMapping | null {
    if (!isRecord(value)) {
        return null;
    }

    if (
        typeof value.id !== "string" ||
        typeof value.repository !==
            "string" ||
        typeof value.enabled !==
            "boolean"
    ) {
        return null;
    }

    const id =
        value.id.trim();

    const repository =
        value.repository.trim();

    if (
        !id ||
        !repository ||
        id.length > 200 ||
        repository.length > 141
    ) {
        return null;
    }

    /*
     * Explicit construction prevents any accidental
     * localPath or other future private property
     * from being retained in the content script.
     */
    return {
        id,
        repository,
        enabled:
            value.enabled
    };
}

function parseConfiguration(
    value: unknown
): ContentConfiguration | null {
    if (!isRecord(value)) {
        return null;
    }

    if (
        !isRecord(value.settings) ||
        !Array.isArray(
            value.repositoryMappings
        )
    ) {
        return null;
    }

    const repositoryMappings:
        ContentRepositoryMapping[] = [];

    for (
        const item
        of value.repositoryMappings
    ) {
        const mapping =
            parseRepositoryMapping(
                item
            );

        if (!mapping) {
            return null;
        }

        repositoryMappings.push(
            mapping
        );
    }

    return {
        settings:
            value.settings as unknown as
                ContentConfiguration["settings"],

        repositoryMappings
    };
}

export async function getContentConfiguration():
    Promise<ContentConfiguration | null> {
    try {
        const response: unknown =
            await chrome.runtime.sendMessage({
                type:
                    GET_CONTENT_CONFIGURATION_MESSAGE
            });

        if (
            !isRecord(response) ||
            response.success !== true
        ) {
            return null;
        }

        return parseConfiguration(
            response.configuration
        );
    } catch {
        /*
         * The error is intentionally not logged.
         * The content script will use default settings.
         */
        return null;
    }
}

export async function setFileFilterEnabled(
    enabled: boolean
): Promise<boolean> {
    try {
        const response: unknown =
            await chrome.runtime.sendMessage({
                type:
                    SET_FILE_FILTER_ENABLED_MESSAGE,

                payload: {
                    enabled
                }
            });

        return (
            isRecord(response) &&
            response.success === true
        );
    } catch {
        return false;
    }
}

export function observeContentConfiguration(
    callback: (
        configuration:
            ContentConfiguration
    ) => void
): () => void {
    const listener = (
        message: unknown
    ): void => {
        if (!isRecord(message)) {
            return;
        }

        if (
            message.type !==
                CONTENT_CONFIGURATION_CHANGED_MESSAGE
        ) {
            return;
        }

        const changedMessage =
            message as unknown as
                ContentConfigurationChangedMessage;

        const configuration =
            parseConfiguration(
                changedMessage.payload
            );

        if (!configuration) {
            return;
        }

        callback(configuration);
    };

    chrome.runtime.onMessage.addListener(
        listener
    );

    return () => {
        chrome.runtime.onMessage.removeListener(
            listener
        );
    };
}