import {
    GET_REPOSITORY_TREE_MESSAGE
} from "../shared/githubApiMessages";

import type {
    GetRepositoryTreeRequest,
    GetRepositoryTreeResponse
} from "../shared/githubApiMessages";

import {
    CONTENT_CONFIGURATION_CHANGED_MESSAGE,
    GET_CONTENT_CONFIGURATION_MESSAGE,
    SET_FILE_FILTER_ENABLED_MESSAGE,
    OPEN_OPTIONS_PAGE_MESSAGE
} from "../shared/contentConfigurationMessages";

import type {
    ContentConfiguration,
    ContentConfigurationChangedMessage,
    GetContentConfigurationRequest,
    GetContentConfigurationResponse,
    SetFileFilterEnabledRequest,
    UpdateContentConfigurationResponse
} from "../shared/contentConfigurationMessages";

import {
    getRepositoryTree,
    validateTreeRequest
} from "./githubApiClient";

import {
    getExtensionSettings,
    saveExtensionSettings
} from "../settings/settingsStorage";

import {
    getRepositoryMappings
} from "../settings/repositoryMappingsStorage";

import "./githubTokenMessageHandler";

/**
 * Tab IDs that have requested the content configuration.
 *
 * They are stored only in the memory of the service worker.
 */
const registeredContentTabs =
    new Set<number>();

/**
 * We will make the session cache and persistent local settings
 * accessible only to trusted contexts:
 *
 * - background service worker,
 * - options page,
 * - other extension pages.
 *
 * Content script will lose direct access.
 */
void Promise.all([
    chrome.storage.session.setAccessLevel({
        accessLevel:
            "TRUSTED_CONTEXTS"
    }),

    chrome.storage.local.setAccessLevel({
        accessLevel:
            "TRUSTED_CONTEXTS"
    })
]).catch(() => undefined);

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null
    );
}

function isOwnExtensionSender(
    sender: chrome.runtime.MessageSender
): boolean {
    return (
        sender.id ===
        chrome.runtime.id
    );
}

function isGitHubContentSender(
    sender: chrome.runtime.MessageSender
): boolean {
    if (
        !isOwnExtensionSender(sender) ||
        typeof sender.url !== "string" ||
        typeof sender.tab?.id !== "number"
    ) {
        return false;
    }

    try {
        const url =
            new URL(sender.url);

        return (
            url.origin ===
            "https://github.com"
        );
    } catch {
        return false;
    }
}

function registerContentTab(
    sender: chrome.runtime.MessageSender
): void {
    const tabId =
        sender.tab?.id;

    if (typeof tabId === "number") {
        registeredContentTabs.add(
            tabId
        );
    }
}

function isTreeRequest(
    value: unknown
): value is GetRepositoryTreeRequest {
    if (!isRecord(value)) {
        return false;
    }

    const message =
        value as Partial<GetRepositoryTreeRequest>;

    return (
        message.type ===
            GET_REPOSITORY_TREE_MESSAGE &&
        isRecord(message.payload)
    );
}

function isConfigurationRequest(
    value: unknown
): value is GetContentConfigurationRequest {
    if (!isRecord(value)) {
        return false;
    }

    return (
        value.type ===
        GET_CONTENT_CONFIGURATION_MESSAGE
    );
}

function isFilterUpdateRequest(
    value: unknown
): value is SetFileFilterEnabledRequest {
    if (!isRecord(value)) {
        return false;
    }

    if (
        value.type !==
        SET_FILE_FILTER_ENABLED_MESSAGE ||
        !isRecord(value.payload)
    ) {
        return false;
    }

    return (
        typeof value.payload.enabled ===
        "boolean"
    );
}

function invalidTreeRequest():
    GetRepositoryTreeResponse {
    return {
        success: false,

        error: {
            code:
                "INVALID_REQUEST",

            message:
                "The API request was invalid."
        }
    };
}

function configurationFailure():
    GetContentConfigurationResponse {
    return {
        success: false
    };
}

function isOpenOptionsRequest(
    value: unknown
): boolean {
    return (
        isRecord(value) &&
        value.type ===
            OPEN_OPTIONS_PAGE_MESSAGE
    );
}

