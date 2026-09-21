import {
    OPEN_FILE_IN_VSCODE_MESSAGE
} from "../shared/contentConfigurationMessages";

import type {
    OpenFileInVsCodeErrorCode,
    OpenFileInVsCodeRequest,
    OpenFileInVsCodeResponse
} from "../shared/contentConfigurationMessages";

import {
    getRepositoryMappings
} from "../settings/repositoryMappingsStorage";

const MAX_MAPPING_ID_LENGTH = 200;
const MAX_REPOSITORY_LENGTH = 141;
const MAX_RELATIVE_PATH_LENGTH = 4096;
const MAX_LOCAL_PATH_LENGTH = 4096;

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null
    );
}

function isOpenFileRequest(
    value: unknown
): value is OpenFileInVsCodeRequest {
    if (
        !isRecord(value) ||
        value.type !==
            OPEN_FILE_IN_VSCODE_MESSAGE ||
        !isRecord(value.payload)
    ) {
        return false;
    }

    return (
        typeof value.payload.mappingId ===
            "string" &&
        typeof value.payload.repository ===
            "string" &&
        typeof value.payload.relativePath ===
            "string"
    );
}

function isGitHubContentSender(
    sender: chrome.runtime.MessageSender
): boolean {
    if (
        sender.id !== chrome.runtime.id ||
        typeof sender.url !== "string" ||
        typeof sender.tab?.id !== "number"
    ) {
        return false;
    }

    /*
     * The content script is only injected
     * into the top-level GitHub document.
     */
    if (sender.frameId !== 0) {
    return false;
    }

    try {
        const url =
            new URL(sender.url);

        return (
            url.protocol === "https:" &&
            url.hostname === "github.com"
        );
    } catch {
        return false;
    }
}

function getSenderRepository(
    sender: chrome.runtime.MessageSender
): string | null {
    if (
        typeof sender.url !== "string"
    ) {
        return null;
    }

    try {
        const url =
            new URL(sender.url);

        if (
            url.protocol !== "https:" ||
            url.hostname !== "github.com"
        ) {
            return null;
        }

        const parts =
            url.pathname
                .split("/")
                .filter(Boolean);

        if (parts.length < 2) {
            return null;
        }

        return `${parts[0]}/${parts[1]}`;
    } catch {
        return null;
    }
}

function validateMappingId(
    value: string
): string | null {
    const normalized =
        value.trim();

    if (
        normalized.length < 1 ||
        normalized.length >
            MAX_MAPPING_ID_LENGTH ||
        /[\u0000-\u001f\u007f]/.test(
            normalized
        )
    ) {
        return null;
    }

    return normalized;
}

function validateRepository(
    value: string
): string | null {
    const normalized =
        value.trim();

    if (
        normalized.length < 3 ||
        normalized.length >
            MAX_REPOSITORY_LENGTH
    ) {
        return null;
    }

    const parts =
        normalized.split("/");

    if (parts.length !== 2) {
        return null;
    }

    const [
        owner,
        repository
    ] = parts;

    if (
        owner.length < 1 ||
        owner.length > 39 ||
        repository.length < 1 ||
        repository.length > 100
    ) {
        return null;
    }

    if (
        !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/
            .test(owner)
    ) {
        return null;
    }

    if (
        !/^[a-zA-Z0-9._-]+$/
            .test(repository)
    ) {
        return null;
    }

    return `${owner}/${repository}`;
}

function validateRelativePath(
    value: string
): string | null {
    if (
        value.length < 1 ||
        value.length >
            MAX_RELATIVE_PATH_LENGTH ||
        value !== value.trim() ||
        value.startsWith("/") ||
        value.startsWith("\\") ||
        value.includes("\\") ||
        value.includes("\u0000") ||
        /[\u0001-\u001f\u007f]/.test(
            value
        ) ||
        /^[a-zA-Z][a-zA-Z0-9+.-]*:/
            .test(value)
    ) {
        return null;
    }

    const segments =
        value.split("/");

    if (
        segments.length === 0 ||
        segments.some(
            (segment) =>
                segment.length === 0 ||
                segment === "." ||
                segment === ".."
        )
    ) {
        return null;
    }

    return segments.join("/");
}

