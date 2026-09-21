import type {
    RepositoryItem
} from "../../github/types";

import {
    getRelativeFilePath,
    getRepositoryContext
} from "../../github/repositoryContext";

import {
    GET_REPOSITORY_TREE_MESSAGE
} from "../../../shared/githubApiMessages";

import type {
    GetRepositoryTreeRequest,
    GitHubApiErrorCode,
    GitHubFileSize
} from "../../../shared/githubApiMessages";

import {
    OPEN_OPTIONS_PAGE_MESSAGE
} from "../../../shared/contentConfigurationMessages";

const SIZE_ATTRIBUTE =
    "data-gev-file-size";

const SIZE_CLASS =
    "gev-file-size";

const SIZE_CELL_CLASS =
    "gev-file-size-cell";

const SIZE_WITH_LABELS_CLASS =
    "gev-file-size-cell-with-labels";

const API_NOTICE_ATTRIBUTE =
    "data-gev-api-notice";

const API_NOTICE_CLASS =
    "gev-api-notice";

const FAILED_REQUEST_COOLDOWN_MS =
    60_000;

type LoadStatus =
    | "idle"
    | "loading"
    | "loaded"
    | "failed";

type ApiNoticeType =
    | "warning"
    | "error";

interface ParsedSuccessfulResponse {
    files: GitHubFileSize[];
    truncated: boolean;
}

interface ApiNoticeDefinition {
    id: string;
    type: ApiNoticeType;
    message: string;
    showSettingsButton: boolean;
}

let currentKey:
    string | null = null;

let currentRef:
    string | null = null;

let status:
    LoadStatus = "idle";

let retryAfter = 0;

let dismissedNoticeId:
    string | null = null;

let fileSizes =
    new Map<string, number>();

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null
    );
}

function isValidFileSize(
    value: unknown
): value is GitHubFileSize {
    if (!isRecord(value)) {
        return false;
    }

    return (
        typeof value.path === "string" &&
        value.path.length > 0 &&
        value.path.length <= 4096 &&
        typeof value.size === "number" &&
        Number.isSafeInteger(
            value.size
        ) &&
        value.size >= 0
    );
}

function parseSuccessfulResponse(
    value: unknown
): ParsedSuccessfulResponse | null {
    if (!isRecord(value)) {
        return null;
    }

    if (
        value.success !== true ||
        !Array.isArray(value.files) ||
        typeof value.truncated !==
            "boolean"
    ) {
        return null;
    }

    const files:
        GitHubFileSize[] = [];

    for (
        const item of value.files
    ) {
        if (isValidFileSize(item)) {
            files.push(item);
        }
    }

    return {
        files,
        truncated:
            value.truncated
    };
}

function parseErrorCode(
    value: unknown
): GitHubApiErrorCode | null {
    if (!isRecord(value)) {
        return null;
    }

    if (
        value.success !== false ||
        !isRecord(value.error)
    ) {
        return null;
    }

    const code =
        value.error.code;

    switch (code) {
        case "INVALID_REQUEST":
        case "NOT_FOUND":
        case "RATE_LIMITED":
        case "UNAUTHORIZED":
        case "GITHUB_API_ERROR":
        case "INVALID_RESPONSE":
        case "NETWORK_ERROR":
            return code;

        default:
            return null;
    }
}

function getFailureNotice(
    code: GitHubApiErrorCode | null
): ApiNoticeDefinition {
    switch (code) {
        case "UNAUTHORIZED":
            return {
                id:
                    "unauthorized",

                type:
                    "error",

                message:
                    "GitHub authentication failed. Verify or replace the token in the extension settings.",

                showSettingsButton:
                    true
            };

        case "RATE_LIMITED":
            return {
                id:
                    "rate-limited",

                type:
                    "warning",

                message:
                    "The GitHub API rate limit was reached. File sizes are temporarily unavailable.",

                showSettingsButton:
                    true
            };

        case "NOT_FOUND":
            return {
                id:
                    "not-found",

                type:
                    "warning",

                message:
                    "Repository metadata is unavailable. A token may be required for this repository.",

                showSettingsButton:
                    true
            };

        case "NETWORK_ERROR":
            return {
                id:
                    "network-error",

                type:
                    "error",

                message:
                    "The GitHub API could not be reached. File sizes are temporarily unavailable.",

                showSettingsButton:
                    false
            };

        case "INVALID_RESPONSE":
            return {
                id:
                    "invalid-response",

                type:
                    "error",

                message:
                    "GitHub returned an unsupported API response.",

                showSettingsButton:
                    false
            };

        case "INVALID_REQUEST":
            return {
                id:
                    "invalid-request",

                type:
                    "error",

                message:
                    "The repository metadata request was invalid.",

                showSettingsButton:
                    false
            };

        case "GITHUB_API_ERROR":
        default:
            return {
                id:
                    "github-api-error",

                type:
                    "error",

                message:
                    "GitHub could not provide repository metadata.",

                showSettingsButton:
                    false
            };
    }
}

