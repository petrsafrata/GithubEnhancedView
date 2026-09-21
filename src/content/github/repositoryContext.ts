import type {
    RepositoryItem
} from "./types";

export interface RepositoryContext {
    owner: string;
    repository: string;
    ref: string;
}

function decodePathPart(
    value: string
): string | null {
    try {
        return decodeURIComponent(
            value
        );
    } catch {
        return null;
    }
}

function getPathParts(
    pathname: string
): string[] | null {
    const rawParts =
        pathname
            .split("/")
            .filter(Boolean);

    const parts: string[] = [];

    for (const rawPart of rawParts) {
        const decoded =
            decodePathPart(rawPart);

        if (decoded === null) {
            return null;
        }

        parts.push(decoded);
    }

    return parts;
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

    return !(
        value.startsWith("/") ||
        value.endsWith("/") ||
        value.includes("//") ||
        value.includes("..") ||
        value.includes("@{") ||
        value.endsWith(".lock")
    );
}

function getRefFromBranchButton():
    string | null {
    const buttons =
        document.querySelectorAll<HTMLElement>(
            '[data-hotkey="w"]'
        );

    for (const button of buttons) {
        const candidates = [
            button.textContent,

            ...Array.from(
                button.querySelectorAll(
                    "span"
                )
            ).map(
                (span) =>
                    span.textContent
            )
        ];

        for (const candidate of candidates) {
            const value =
                candidate
                    ?.trim();

            if (
                value &&
                isValidRef(value)
            ) {
                return value;
            }
        }
    }

    return null;
}

/**
 * On the repository's root page, the ref
 * can be identified from the link:
 *
 * /owner/repo/blob/feature/test/README.md
 *
 * The filename is the last segment;
 * everything between /blob/ and the filename is the ref.
 */
function getRefFromRootItem(
    items: RepositoryItem[]
): string | null {
    const currentParts =
        getPathParts(
            window.location.pathname
        );

    if (
        !currentParts ||
        currentParts.length !== 2
    ) {
        return null;
    }

    for (const item of items) {
        try {
            const url =
                new URL(item.href);

            const parts =
                getPathParts(
                    url.pathname
                );

            if (!parts) {
                continue;
            }

            const markerIndex =
                parts.findIndex(
                    (part) =>
                        part === "blob" ||
                        part === "tree"
                );

            if (
                markerIndex < 0 ||
                parts.length <=
                    markerIndex + 2
            ) {
                continue;
            }

            const ref =
                parts
                    .slice(
                        markerIndex + 1,
                        -1
                    )
                    .join("/");

            if (isValidRef(ref)) {
                return ref;
            }
        } catch {
            continue;
        }
    }

    return null;
}

function getFallbackRef():
    string | null {
    const parts =
        getPathParts(
            window.location.pathname
        );

    if (!parts) {
        return null;
    }

    const markerIndex =
        parts.findIndex(
            (part) =>
                part === "blob" ||
                part === "tree"
        );

    if (
        markerIndex < 0 ||
        parts.length <=
            markerIndex + 1
    ) {
        return null;
    }

    const ref =
        parts[markerIndex + 1];

    return isValidRef(ref)
        ? ref
        : null;
}

export function getRepositoryContext(
    items: RepositoryItem[]
): RepositoryContext | null {
    const parts =
        getPathParts(
            window.location.pathname
        );

    if (
        !parts ||
        parts.length < 2
    ) {
        return null;
    }

    const owner =
        parts[0];

    const repository =
        parts[1];

    if (
        !isValidOwner(owner) ||
        !isValidRepository(repository)
    ) {
        return null;
    }

    const ref =
        getRefFromBranchButton() ??
        getRefFromRootItem(items) ??
        getFallbackRef();

    if (!ref) {
        return null;
    }

    return {
        owner,
        repository,
        ref
    };
}

export function getRelativeFilePath(
    href: string,
    ref: string
): string | null {
    try {
        const url =
            new URL(href);

        const parts =
            getPathParts(
                url.pathname
            );

        if (!parts) {
            return null;
        }

        const blobIndex =
            parts.indexOf("blob");

        if (blobIndex < 0) {
            return null;
        }

        const refParts =
            ref.split("/");

        const hrefRefParts =
            parts.slice(
                blobIndex + 1,
                blobIndex +
                    1 +
                    refParts.length
            );

        const matchesRef =
            refParts.every(
                (part, index) =>
                    hrefRefParts[index] ===
                    part
            );

        if (!matchesRef) {
            return null;
        }

        const relativeParts =
            parts.slice(
                blobIndex +
                    1 +
                    refParts.length
            );

        if (
            relativeParts.length === 0
        ) {
            return null;
        }

        const relativePath =
            relativeParts.join("/");

        if (
            relativePath.length > 4096
        ) {
            return null;
        }

        return relativePath;
    } catch {
        return null;
    }
}