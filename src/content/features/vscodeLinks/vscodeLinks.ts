import type {
    RepositoryItem
} from "../../github/types";

import {
    getRelativeFilePath,
    getRepositoryContext
} from "../../github/repositoryContext";

import {
    OPEN_FILE_IN_VSCODE_MESSAGE
} from "../../../shared/contentConfigurationMessages";

import type {
    ContentRepositoryMapping,
    OpenFileInVsCodeRequest
} from "../../../shared/contentConfigurationMessages";

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

function findRepositoryMapping(
    mappings:
        ContentRepositoryMapping[],
    repository: string
): ContentRepositoryMapping | null {
    const normalizedRepository =
        repository.toLowerCase();

    return mappings.find(
        (mapping) =>
            mapping.enabled &&
            mapping.repository
                .toLowerCase() ===
                normalizedRepository
    ) ?? null;
}

async function requestOpenInVsCode(
    button: HTMLButtonElement,
    mappingId: string,
    repository: string,
    relativePath: string
): Promise<void> {
    if (button.disabled) {
        return;
    }

    button.disabled = true;

    try {
        const request:
            OpenFileInVsCodeRequest = {
            type:
                OPEN_FILE_IN_VSCODE_MESSAGE,

            payload: {
                mappingId,
                repository,
                relativePath
            }
        };

        /*
         * The response intentionally contains no local
         * path and no vscode:// URL.
         */
        await chrome.runtime.sendMessage(
            request
        );
    } catch {
        /*
         * Do not log mapping data, local paths
         * or runtime request details.
         */
    } finally {
        if (button.isConnected) {
            button.disabled = false;
        }
    }
}

function createVsCodeButton(
    mappingId: string,
    repository: string,
    relativePath: string
): HTMLButtonElement {
    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        MAIN_LINK_CLASS;

    button.title =
        "Open local file in VS Code";

    button.setAttribute(
        "aria-label",
        "Open local file in VS Code"
    );

    button.setAttribute(
        LINK_ATTRIBUTE,
        "true"
    );

    /*
     * A mapping identifier is not a local path
     * and contains no filesystem information.
     */
    button.setAttribute(
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

    button.appendChild(icon);

    button.addEventListener(
        "click",
        (event) => {
            event.preventDefault();
            event.stopPropagation();

            void requestOpenInVsCode(
                button,
                mappingId,
                repository,
                relativePath
            );
        }
    );

    return button;
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
    mapping: ContentRepositoryMapping,
    repository: string,
    ref: string
): number {
    let appliedCount = 0;

    const files =
        items.filter(
            (item) =>
                item.type === "file"
        );

    files.forEach((file) => {
        const relativePath =
            getRelativeFilePath(
                file.href,
                ref
            );

        if (!relativePath) {
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

            const vscodeButton =
                createVsCodeButton(
                    mapping.id,
                    repository,
                    relativePath
                );

            fileLink.insertAdjacentElement(
                "afterend",
                vscodeButton
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
    mappings:
        ContentRepositoryMapping[]
): number {
    const context =
        getRepositoryContext(items);

    if (!context) {
        removeVsCodeLinks();
        return 0;
    }

    const repository =
        `${context.owner}/${context.repository}`;

    const mapping =
        findRepositoryMapping(
            mappings,
            repository
        );

    if (!mapping) {
        removeVsCodeLinks();
        return 0;
    }

    /*
     * Remove buttons created using
     * a different repository mapping.
     */
    document
        .querySelectorAll<HTMLElement>(
            `[${LINK_ATTRIBUTE}="true"]`
        )
        .forEach((button) => {
            if (
                button.getAttribute(
                    MAPPING_ATTRIBUTE
                ) !== mapping.id
            ) {
                button.remove();
            }
        });

    return applyMainListLinks(
        items,
        mapping,
        repository,
        context.ref
    );
}