export interface RepositoryMapping {
    /**
     * Internal identifier of the mapping.
     */
    id: string;

    /**
     * GitHub repository in the format:
     * owner/repository
     */
    repository: string;

    /**
     * Absolute local path.
     */
    localPath: string;

    /**
     * Determines whether the mapping should be used.
     */
    enabled: boolean;
}

const STORAGE_KEY =
    "gev-repository-mappings";

function sanitizeString(
    value: unknown
): string {
    return typeof value === "string"
        ? value.trim()
        : "";
}

function sanitizeMapping(
    value: unknown,
    index: number
): RepositoryMapping | null {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return null;
    }

    const mapping =
        value as
            Partial<RepositoryMapping>;

    return {
        id:
            sanitizeString(
                mapping.id
            ) ||
            `repository-mapping-${index}`,

        repository:
            sanitizeString(
                mapping.repository
            ),

        localPath:
            sanitizeString(
                mapping.localPath
            ),

        enabled:
            typeof mapping.enabled ===
            "boolean"
                ? mapping.enabled
                : true
    };
}

/**
 * Converts a URL or user input
 * to the owner/repository format.
 */
export function normalizeRepositoryName(
    value: string
): string {
    let normalized =
        value.trim();

    if (!normalized) {
        return "";
    }

    try {
        if (
            normalized.startsWith(
                "https://"
            ) ||
            normalized.startsWith(
                "http://"
            )
        ) {
            const url =
                new URL(normalized);

            if (
                url.hostname.toLowerCase() ===
                "github.com"
            ) {
                normalized =
                    url.pathname;
            }
        }
    } catch {
        return normalized;
    }

    normalized =
        normalized
            .replace(
                /^\/+/,
                ""
            )
            .replace(
                /\/+$/,
                ""
            )
            .replace(
                /\.git$/i,
                ""
            );

    const parts =
        normalized
            .split("/")
            .filter(Boolean);

    if (parts.length < 2) {
        return normalized;
    }

    return `${parts[0]}/${parts[1]}`;
}

export async function getRepositoryMappings():
    Promise<RepositoryMapping[]> {
    const stored =
        await chrome.storage.local.get(
            STORAGE_KEY
        );

    const value =
        stored[STORAGE_KEY];

    if (!Array.isArray(value)) {
        return [];
    }

    const ids =
        new Set<string>();

    const mappings:
        RepositoryMapping[] = [];

    value.forEach((item, index) => {
        const mapping =
            sanitizeMapping(
                item,
                index
            );

        if (
            !mapping ||
            ids.has(mapping.id)
        ) {
            return;
        }

        ids.add(mapping.id);
        mappings.push(mapping);
    });

    return mappings;
}

export async function saveRepositoryMappings(
    mappings: RepositoryMapping[]
): Promise<void> {
    await chrome.storage.local.set({
        [STORAGE_KEY]:
            mappings.map(
                (mapping) => ({
                    ...mapping,

                    repository:
                        normalizeRepositoryName(
                            mapping.repository
                        ),

                    localPath:
                        mapping.localPath.trim()
                })
            )
    });
}

export function observeRepositoryMappings(
    callback: (
        mappings: RepositoryMapping[]
    ) => void
): () => void {
    const listener = (
        changes: {
            [key: string]:
                chrome.storage.StorageChange;
        },
        areaName: string
    ): void => {
        if (
            areaName !== "local" ||
            !changes[STORAGE_KEY]
        ) {
            return;
        }

        void getRepositoryMappings()
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