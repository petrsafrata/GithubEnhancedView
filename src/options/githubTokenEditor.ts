import {
    GET_GITHUB_TOKEN_STATUS_MESSAGE,
    REMOVE_GITHUB_TOKEN_MESSAGE,
    SAVE_GITHUB_TOKEN_MESSAGE
} from "../shared/githubTokenMessages";

import type {
    GitHubTokenErrorCode,
    GitHubTokenResponse,
    GitHubTokenStatus
} from "../shared/githubTokenMessages";

function getInput(
    id: string
): HTMLInputElement {
    const element =
        document.getElementById(id);

    if (
        !(element instanceof HTMLInputElement)
    ) {
        throw new Error(
            `Input "${id}" was not found.`
        );
    }

    return element;
}

function getButton(
    id: string
): HTMLButtonElement {
    const element =
        document.getElementById(id);

    if (
        !(element instanceof HTMLButtonElement)
    ) {
        throw new Error(
            `Button "${id}" was not found.`
        );
    }

    return element;
}

function getElement(
    id: string
): HTMLElement {
    const element =
        document.getElementById(id);

    if (
        !(element instanceof HTMLElement)
    ) {
        throw new Error(
            `Element "${id}" was not found.`
        );
    }

    return element;
}

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null
    );
}

function parseResponse(
    value: unknown
): GitHubTokenResponse | null {
    if (
        !isRecord(value) ||
        typeof value.success !== "boolean"
    ) {
        return null;
    }

    return value as unknown as
        GitHubTokenResponse;
}

function getErrorMessage(
    error: GitHubTokenErrorCode
): string {
    switch (error) {
        case "INVALID_FORMAT":
            return "Enter a valid GitHub token.";

        case "INVALID_TOKEN":
            return "GitHub rejected the token.";

        case "VALIDATION_FAILED":
            return "The token could not be verified.";

        case "STORAGE_ERROR":
            return "The token could not be stored.";
    }
}

export async function initializeGitHubTokenEditor():
    Promise<void> {
    const tokenInput =
        getInput("github-token");

    const saveButton =
        getButton("save-github-token");

    const removeButton =
        getButton("remove-github-token");

    const statusElement =
    getElement(
        "github-token-status"
    );

    let tokenStored = false;
    let busy = false;

    function updateButtons(): void {
        saveButton.disabled =
            busy ||
            tokenInput.value.trim()
                .length === 0;

        removeButton.disabled =
            busy ||
            !tokenStored;
    }

    function showStatus(
        message: string,
        type:
            | "success"
            | "error"
            | "muted"
    ): void {
        statusElement.textContent =
            message;

        statusElement.className =
            `github-token-status github-token-status--${type}`;
    }

    function applyStatus(
        status: GitHubTokenStatus,
        accountLogin?: string
    ): void {
        tokenStored =
            status.stored;

        if (!status.stored) {
            showStatus(
                "No GitHub token is stored.",
                "muted"
            );

            updateButtons();
            return;
        }

        const accountText =
            accountLogin
                ? ` for ${accountLogin}`
                : "";

        const maskText =
            status.maskedToken
                ? ` (${status.maskedToken})`
                : "";

        showStatus(
            `Token verified and stored${accountText}${maskText}.`,
            "success"
        );

        updateButtons();
    }

    async function sendMessage(
        message: unknown
    ): Promise<GitHubTokenResponse | null> {
        try {
            const response: unknown =
                await chrome.runtime.sendMessage(
                    message
                );

            return parseResponse(
                response
            );
        } catch {
            return null;
        }
    }

    async function loadStatus():
        Promise<void> {
        busy = true;
        updateButtons();

        const response =
            await sendMessage({
                type:
                    GET_GITHUB_TOKEN_STATUS_MESSAGE
            });

        busy = false;

        if (
            !response ||
            !response.success
        ) {
            showStatus(
                "Token status could not be loaded.",
                "error"
            );

            updateButtons();
            return;
        }

        applyStatus(
            response.status
        );
    }

    tokenInput.addEventListener(
        "input",
        () => {
            updateButtons();
        }
    );

    saveButton.addEventListener(
        "click",
        () => {
            void (async () => {
                let token =
                    tokenInput.value.trim();

                /*
                 * The token will not remain visible
                 * in the input field during the request.
                 */
                tokenInput.value = "";

                if (!token) {
                    showStatus(
                        "Enter a GitHub token.",
                        "error"
                    );

                    updateButtons();
                    return;
                }

                busy = true;

                showStatus(
                    "Verifying token with GitHub…",
                    "muted"
                );

                updateButtons();

                try {
                    const response =
                        await sendMessage({
                            type:
                                SAVE_GITHUB_TOKEN_MESSAGE,

                            payload: {
                                token
                            }
                        });

                    if (
                        !response ||
                        !response.success
                    ) {
                        showStatus(
                            response
                                ? getErrorMessage(
                                    response.error
                                )
                                : "The token could not be verified.",
                            "error"
                        );

                        return;
                    }

                    applyStatus(
                        response.status,
                        response.accountLogin
                    );
                } finally {
                    /*
                     * Remove the local reference
                     * as soon as the operation is complete.
                     */
                    token = "";
                    busy = false;
                    updateButtons();
                }
            })();
        }
    );

    removeButton.addEventListener(
        "click",
        () => {
            if (
                !window.confirm(
                    "Remove the stored GitHub token?"
                )
            ) {
                return;
            }

            void (async () => {
                busy = true;

                showStatus(
                    "Removing token…",
                    "muted"
                );

                updateButtons();

                const response =
                    await sendMessage({
                        type:
                            REMOVE_GITHUB_TOKEN_MESSAGE
                    });

                busy = false;

                if (
                    !response ||
                    !response.success
                ) {
                    showStatus(
                        "The token could not be removed.",
                        "error"
                    );

                    updateButtons();
                    return;
                }

                applyStatus(
                    response.status
                );
            })();
        }
    );

    await loadStatus();
}