function removeApiNotice(
    clearDismissedState = false
): void {
    document
        .querySelectorAll<HTMLElement>(
            `[${API_NOTICE_ATTRIBUTE}="true"]`
        )
        .forEach((element) => {
            element.remove();
        });

    if (clearDismissedState) {
        dismissedNoticeId =
            null;
    }
}

function openExtensionSettings():
    void {
    /*
     * openOptionsPage is not available in the content script.
     * Safely delegate the opening to the background worker.
     */
    void chrome.runtime
        .sendMessage({
            type:
                OPEN_OPTIONS_PAGE_MESSAGE
        })
        .catch(() => undefined);
}

function showApiNotice(
    definition: ApiNoticeDefinition
): void {
    const noticeId =
        `${currentKey ?? "unknown"}:${definition.id}`;

    if (
        dismissedNoticeId ===
        noticeId
    ) {
        return;
    }

    removeApiNotice();

    const notice =
        document.createElement("div");

    notice.className =
        `${API_NOTICE_CLASS} ${API_NOTICE_CLASS}--${definition.type}`;

    notice.setAttribute(
        API_NOTICE_ATTRIBUTE,
        "true"
    );

    notice.setAttribute(
        "role",
        definition.type === "error"
            ? "alert"
            : "status"
    );

    notice.setAttribute(
        "aria-live",
        "polite"
    );

    const icon =
        document.createElement("span");

    icon.className =
        `${API_NOTICE_CLASS}__icon`;

    icon.textContent =
        "!";

    icon.setAttribute(
        "aria-hidden",
        "true"
    );

    const message =
        document.createElement("span");

    message.className =
        `${API_NOTICE_CLASS}__message`;

    /*
     * Never insert API data via innerHTML.
     */
    message.textContent =
        definition.message;

    const actions =
        document.createElement("span");

    actions.className =
        `${API_NOTICE_CLASS}__actions`;

    if (
        definition.showSettingsButton
    ) {
        const settingsButton =
            document.createElement(
                "button"
            );

        settingsButton.type =
            "button";

        settingsButton.className =
            `${API_NOTICE_CLASS}__settings`;

        settingsButton.textContent =
            "Settings";

        settingsButton.addEventListener(
            "click",
            openExtensionSettings
        );

        actions.appendChild(
            settingsButton
        );
    }

    const closeButton =
        document.createElement("button");

    closeButton.type =
        "button";

    closeButton.className =
        `${API_NOTICE_CLASS}__close`;

    closeButton.textContent =
        "×";

    closeButton.setAttribute(
        "aria-label",
        "Dismiss GitHub API notification"
    );

    closeButton.addEventListener(
        "click",
        () => {
            dismissedNoticeId =
                noticeId;

            notice.remove();
        }
    );

    actions.appendChild(
        closeButton
    );

    notice.append(
        icon,
        message,
        actions
    );

    document.body.appendChild(
        notice
    );
}

function createRequestKey(
    owner: string,
    repository: string,
    ref: string
): string {
    return [
        owner.toLowerCase(),
        repository.toLowerCase(),
        ref
    ].join("/");
}

function formatFileSize(
    bytes: number
): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    const units = [
        "KB",
        "MB",
        "GB"
    ];

    let value =
        bytes / 1024;

    let unitIndex = 0;

    while (
        value >= 1024 &&
        unitIndex <
            units.length - 1
    ) {
        value /= 1024;
        unitIndex++;
    }

    const digits =
        value < 10
            ? 1
            : 0;

    return `${value.toFixed(digits)} ${units[unitIndex]}`;
}

function formatExactBytes(
    bytes: number
): string {
    return `${bytes.toLocaleString()} bytes`;
}

function findMainFileLinks(
    item: RepositoryItem
): HTMLAnchorElement[] {
    const links =
        document.querySelectorAll<HTMLAnchorElement>(
            'a[href*="/blob/"]'
        );

    return Array.from(links).filter(
        (link) => {
            if (
                link.closest(
                    '[data-testid="repos-file-tree-container"]'
                )
            ) {
                return false;
            }

            return link.href === item.href;
        }
    );
}

function createSizeElement(
    bytes: number
): HTMLSpanElement {
    const element =
        document.createElement("span");

    element.className =
        SIZE_CLASS;

    element.textContent =
        formatFileSize(bytes);

    element.title =
        formatExactBytes(bytes);

    element.setAttribute(
        SIZE_ATTRIBUTE,
        "true"
    );

    element.setAttribute(
        "aria-label",
        `File size: ${formatExactBytes(bytes)}`
    );

    return element;
}

