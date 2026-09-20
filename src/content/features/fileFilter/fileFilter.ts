import {
    shouldHideFile
} from "./filterRules";

import type {
    FileFilterRule
} from "../../../settings/types";

const HIDDEN_ATTRIBUTE =
    "data-gev-filter-hidden";

/**
 * Hides or restores a specific row.
 *
 * We use the following at the same time:
 * - a custom attribute,
 * - the native `hidden` attribute,
 * - `display: none !important` inline.
 *
 * This prevents GitHub from overriding the hiding of rows.
 */
function setElementHidden(
    element: HTMLElement,
    hidden: boolean
): void {
    if (hidden) {
        element.setAttribute(
            HIDDEN_ATTRIBUTE,
            "true"
        );

        element.hidden = true;

        element.style.setProperty(
            "display",
            "none",
            "important"
        );

        return;
    }

    element.removeAttribute(
        HIDDEN_ATTRIBUTE
    );

    element.hidden = false;

    element.style.removeProperty(
        "display"
    );
}

/**
* Returns the filename from a GitHub URL.
 */
function getFilenameFromHref(
    href: string
): string | null {
    try {
        const url = new URL(href);

        const parts = url.pathname
            .split("/")
            .filter(Boolean);

        const filename =
            parts.at(-1);

        if (!filename) {
            return null;
        }

        return decodeURIComponent(
            filename
        );
    } catch {
        return null;
    }
}

/**
 * Finds the main table rows containing files.
 */
function getRepositoryFileRows(): Map<
    HTMLElement,
    string
> {
    const result =
        new Map<HTMLElement, string>();

    const links =
        document.querySelectorAll<HTMLAnchorElement>(
            'a[href*="/blob/"]'
        );

    links.forEach((link) => {
        /*
         * It processes the left directory tree separately.
         */
        if (
            link.closest(
                '[data-testid="repos-file-tree-container"]'
            )
        ) {
            return;
        }

        const filename =
            getFilenameFromHref(
                link.href
            );

        if (!filename) {
            return;
        }

        const row =
            link.closest<HTMLElement>(
                "tr.react-directory-row, tr, [role='row']"
            );

        if (!row) {
            return;
        }

        result.set(
            row,
            filename
        );
    });

    return result;
}

/**
 * Gets the filename in the left tree.
 */
function getTreeItemFilename(
    item: HTMLElement
): string | null {
    /*
     * GitHub also stores the item name in the ID:
     *
     * for example:
     * frontend/.gitignore-item
     */
    if (item.id.endsWith("-item")) {
        const withoutSuffix =
            item.id.slice(0, -5);

        const filename =
            withoutSuffix
                .split("/")
                .at(-1)
                ?.trim();

        if (filename) {
            return filename;
        }
    }

    /*
     * Fallback option in case the GitHub DOM changes.
     */
    const text =
        item.textContent?.trim();

    if (!text) {
        return null;
    }

    const lines =
        text
            .split("\n")
            .map((line) =>
                line.trim()
            )
            .filter(Boolean);

    return lines.at(-1) ?? null;
}

/**
 * Finds files in the left directory tree.
 *
 * Directories have `aria-expanded`.
 * Files do not have this attribute.
 */
function getFileTreeItems(): Map<
    HTMLElement,
    string
> {
    const result =
        new Map<HTMLElement, string>();

    const tree =
        document.querySelector<HTMLElement>(
            '[data-testid="repos-file-tree-container"]'
        );

    if (!tree) {
        return result;
    }

    const items =
        tree.querySelectorAll<HTMLElement>(
            'li[role="treeitem"]:not([aria-expanded])'
        );

    items.forEach((item) => {
        const filename =
            getTreeItemFilename(item);

        if (!filename) {
            return;
        }

        result.set(
            item,
            filename
        );
    });

    return result;
}

function restorePreviouslyHiddenElements():
    void {
    document
        .querySelectorAll<HTMLElement>(
            `[${HIDDEN_ATTRIBUTE}="true"]`
        )
        .forEach((element) => {
            setElementHidden(
                element,
                false
            );
        });
}

/**
 * Enables or disables filtering of configuration files.
 */
export function applyFileFilter(
    enabled: boolean,
    rules: FileFilterRule[]
): number {
    restorePreviouslyHiddenElements();

    if (!enabled) {
        return 0;
    }

    let hiddenCount = 0;

    getRepositoryFileRows().forEach(
        (filename, row) => {
            if (
                !shouldHideFile(
                    filename,
                    rules
                )
            ) {
                return;
            }

            setElementHidden(
                row,
                true
            );

            hiddenCount++;
        }
    );

    getFileTreeItems().forEach(
        (filename, item) => {
            if (
                !shouldHideFile(
                    filename,
                    rules
                )
            ) {
                return;
            }

            setElementHidden(
                item,
                true
            );

            hiddenCount++;
        }
    );

    return hiddenCount;
}