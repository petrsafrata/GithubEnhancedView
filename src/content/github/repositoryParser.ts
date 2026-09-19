import type {
    RepositoryItem,
    RepositoryItemType
} from "./types";

/**
 * Returns the file extension without the period.
 *
 * Examples:
 *
 * index.ts      -> ts
 * README.md     -> md
 * config.json   -> json
 * .gitignore    -> undefined
 * Dockerfile    -> undefined
 */
function getFileExtension(
    filename: string
): string | undefined {
    const lastDotIndex = filename.lastIndexOf(".");

    if (lastDotIndex <= 0) {
        return undefined;
    }

    if (lastDotIndex === filename.length - 1) {
        return undefined;
    }

    return filename
        .slice(lastDotIndex + 1)
        .toLowerCase();
}

/**
 * Determines the item type based on the GitHub URL.
 *
 * /blob/ -> file
 * /tree/ -> directory
 */
function getItemType(
    href: string
): RepositoryItemType | null {
    if (href.includes("/blob/")) {
        return "file";
    }

    if (href.includes("/tree/")) {
        return "directory";
    }

    return null;
}

/**
 * Gets the repository path prefix from the current URL.
 *
 * For example:
 *
 * https://github.com/owner/repository/tree/main/src
 *
 * ->
 *
 * /owner/repository/
 */
function getRepositoryPathPrefix(): string | null {
    const parts = window.location.pathname
        .split("/")
        .filter(Boolean);

    if (parts.length < 2) {
        return null;
    }

    const owner = parts[0];
    const repository = parts[1];

    return `/${owner}/${repository}/`;
}

/**
 * Returns the last segment of the URL.
 *
 * /owner/repo/blob/main/src/App.java
 *
 * ->
 *
 * App.java
 */
function getLastPathSegment(
    href: string
): string | null {
    try {
        const url = new URL(href);

        const parts = url.pathname
            .split("/")
            .filter(Boolean);

        const lastPart = parts.at(-1);

        if (!lastPart) {
            return null;
        }

        return decodeURIComponent(lastPart);
    } catch {
        return null;
    }
}

/**
 * Returns the clean name of the link.
 *
 * Important:
 * Our extension may insert its own elements into the link,
 * for example:
 *
 * <span data-gev-file-icon="true">image</span>
 *
 * We do not want to include these in the file name.
 */
function getLinkName(
    link: HTMLAnchorElement
): string | null {
    const clone = link.cloneNode(true) as HTMLAnchorElement;

    /**
     * Remove all elements
     * that our extension has added to the link.
     */
    clone
        .querySelectorAll("[data-gev-file-icon]")
        .forEach((element) => {
            element.remove();
        });

    const name = clone.textContent?.trim();

    if (!name) {
        return null;
    }

    return name;
}

/**
 * Verifies that the link actually represents
 * a file or directory in the repository browser.
 *
 * Helps to filter out false links such as:
 *
 * "Open in codespace"
 *
 * which may also contain /tree/ in the URL.
 */
function isRepositoryItemLink(
    link: HTMLAnchorElement
): boolean {
    const name = getLinkName(link);

    if (!name) {
        return false;
    }

    const lastPathSegment =
        getLastPathSegment(link.href);

    if (!lastPathSegment) {
        return false;
    }

    return name === lastPathSegment;
}

/**
 * Verifies that the link belongs to the current repository.
 */
function belongsToCurrentRepository(
    href: string,
    repositoryPrefix: string
): boolean {
    try {
        const url = new URL(href);

        return url.pathname.startsWith(
            repositoryPrefix
        );
    } catch {
        return false;
    }
}

/**
 * Finds the actual files and directories
 * currently displayed on GitHub.
 */
export function getRepositoryItems(): RepositoryItem[] {
    const repositoryPrefix =
        getRepositoryPathPrefix();

    if (!repositoryPrefix) {
        return [];
    }

    /**
     * Looking for links to GitHub files and directories.
     */
    const links =
        document.querySelectorAll<HTMLAnchorElement>(
            'a[href*="/blob/"], a[href*="/tree/"]'
        );

    /**
     * We use a Map to remove duplicates.
     *
     * The same file may be displayed multiple times
     * in the DOM by GitHub.
     */
    const items =
        new Map<string, RepositoryItem>();

    links.forEach((link) => {
        const href = link.href;

        if (!href) {
            return;
        }

        /**
         * The link must belong to the current repository.
         */
        if (
            !belongsToCurrentRepository(
                href,
                repositoryPrefix
            )
        ) {
            return;
        }

        /**
         * The link must actually represent
         * a file or directory.
         */
        if (!isRepositoryItemLink(link)) {
            return;
        }

        const name = getLinkName(link);

        if (!name) {
            return;
        }

        const type = getItemType(href);

        if (!type) {
            return;
        }

        /**
         * If we already have the same URL,
         * we will not add the item again.
         */
        if (items.has(href)) {
            return;
        }

        const item: RepositoryItem = {
            name,
            type,
            href
        };

        /**
         * We determine the extension only for files.
         */
        if (type === "file") {
            item.extension =
                getFileExtension(name);
        }

        items.set(href, item);
    });

    return Array.from(items.values());
}