function renderFileSizes(
    items: RepositoryItem[]
): number {
    if (!currentRef) {
        return 0;
    }

    let appliedCount = 0;

    const files =
        items.filter(
            (item) =>
                item.type === "file"
        );

    files.forEach((item) => {
        const relativePath =
            getRelativeFilePath(
                item.href,
                currentRef as string
            );

        if (!relativePath) {
            return;
        }

        const size =
            fileSizes.get(
                relativePath
            );

        if (size === undefined) {
            return;
        }

        const links =
            findMainFileLinks(item);

        links.forEach((link) => {
            const cell =
                link.closest<HTMLElement>(
                    "td"
                );

            if (!cell) {
                return;
            }

            const hasLabels =
                Boolean(
                    cell.querySelector(
                        ':scope > [data-gev-file-labels="true"]'
                    )
                );

            cell.classList.add(
                SIZE_CELL_CLASS
            );

            cell.classList.toggle(
                SIZE_WITH_LABELS_CLASS,
                hasLabels
            );

            const existing =
                cell.querySelector<HTMLElement>(
                    `:scope > [${SIZE_ATTRIBUTE}="true"]`
                );

            if (existing) {
                existing.textContent =
                    formatFileSize(size);

                existing.title =
                    formatExactBytes(size);

                return;
            }

            cell.appendChild(
                createSizeElement(
                    size
                )
            );

            appliedCount++;
        });
    });

    return appliedCount;
}

export function removeFileSizes():
    void {
    document
        .querySelectorAll<HTMLElement>(
            `[${SIZE_ATTRIBUTE}="true"]`
        )
        .forEach((element) => {
            element.remove();
        });

    document
        .querySelectorAll<HTMLElement>(
            `.${SIZE_CELL_CLASS}`
        )
        .forEach((cell) => {
            cell.classList.remove(
                SIZE_CELL_CLASS,
                SIZE_WITH_LABELS_CLASS
            );
        });
}

function resetState(
    key: string,
    ref: string
): void {
    removeFileSizes();
    removeApiNotice(true);

    currentKey =
        key;

    currentRef =
        ref;

    status =
        "idle";

    retryAfter = 0;

    fileSizes =
        new Map<string, number>();
}

function markRequestAsFailed(
    rawResponse: unknown
): void {
    status =
        "failed";

    retryAfter =
        Date.now() +
        FAILED_REQUEST_COOLDOWN_MS;

    showApiNotice(
        getFailureNotice(
            parseErrorCode(
                rawResponse
            )
        )
    );
}

async function requestFileSizes(
    request:
        GetRepositoryTreeRequest,
    requestKey: string,
    items: RepositoryItem[]
): Promise<void> {
    status =
        "loading";

    try {
        const rawResponse: unknown =
            await chrome.runtime
                .sendMessage(request);

        /*
         * During the request, the user might
         * have navigated to a different repository.
         */
        if (
            currentKey !== requestKey
        ) {
            return;
        }

        const response =
            parseSuccessfulResponse(
                rawResponse
            );

        if (!response) {
            markRequestAsFailed(
                rawResponse
            );

            return;
        }

        fileSizes =
            new Map(
                response.files.map(
                    (file) => [
                        file.path,
                        file.size
                    ]
                )
            );

        status =
            "loaded";

        renderFileSizes(items);

        if (response.truncated) {
            showApiNotice({
                id:
                    "truncated-tree",

                type:
                    "warning",

                message:
                    "GitHub returned a partial repository tree. Some file sizes may be missing.",

                showSettingsButton:
                    false
            });
        } else {
            removeApiNotice(true);
        }
    } catch {
        /*
         * Do not log the request, URL,
         * response, or any authorization
         * data.
         */
        if (
            currentKey === requestKey
        ) {
            status =
                "failed";

            retryAfter =
                Date.now() +
                FAILED_REQUEST_COOLDOWN_MS;

            showApiNotice({
                id:
                    "runtime-error",

                type:
                    "error",

                message:
                    "The extension could not load file sizes.",

                showSettingsButton:
                    false
            });
        }
    }
}

export function applyFileSizes(
    items: RepositoryItem[]
): void {
    const context =
        getRepositoryContext(items);

    if (!context) {
        removeFileSizes();
        removeApiNotice(true);

        return;
    }

    const requestKey =
        createRequestKey(
            context.owner,
            context.repository,
            context.ref
        );

    if (
        currentKey !== requestKey
    ) {
        resetState(
            requestKey,
            context.ref
        );
    }

    if (status === "loaded") {
        renderFileSizes(items);
        return;
    }

    if (status === "loading") {
        return;
    }

    if (
        status === "failed" &&
        Date.now() < retryAfter
    ) {
        return;
    }

    const request:
        GetRepositoryTreeRequest = {
            type:
                GET_REPOSITORY_TREE_MESSAGE,

            payload: {
                owner:
                    context.owner,

                repository:
                    context.repository,

                ref:
                    context.ref
            }
        };

    void requestFileSizes(
        request,
        requestKey,
        items
    );
}