function validateLocalRoot(
    value: string
): string | null {
    const trimmed =
        value.trim();

    if (
        trimmed.length < 1 ||
        trimmed.length >
            MAX_LOCAL_PATH_LENGTH ||
        trimmed.includes("\u0000") ||
        /[\u0001-\u001f\u007f]/.test(
            trimmed
        )
    ) {
        return null;
    }

    const isWindowsDrive =
        /^[a-zA-Z]:[\\/]/.test(
            trimmed
        );

    const isWindowsUnc =
        /^\\\\[^\\/]+[\\/][^\\/]+/
            .test(trimmed);

    const isPosix =
        trimmed.startsWith("/") &&
        !trimmed.startsWith("//");

    if (
        !isWindowsDrive &&
        !isWindowsUnc &&
        !isPosix
    ) {
        return null;
    }

    let normalized =
        trimmed.replace(/\\/g, "/");

    const pathSegments =
        normalized
            .split("/")
            .filter(Boolean);

    if (
        pathSegments.some(
            (segment) =>
                segment === "." ||
                segment === ".."
        )
    ) {
        return null;
    }

    /*
     * Preserve the POSIX root directory.
     */
    if (normalized !== "/") {
        normalized =
            normalized.replace(
                /\/+$/,
                ""
            );
    }

    if (!normalized) {
        return null;
    }

    return normalized;
}

function encodePath(
    path: string
): string {
    return path
        .split("/")
        .map((segment) => {
            /*
             * Preserve a Windows drive identifier,
             * for example C:.
             */
            if (
                /^[a-zA-Z]:$/.test(
                    segment
                )
            ) {
                return segment;
            }

            return encodeURIComponent(
                segment
            );
        })
        .join("/");
}

function createVsCodeUrl(
    localRoot: string,
    relativePath: string
): string {
    const fullPath =
        localRoot === "/"
            ? `/${relativePath}`
            : `${localRoot}/${relativePath}`;

    return (
        "vscode://file/" +
        encodePath(fullPath)
    );
}

function failure(
    code: OpenFileInVsCodeErrorCode
): OpenFileInVsCodeResponse {
    return {
        success: false,

        error: {
            code
        }
    };
}

async function openFileInVsCode(
    message: OpenFileInVsCodeRequest,
    sender: chrome.runtime.MessageSender
): Promise<OpenFileInVsCodeResponse> {
    if (!isGitHubContentSender(sender)) {
        return failure(
            "INVALID_REQUEST"
        );
    }

    const mappingId =
        validateMappingId(
            message.payload.mappingId
        );

    const repository =
        validateRepository(
            message.payload.repository
        );

    const relativePath =
        validateRelativePath(
            message.payload.relativePath
        );

    const senderRepository =
        getSenderRepository(sender);

    if (
        !mappingId ||
        !repository ||
        !relativePath ||
        !senderRepository ||
        senderRepository.toLowerCase() !==
            repository.toLowerCase()
    ) {
        return failure(
            "INVALID_REQUEST"
        );
    }

    try {
        const mappings =
            await getRepositoryMappings();

        const mapping =
            mappings.find(
                (candidate) =>
                    candidate.enabled &&
                    candidate.id ===
                        mappingId
            );

        if (!mapping) {
            return failure(
                "MAPPING_NOT_FOUND"
            );
        }

        if (
            mapping.repository
                .trim()
                .toLowerCase() !==
            repository.toLowerCase()
        ) {
            return failure(
                "MAPPING_NOT_FOUND"
            );
        }

        const localRoot =
            validateLocalRoot(
                mapping.localPath
            );

        if (!localRoot) {
            return failure(
                "MAPPING_NOT_FOUND"
            );
        }

        const tabId =
            sender.tab?.id;

        if (
            typeof tabId !== "number"
        ) {
            return failure(
                "INVALID_REQUEST"
            );
        }

        /*
         * The local path only exists in this trusted
         * background context. It is never returned
         * to the content script or inserted into DOM.
         */
        const vscodeUrl =
            createVsCodeUrl(
                localRoot,
                relativePath
            );

        await chrome.tabs.update(
            tabId,
            {
                url:
                    vscodeUrl
            }
        );

        return {
            success: true
        };
    } catch {
        /*
         * Do not log the URL, local path,
         * mapping or request.
         */
        return failure(
            "OPEN_FAILED"
        );
    }
}

chrome.runtime.onMessage.addListener(
    (
        message: unknown,
        sender,
        sendResponse: (
            response:
                OpenFileInVsCodeResponse
        ) => void
    ) => {
        if (!isOpenFileRequest(message)) {
            return false;
        }

        void openFileInVsCode(
            message,
            sender
        ).then(sendResponse);

        return true;
    }
);