async function loadContentConfiguration():
    Promise<ContentConfiguration> {
    const [
        settings,
        repositoryMappings
    ] = await Promise.all([
        getExtensionSettings(),
        getRepositoryMappings()
    ]);

    /*
     * The object is explicitly constructed.
     * In the future, a token must not be added here.
     */
    return {
        settings,
        repositoryMappings
    };
}

async function handleConfigurationRequest():
    Promise<GetContentConfigurationResponse> {
    try {
        const configuration =
            await loadContentConfiguration();

        return {
            success: true,
            configuration
        };
    } catch {
        return configurationFailure();
    }
}

async function handleFilterUpdate(
    enabled: boolean
): Promise<UpdateContentConfigurationResponse> {
    try {
        const settings =
            await getExtensionSettings();

        await saveExtensionSettings({
            ...settings,

            fileFilterEnabled:
                enabled
        });

        return {
            success: true
        };
    } catch {
        return {
            success: false
        };
    }
}

async function notifyRegisteredContentTabs():
    Promise<void> {
    if (
        registeredContentTabs.size === 0
    ) {
        return;
    }

    let configuration:
        ContentConfiguration;

    try {
        configuration =
            await loadContentConfiguration();
    } catch {
        return;
    }

    const message:
        ContentConfigurationChangedMessage = {
        type:
            CONTENT_CONFIGURATION_CHANGED_MESSAGE,

        payload:
            configuration
    };

    for (
        const tabId
        of registeredContentTabs
    ) {
        void chrome.tabs
            .sendMessage(
                tabId,
                message
            )
            .catch(() => {
                /*
                 * The tab no longer exists or does not have
                 * an active content script.
                 */
                registeredContentTabs.delete(
                    tabId
                );
            });
    }
}

chrome.tabs.onRemoved.addListener(
    (tabId) => {
        registeredContentTabs.delete(
            tabId
        );
    }
);

chrome.storage.onChanged.addListener(
    (
        _changes,
        areaName
    ) => {
        if (areaName !== "local") {
            return;
        }

        /*
         * We only send the reloaded,
         * explicitly enabled configuration.
         *
         * Even when the token is saved in the future,
         * the token will not be included in the message.
         */
        void notifyRegisteredContentTabs();
    }
);

chrome.runtime.onMessage.addListener(
    (
        message: unknown,
        sender,
        sendResponse: (
            response: unknown
        ) => void
    ) => {
        if (!isOwnExtensionSender(sender)) {
            return false;
        }

        if (isTreeRequest(message)) {
            if (
                !isGitHubContentSender(
                    sender
                )
            ) {
                sendResponse(
                    invalidTreeRequest()
                );

                return false;
            }

            registerContentTab(
                sender
            );

            const request =
                validateTreeRequest(
                    message.payload.owner,
                    message.payload
                        .repository,
                    message.payload.ref
                );

            if (!request) {
                sendResponse(
                    invalidTreeRequest()
                );

                return false;
            }

            void getRepositoryTree(
                request
            ).then(sendResponse);

            return true;
        }

        if (
            isConfigurationRequest(
                message
            )
        ) {
            if (
                !isGitHubContentSender(
                    sender
                )
            ) {
                sendResponse(
                    configurationFailure()
                );

                return false;
            }

            registerContentTab(
                sender
            );

            void handleConfigurationRequest()
                .then(sendResponse);

            return true;
        }

        if (
            isFilterUpdateRequest(
                message
            )
        ) {
            if (
                !isGitHubContentSender(
                    sender
                )
            ) {
                sendResponse({
                    success: false
                });

                return false;
            }

            registerContentTab(
                sender
            );

            void handleFilterUpdate(
                message.payload.enabled
            ).then(sendResponse);

            return true;
        }

        if (
            isOpenOptionsRequest(
                message
            )
        ) {
            if (
                !isGitHubContentSender(
                    sender
                )
            ) {
                sendResponse({
                    success: false
                });
                return false;
            }

            void chrome.runtime
                .openOptionsPage()
                .then(() => {
                    sendResponse({
                        success: true
                    });
                })
                .catch(() => {
                    sendResponse({
                        success: false
                    });
                });

            return true;
        }
    return false;
    }
);