import type {
    GetRepositoryTreeResponse,
    GitHubApiErrorCode,
    GitHubFileSize
} from "../shared/githubApiMessages";

import {
    createRepositoryTreeCacheKey,
    getCachedRepositoryTree,
    setCachedRepositoryTree
} from "./githubTreeCache";

import {
    fetchGitHubApi,
    GITHUB_API_ORIGIN
} from "./githubApiRequest";

import {
    getGitHubAuthentication
} from "./githubTokenStorage";

const REQUEST_TIMEOUT_MS =
    15_000;

interface ValidatedRequest {
    owner: string;
    repository: string;
    ref: string;
}

interface GitHubTreeEntry {
    path?: unknown;
    type?: unknown;
    size?: unknown;
}

interface GitHubTreeResponse {
    tree?: unknown;
    truncated?: unknown;
}

/**
 * Prevents multiple concurrent requests
 * for the same repository and Git ref.
 */
const inFlightRequests =
    new Map<
        string,
        Promise<GetRepositoryTreeResponse>
    >();

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null
    );
}

function isValidOwner(
    value: string
): boolean {
    return (
        value.length >= 1 &&
        value.length <= 39 &&
        /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/
            .test(value)
    );
}

function isValidRepository(
    value: string
): boolean {
    return (
        value.length >= 1 &&
        value.length <= 100 &&
        /^[a-zA-Z0-9._-]+$/
            .test(value)
    );
}

function isValidRef(
    value: string
): boolean {
    if (
        value.length < 1 ||
        value.length > 255
    ) {
        return false;
    }

    if (
        !/^[a-zA-Z0-9._/-]+$/
            .test(value)
    ) {
        return false;
    }

    if (
        value.startsWith("/") ||
        value.endsWith("/") ||
        value.includes("//") ||
        value.includes("..") ||
        value.includes("@{") ||
        value.endsWith(".lock")
    ) {
        return false;
    }

    return true;
}

export function validateTreeRequest(
    ownerValue: unknown,
    repositoryValue: unknown,
    refValue: unknown
): ValidatedRequest | null {
    if (
        typeof ownerValue !== "string" ||
        typeof repositoryValue !== "string" ||
        typeof refValue !== "string"
    ) {
        return null;
    }

    const owner =
        ownerValue.trim();

    const repository =
        repositoryValue.trim();

    const ref =
        refValue.trim();

    if (
        !isValidOwner(owner) ||
        !isValidRepository(repository) ||
        !isValidRef(ref)
    ) {
        return null;
    }

    return {
        owner,
        repository,
        ref
    };
}

function parseHeaderNumber(
    value: string | null
): number | undefined {
    if (!value) {
        return undefined;
    }

    const parsed =
        Number.parseInt(
            value,
            10
        );

    return Number.isFinite(parsed)
        ? parsed
        : undefined;
}

function createFailure(
    code: GitHubApiErrorCode,
    message: string
): GetRepositoryTreeResponse {
    return {
        success: false,

        error: {
            code,
            message
        }
    };
}

function getErrorResponse(
    status: number
): GetRepositoryTreeResponse {
    switch (status) {
        case 401:
            return createFailure(
                "UNAUTHORIZED",
                "GitHub rejected the request."
            );

        case 403:
        case 429:
            return createFailure(
                "RATE_LIMITED",
                "GitHub API rate limit was reached."
            );

        case 404:
            return createFailure(
                "NOT_FOUND",
                "The repository or Git reference was not found."
            );

        default:
            return createFailure(
                "GITHUB_API_ERROR",
                `GitHub API returned status ${status}.`
            );
    }
}

function parseTreeEntry(
    value: unknown
): GitHubFileSize | null {
    if (!isRecord(value)) {
        return null;
    }

    const entry =
        value as GitHubTreeEntry;

    if (
        entry.type !== "blob" ||
        typeof entry.path !== "string" ||
        typeof entry.size !== "number"
    ) {
        return null;
    }

    if (
        entry.path.length === 0 ||
        entry.path.length > 4096 ||
        !Number.isSafeInteger(
            entry.size
        ) ||
        entry.size < 0
    ) {
        return null;
    }

    return {
        path:
            entry.path,

        size:
            entry.size
    };
}

