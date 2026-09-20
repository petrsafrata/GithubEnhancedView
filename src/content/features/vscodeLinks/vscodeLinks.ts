import type {
    RepositoryItem
} from "../../github/types";

import type {
    RepositoryMapping
} from "../../../settings/repositoryMappingsStorage";

const LINK_ATTRIBUTE =
    "data-gev-vscode-link";

const MAPPING_ATTRIBUTE =
    "data-gev-vscode-mapping";

const MAIN_LINK_CLASS =
    "gev-vscode-link";

const ICON_CLASS =
    "gev-vscode-link-icon";

const VSCODE_ICON_PATH =
    "dist/icons/vscode.svg";

function getCurrentRepository():
    string | null {
    const parts =
        window.location.pathname
            .split("/")
            .filter(Boolean);

    if (parts.length < 2) {
        return null;
    }

    return `${parts[0]}/${parts[1]}`;
}

function findRepositoryMapping(
    mappings: RepositoryMapping[]
): RepositoryMapping | null {
    const repository =
        getCurrentRepository()
            ?.toLowerCase();

    if (!repository) {
        return null;
    }

    return mappings.find(
        (mapping) =>
            mapping.enabled &&
            mapping.localPath.trim() !== "" &&
            mapping.repository
                .toLowerCase() ===
                repository
    ) ?? null;
}

function isAbsoluteLocalPath(
    path: string
): boolean {
    const normalized =
        path.trim();

    /*
     * Windows:
     * C:\Projects\Repository
     * C:/Projects/Repository
     */
    if (
        /^[a-zA-Z]:[\\/]/.test(
            normalized
        )
    ) {
        return true;
    }

    /*
     * Windows UNC:
     * \\server\directory
     */
    if (
        normalized.startsWith(
            "\\\\"
        )
    ) {
        return true;
    }

    /*
     * Linux/macOS:
     * /home/user/project
     */
    return normalized.startsWith("/");
}

function normalizeLocalPath(
    path: string
): string {
    return path
        .trim()
        .replace(/\\/g, "/")
        .replace(/\/+$/, "");
}

function encodePath(
    path: string
): string {
    return path
        .split("/")
        .map((segment) => {
            /*
             * Keep the Windows system disk
             * C:
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
): string | null {
    if (
        !isAbsoluteLocalPath(
            localRoot
        )
    ) {
        return null;
    }

    const root =
        normalizeLocalPath(
            localRoot
        );

    const relative =
        relativePath
            .replace(/\\/g, "/")
            .replace(/^\/+/, "");

    const fullPath =
        `${root}/${relative}`;

    return `vscode://file/${encodePath(fullPath)}`;
}

/**
 * Gets the relative path of a file
 * from a GitHub blob URL.
 *
 * /owner/repository/blob/main/src/App.ts
 * ->
 * src/App.ts
 */
function getRelativePathFromHref(
    href: string
): string | null {
    try {
        const url =
            new URL(href);

        const parts =
            url.pathname
                .split("/")
                .filter(Boolean);

        const blobIndex =
            parts.indexOf("blob");

        if (
            blobIndex < 0 ||
            parts.length <=
                blobIndex + 2
        ) {
            return null;
        }

        /*
         * The first segment after /blob/
         * represents the branch.
         */
        const pathParts =
            parts.slice(
                blobIndex + 2
            );

        if (pathParts.length === 0) {
            return null;
        }

        return pathParts
            .map((part) =>
                decodeURIComponent(part)
            )
            .join("/");
    } catch {
        return null;
    }
}

function getTreeItemPath(
    item: HTMLElement
): string | null {
    if (!item.id.endsWith("-item")) {
        return null;
    }

    const path =
        item.id.slice(0, -5);

    if (!path) {
        return null;
    }

    try {
        return decodeURIComponent(
            path
        );
    } catch {
        return path;
    }
}

function createVsCodeLink(
    vscodeUrl: string,
    mappingId: string,
    className: string
): HTMLAnchorElement {
    const link =
        document.createElement("a");

    link.className =
        className;

    link.href =
        vscodeUrl;

    link.title =
        "Open local file in VS Code";

    link.setAttribute(
        "aria-label",
        "Open local file in VS Code"
    );

    link.setAttribute(
        LINK_ATTRIBUTE,
        "true"
    );

    link.setAttribute(
        MAPPING_ATTRIBUTE,
        mappingId
    );

    const icon =
        document.createElement("img");

    icon.className =
        ICON_CLASS;

    icon.src =
        chrome.runtime.getURL(
            VSCODE_ICON_PATH
        );

    icon.alt = "";

    icon.draggable = false;

    icon.setAttribute(
        "aria-hidden",
        "true"
    );

    link.appendChild(icon);

    /*
     * Prevent the GitHub line from
     * simultaneously opening the file on the web.
     */
    link.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();
        }
    );

    return link;
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

function applyMainListLinks(
    items: RepositoryItem[],
    mapping: RepositoryMapping
): number {
    let appliedCount = 0;

    const files =
        items.filter(
            (item) =>
                item.type === "file"
        );

    files.forEach((file) => {
        const relativePath =
            getRelativePathFromHref(
                file.href
            );

        if (!relativePath) {
            return;
        }

        const vscodeUrl =
            createVsCodeUrl(
                mapping.localPath,
                relativePath
            );

        if (!vscodeUrl) {
            return;
        }

        const links =
            findMainFileLinks(file);

        links.forEach((fileLink) => {
            const parent =
                fileLink.parentElement;

            if (!parent) {
                return;
            }

            const existing =
                parent.querySelector(
                    `:scope > [${LINK_ATTRIBUTE}="true"]`
                );

            if (existing) {
                return;
            }

            const vscodeLink =
                createVsCodeLink(
                    vscodeUrl,
                    mapping.id,
                    MAIN_LINK_CLASS
                );

            fileLink.insertAdjacentElement(
                "afterend",
                vscodeLink
            );

            appliedCount++;
        });
    });

    return appliedCount;
}

export function removeVsCodeLinks():
    void {
    document
        .querySelectorAll<HTMLElement>(
            `[${LINK_ATTRIBUTE}="true"]`
        )
        .forEach((link) => {
            link.remove();
        });
}

export function applyVsCodeLinks(
    items: RepositoryItem[],
    mappings: RepositoryMapping[]
): number {
    const mapping =
        findRepositoryMapping(
            mappings
        );

    if (!mapping) {
        removeVsCodeLinks();
        return 0;
    }

    /*
     * Remove links created
     * using a different mapping.
     */
    document
        .querySelectorAll<HTMLElement>(
            `[${LINK_ATTRIBUTE}="true"]`
        )
        .forEach((link) => {
            if (
                link.getAttribute(
                    MAPPING_ATTRIBUTE
                ) !== mapping.id
            ) {
                link.remove();
            }
        });

    return (
        applyMainListLinks(
            items,
            mapping
        )
    );
}