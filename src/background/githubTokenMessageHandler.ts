import {
    GET_GITHUB_TOKEN_STATUS_MESSAGE,
    REMOVE_GITHUB_TOKEN_MESSAGE,
    SAVE_GITHUB_TOKEN_MESSAGE
} from "../shared/githubTokenMessages";

import type {
    GitHubTokenResponse,
    SaveGitHubTokenRequest
} from "../shared/githubTokenMessages";

import {
    getGitHubTokenStatus,
    normalizeGitHubToken,
    removeGitHubToken,
    saveGitHubToken
} from "./githubTokenStorage";

import {
    validateGitHubToken
} from "./githubTokenValidator";

import {
    clearRepositoryTreeCache
} from "./githubTreeCache";

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null
    );
}

function isOptionsSender(
    sender: chrome.runtime.MessageSender
): boolean {
    if (
        sender.id !== chrome.runtime.id ||
        typeof sender.url !== "string"
    ) {
        return false;
    }

    try {
        const senderUrl =
            new URL(sender.url);

        const optionsUrl =
            new URL(
                chrome.runtime.getURL(
                    "dist/options.html"
                )
            );

        return (
            senderUrl.origin ===
                optionsUrl.origin &&
            senderUrl.pathname ===
                optionsUrl.pathname
        );
    } catch {
        return false;
    }
}

function isTokenMessage(
    value: unknown
): boolean {
    if (!isRecord(value)) {
        return false;
    }

    return (
        value.type ===
            GET_GITHUB_TOKEN_STATUS_MESSAGE ||
        value.type ===
            SAVE_GITHUB_TOKEN_MESSAGE ||
        value.type ===
            REMOVE_GITHUB_TOKEN_MESSAGE
    );
}

function isSaveRequest(
    value: unknown
): value is SaveGitHubTokenRequest {
    if (!isRecord(value)) {
        return false;
    }

    if (
        value.type !==
            SAVE_GITHUB_TOKEN_MESSAGE ||
        !isRecord(value.payload)
    ) {
        return false;
    }

    return (
        typeof value.payload.token ===
        "string"
    );
}

function failure(
    error:
        | "INVALID_FORMAT"
        | "INVALID_TOKEN"
        | "VALIDATION_FAILED"
        | "STORAGE_ERROR"
): GitHubTokenResponse {
    return {
        success: false,
        error
    };
}

async function getStatus():
    Promise<GitHubTokenResponse> {
    try {
        return {
            success: true,

            status:
                await getGitHubTokenStatus()
        };
    } catch {
        return failure(
            "STORAGE_ERROR"
        );
    }
}

async function saveToken(
    message: SaveGitHubTokenRequest
): Promise<GitHubTokenResponse> {
    const token =
        normalizeGitHubToken(
            message.payload.token
        );

    if (!token) {
        return failure(
            "INVALID_FORMAT"
        );
    }

    const validation =
        await validateGitHubToken(
            token
        );

    if (!validation.valid) {
        return failure(
            validation.reason
        );
    }

    try {
        const saved =
            await saveGitHubToken(
                token
            );

        if (!saved) {
            return failure(
                "INVALID_FORMAT"
            );
        }

        await clearRepositoryTreeCache();

        return {
            success: true,

            status:
                await getGitHubTokenStatus(),

            accountLogin:
                validation.accountLogin
        };
    } catch {
        return failure(
            "STORAGE_ERROR"
        );
    }
}

async function removeToken():
    Promise<GitHubTokenResponse> {
    try {
        await removeGitHubToken();
        await clearRepositoryTreeCache();

        return {
            success: true,

            status: {
                stored: false
            }
        };
    } catch {
        return failure(
            "STORAGE_ERROR"
        );
    }
}

chrome.runtime.onMessage.addListener(
    (
        message: unknown,
        sender,
        sendResponse: (
            response:
                GitHubTokenResponse
        ) => void
    ) => {
        if (!isTokenMessage(message)) {
            return false;
        }

        /*
         * Token operations may only be called
         * from the options page, never from a content script.
         */
        if (!isOptionsSender(sender)) {
            sendResponse(
                failure(
                    "STORAGE_ERROR"
                )
            );

            return false;
        }

        if (
            isRecord(message) &&
            message.type ===
                GET_GITHUB_TOKEN_STATUS_MESSAGE
        ) {
            void getStatus()
                .then(sendResponse);

            return true;
        }

        if (isSaveRequest(message)) {
            void saveToken(message)
                .then(sendResponse);

            return true;
        }

        if (
            isRecord(message) &&
            message.type ===
                REMOVE_GITHUB_TOKEN_MESSAGE
        ) {
            void removeToken()
                .then(sendResponse);

            return true;
        }

        sendResponse(
            failure(
                "INVALID_FORMAT"
            )
        );

        return false;
    }
);