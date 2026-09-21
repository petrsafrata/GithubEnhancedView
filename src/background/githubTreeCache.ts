import type {
    GetRepositoryTreeSuccess,
    GitHubFileSize
} from "../shared/githubApiMessages";

const CACHE_STORAGE_KEY =
    "gev-github-tree-cache-v1";

/**
 * Metadata will be valid for a maximum of 10 minutes.
 */
const CACHE_TTL_MS =
    10 * 60 * 1000;

/**
 * We store a maximum of five different combinations:
 *
 * owner / repository / ref
 */
const MAX_CACHE_ENTRIES =
    5;

/**
 * Protect chrome.storage.session from an excessively large
 * repository tree.
 *
 * This is the number of characters in the JSON representation of a single entry.
 */
const MAX_CACHE_ENTRY_CHARACTERS =
    700_000;

interface CachedRepositoryTree {
    cachedAt: number;
    expiresAt: number;
    files: GitHubFileSize[];
    truncated: boolean;
}

type RepositoryTreeCache =
    Record<string, CachedRepositoryTree>;

let mutationQueue:
    Promise<void> = Promise.resolve();

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null
    );
}

function isValidCacheKey(
    value: string
): boolean {
    return (
        value.length >= 1 &&
        value.length <= 512 &&
        !/[\u0000-\u001f\u007f]/.test(
            value
        )
    );
}

function parseCachedFile(
    value: unknown
): GitHubFileSize | null {
    if (!isRecord(value)) {
        return null;
    }

    const path =
        value.path;

    const size =
        value.size;

    if (
        typeof path !== "string" ||
        path.length < 1 ||
        path.length > 4096 ||
        typeof size !== "number" ||
        !Number.isSafeInteger(size) ||
        size < 0
    ) {
        return null;
    }

    return {
        path,
        size
    };
}

function parseCacheEntry(
    value: unknown
): CachedRepositoryTree | null {
    if (!isRecord(value)) {
        return null;
    }

    const cachedAt =
        value.cachedAt;

    const expiresAt =
        value.expiresAt;

    const truncated =
        value.truncated;

    const rawFiles =
        value.files;

    if (
        typeof cachedAt !== "number" ||
        !Number.isSafeInteger(cachedAt) ||
        cachedAt < 0 ||
        typeof expiresAt !== "number" ||
        !Number.isSafeInteger(expiresAt) ||
        expiresAt < 0 ||
        typeof truncated !== "boolean" ||
        !Array.isArray(rawFiles)
    ) {
        return null;
    }

    const files:
        GitHubFileSize[] = [];

    for (const rawFile of rawFiles) {
        const file =
            parseCachedFile(rawFile);

        if (!file) {
            return null;
        }

        files.push(file);
    }

    return {
        cachedAt,
        expiresAt,
        truncated,
        files
    };
}

function parseCache(
    value: unknown
): RepositoryTreeCache {
    if (!isRecord(value)) {
        return {};
    }

    const result:
        RepositoryTreeCache = {};

    /*
     * Even if someone unexpectedly changes the storage,
     * we will load a maximum limited number of entries.
     */
    const entries =
        Object.entries(value)
            .slice(
                0,
                MAX_CACHE_ENTRIES
            );

    for (
        const [key, rawEntry]
        of entries
    ) {
        if (!isValidCacheKey(key)) {
            continue;
        }

        const entry =
            parseCacheEntry(
                rawEntry
            );

        if (!entry) {
            continue;
        }

        result[key] =
            entry;
    }

    return result;
}

async function readCache():
    Promise<RepositoryTreeCache> {
    try {
        const stored =
            await chrome.storage.session.get(
                CACHE_STORAGE_KEY
            );

        return parseCache(
            stored[CACHE_STORAGE_KEY]
        );
    } catch {
        /*
         * Cache must not cause the API to malfunction.
         * We intentionally do not log the error.
         */
        return {};
    }
}

async function writeCache(
    cache: RepositoryTreeCache
): Promise<void> {
    try {
        await chrome.storage.session.set({
            [CACHE_STORAGE_KEY]:
                cache
        });
    } catch {
        /*
         * Cache failure is not a critical error.
         * We do not log the contents of the cache or any other data.
         */
    }
}

function queueMutation(
    operation: () => Promise<void>
): Promise<void> {
    const next =
        mutationQueue.then(
            operation,
            operation
        );

    mutationQueue =
        next.catch(() => undefined);

    return next.catch(
        () => undefined
    );
}

export function createRepositoryTreeCacheKey(
    owner: string,
    repository: string,
    ref: string,
    cachePartition: string
): string {
    return JSON.stringify([
        owner.toLowerCase(),
        repository.toLowerCase(),
        ref,
        cachePartition
    ]);
}

export async function getCachedRepositoryTree(
    cacheKey: string
): Promise<GetRepositoryTreeSuccess | null> {
    if (!isValidCacheKey(cacheKey)) {
        return null;
    }

    const cache =
        await readCache();

    const entry =
        cache[cacheKey];

    if (
        !entry ||
        entry.expiresAt <= Date.now()
    ) {
        return null;
    }

    return {
        success: true,

        /*
         * We return a copy so that the caller cannot
         * modify the object stored in memory.
         */
        files:
            entry.files.map(
                (file) => ({
                    path:
                        file.path,

                    size:
                        file.size
                })
            ),

        truncated:
            entry.truncated,

        /*
         * Rate-limit information from the previous request
         * is no longer current, so we do not return it.
         */
        rateLimit: {}
    };
}

export async function setCachedRepositoryTree(
    cacheKey: string,
    response: GetRepositoryTreeSuccess
): Promise<void> {
    if (!isValidCacheKey(cacheKey)) {
        return;
    }

    const now =
        Date.now();

    const entry:
        CachedRepositoryTree = {
        cachedAt:
            now,

        expiresAt:
            now + CACHE_TTL_MS,

        truncated:
            response.truncated,

        files:
            response.files.map(
                (file) => ({
                    path:
                        file.path,

                    size:
                        file.size
                })
            )
    };

    let serializedLength:
        number;

    try {
        serializedLength =
            JSON.stringify(entry).length;
    } catch {
        return;
    }

    if (
        serializedLength >
        MAX_CACHE_ENTRY_CHARACTERS
    ) {
        /*
         * The tree is too large, we will use it normally,
         * but we will not store it in the cache.
         */
        return;
    }

    await queueMutation(
        async () => {
            const currentCache =
                await readCache();

            const activeEntries =
                Object.entries(
                    currentCache
                )
                    .filter(
                        ([, currentEntry]) =>
                            currentEntry.expiresAt >
                            now
                    );

            const updatedEntries:
                Array<
                    [
                        string,
                        CachedRepositoryTree
                    ]
                > = [
                    [
                        cacheKey,
                        entry
                    ],

                    ...activeEntries.filter(
                        ([key]) =>
                            key !== cacheKey
                    )
                ];

            updatedEntries.sort(
                (
                    [, first],
                    [, second]
                ) =>
                    second.cachedAt -
                    first.cachedAt
            );

            const limitedCache =
                Object.fromEntries(
                    updatedEntries.slice(
                        0,
                        MAX_CACHE_ENTRIES
                    )
                ) as RepositoryTreeCache;

            await writeCache(
                limitedCache
            );
        }
    );
}

export async function clearRepositoryTreeCache():
    Promise<void> {
    try {
        await chrome.storage.session.remove(
            CACHE_STORAGE_KEY
        );
    } catch {
        /*
         * Failure to clear the cache will not be logged.
         */
    }
}