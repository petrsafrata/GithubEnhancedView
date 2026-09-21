import type {
    GitHubTokenStatus
} from "../shared/githubTokenMessages";

const TOKEN_STORAGE_KEY =
    "gev-github-api-token";

const ANONYMOUS_CACHE_PARTITION =
    "anonymous";

const MIN_TOKEN_LENGTH =
    20;

const MAX_TOKEN_LENGTH =
    255;

interface StoredGitHubToken {
    token: string;

    /**
     * A random ID separating the cache created
     * by different tokens.
     *
     * It is not a hash or part of the token.
     */
    revision: string;
}

export interface GitHubAuthentication {
    token: string | null;
    cachePartition: string;
}

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null
    );
}

export function normalizeGitHubToken(
    value: unknown
): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const token =
        value.trim();

    if (
        token.length < MIN_TOKEN_LENGTH ||
        token.length > MAX_TOKEN_LENGTH
    ) {
        return null;
    }

    /*
     * The token may only contain visible
     * ASCII characters without spaces or control characters.
     */
    if (!/^[\x21-\x7e]+$/.test(token)) {
        return null;
    }

    return token;
}

function parseStoredToken(
    value: unknown
): StoredGitHubToken | null {
    if (!isRecord(value)) {
        return null;
    }

    const token =
        normalizeGitHubToken(
            value.token
        );

    const revision =
        value.revision;

    if (
        !token ||
        typeof revision !== "string" ||
        revision.length < 1 ||
        revision.length > 100
    ) {
        return null;
    }

    return {
        token,
        revision
    };
}

async function readStoredToken():
    Promise<StoredGitHubToken | null> {
    const stored =
        await chrome.storage.local.get(
            TOKEN_STORAGE_KEY
        );

    return parseStoredToken(
        stored[TOKEN_STORAGE_KEY]
    );
}

export async function getGitHubAuthentication():
    Promise<GitHubAuthentication> {
    try {
        const storedToken =
            await readStoredToken();

        if (!storedToken) {
            return {
                token: null,

                cachePartition:
                    ANONYMOUS_CACHE_PARTITION
            };
        }

        return {
            token:
                storedToken.token,

            cachePartition:
                storedToken.revision
        };
    } catch {
        /*
         * If storage fails, we try a public
         * GitHub API request without authorization.
         */
        return {
            token: null,

            cachePartition:
                ANONYMOUS_CACHE_PARTITION
        };
    }
}

export async function getGitHubTokenStatus():
    Promise<GitHubTokenStatus> {
    const authentication =
        await getGitHubAuthentication();

    if (!authentication.token) {
        return {
            stored: false
        };
    }

    return {
        stored: true,

        maskedToken:
            `••••${authentication.token.slice(-4)}`
    };
}

export async function saveGitHubToken(
    value: unknown
): Promise<boolean> {
    const token =
        normalizeGitHubToken(value);

    if (!token) {
        return false;
    }

    const storedToken:
        StoredGitHubToken = {
        token,

        revision:
            crypto.randomUUID()
    };

    await chrome.storage.local.set({
        [TOKEN_STORAGE_KEY]:
            storedToken
    });

    return true;
}

export async function removeGitHubToken():
    Promise<void> {
    await chrome.storage.local.remove(
        TOKEN_STORAGE_KEY
    );
}