function parseTreeResponse(
    value: unknown
): {
    files: GitHubFileSize[];
    truncated: boolean;
} | null {
    if (!isRecord(value)) {
        return null;
    }

    const response =
        value as GitHubTreeResponse;

    if (!Array.isArray(response.tree)) {
        return null;
    }

    const files:
        GitHubFileSize[] = [];

    for (
        const item of response.tree
    ) {
        const file =
            parseTreeEntry(item);

        if (file) {
            files.push(file);
        }
    }

    return {
        files,

        truncated:
            response.truncated === true
    };
}

function createEndpoint(
    request: ValidatedRequest
): URL {
    const owner =
        encodeURIComponent(
            request.owner
        );

    const repository =
        encodeURIComponent(
            request.repository
        );

    const ref =
        encodeURIComponent(
            request.ref
        );

    const endpoint =
        new URL(
            `/repos/${owner}/${repository}/git/trees/${ref}`,
            GITHUB_API_ORIGIN
        );

    endpoint.searchParams.set(
        "recursive",
        "1"
    );

    if (
        endpoint.origin !==
        GITHUB_API_ORIGIN
    ) {
        throw new Error(
            "Invalid GitHub API origin."
        );
    }

    return endpoint;
}

async function requestRepositoryTree(
    request: ValidatedRequest,
    authenticationToken: string | null
): Promise<GetRepositoryTreeResponse> {
    const controller =
        new AbortController();

    const timeoutId =
        setTimeout(
            () => {
                controller.abort();
            },
            REQUEST_TIMEOUT_MS
        );

    try {
        const endpoint =
            createEndpoint(request);

        const response =
            await fetchGitHubApi(
                endpoint,
                {
                    authenticationToken,
                    signal: controller.signal
                }
            );

        if (!response.ok) {
            return getErrorResponse(
                response.status
            );
        }

        const rawData: unknown =
            await response.json();

        const parsed =
            parseTreeResponse(
                rawData
            );

        if (!parsed) {
            return createFailure(
                "INVALID_RESPONSE",
                "GitHub returned an invalid tree response."
            );
        }

        return {
            success: true,

            files:
                parsed.files,

            truncated:
                parsed.truncated,

            rateLimit: {
                remaining:
                    parseHeaderNumber(
                        response.headers.get(
                            "x-ratelimit-remaining"
                        )
                    ),

                resetAt:
                    parseHeaderNumber(
                        response.headers.get(
                            "x-ratelimit-reset"
                        )
                    )
            }
        };
    } catch {
        /*
         * URL, request headers and any future
         * authorization credentials are intentionally not logged.
         */
        return createFailure(
            "NETWORK_ERROR",
            "The GitHub API request failed."
        );
    } finally {
        clearTimeout(
            timeoutId
        );
    }
}

async function getOrRequestRepositoryTree(
    request: ValidatedRequest,
    cacheKey: string,
    authenticationToken: string | null
): Promise<GetRepositoryTreeResponse> {
    const cachedResponse =
        await getCachedRepositoryTree(
            cacheKey
        );

    if (cachedResponse) {
        return cachedResponse;
    }

    const response =
        await requestRepositoryTree(
            request,
            authenticationToken
        );

    if (response.success) {
        await setCachedRepositoryTree(
            cacheKey,
            response
        );
    }

    return response;
}

export async function getRepositoryTree(
    request: ValidatedRequest
): Promise<GetRepositoryTreeResponse> {
    /*
     * The token is loaded only into a local variable
     * of the background worker for a single API request.
     */
    const authentication =
        await getGitHubAuthentication();

    const cacheKey =
        createRepositoryTreeCacheKey(
            request.owner,
            request.repository,
            request.ref,
            authentication.cachePartition
        );

    const existingRequest =
        inFlightRequests.get(
            cacheKey
        );

    if (existingRequest) {
        return existingRequest;
    }

    const requestPromise =
        getOrRequestRepositoryTree(
            request,
            cacheKey,
            authentication.token
        );

    inFlightRequests.set(
        cacheKey,
        requestPromise
    );

    try {
        return await requestPromise;
    } finally {
        if (
            inFlightRequests.get(
                cacheKey
            ) === requestPromise
        ) {
            inFlightRequests.delete(
                cacheKey
            );
        }
    }
}