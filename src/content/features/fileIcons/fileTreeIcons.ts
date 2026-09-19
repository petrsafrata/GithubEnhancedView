import {
    getFileIcon
} from "./iconMap";

import {
    createFileIconElement
} from "./iconElement";

const TREE_ROOT_SELECTOR =
    '[data-testid="repos-file-tree-container"]';

const FILE_ITEM_SELECTOR =
    'li[role="treeitem"]:not([aria-expanded])';

const NATIVE_FILE_ICON_SELECTOR =
    "svg.octicon-file";

const PROCESSED_ATTRIBUTE =
    "data-gev-tree-icon-applied";

const NATIVE_ICON_ATTRIBUTE =
    "data-gev-native-file-icon";

/**
 * Returns the file extension without the period.
 */
function getFileExtension(
    filename: string
): string | undefined {
    const lastDotIndex =
        filename.lastIndexOf(".");

    if (
        lastDotIndex <= 0 ||
        lastDotIndex === filename.length - 1
    ) {
        return undefined;
    }

    return filename
        .slice(lastDotIndex + 1)
        .toLowerCase();
}

/**
 * Gets the filename from the tree item ID.
 *
 * Example:
 *
 * src/main/App.java-item
 *
 * -> App.java
 */
function getFilenameFromTreeItem(
    item: HTMLElement
): string | null {
    const itemId =
        item.id;

    if (!itemId.endsWith("-item")) {
        return null;
    }

    const path =
        itemId.slice(
            0,
            -"-item".length
        );

    const pathParts =
        path
            .split("/")
            .filter(Boolean);

    const filename =
        pathParts.at(-1);

    return filename || null;
}

/**
 * Gets the filename from the text element.
 *
 * This is a fallback in case GitHub
 * changes the format of the item IDs.
 */
function getFilenameFromText(
    item: HTMLElement
): string | null {
    const textElement =
        item.querySelector<HTMLElement>(
            '[class*="TreeView-item-content-text"]'
        );

    const filename =
        textElement
            ?.textContent
            ?.trim();

    return filename || null;
}

function getTreeItemFilename(
    item: HTMLElement
): string | null {
    return (
        getFilenameFromTreeItem(item) ??
        getFilenameFromText(item)
    );
}

/**
 * Applies the SVG icon to a single tree item.
 */
function applyIconToTreeItem(
    item: HTMLElement
): boolean {
    if (
        item.getAttribute(
            PROCESSED_ATTRIBUTE
        ) === "true"
    ) {
        return false;
    }

    const filename =
        getTreeItemFilename(item);

    if (!filename) {
        return false;
    }

    const definition =
        getFileIcon(
            filename,
            getFileExtension(filename)
        );

    if (!definition) {
        return false;
    }

    const nativeIcon =
        item.querySelector<SVGElement>(
            NATIVE_FILE_ICON_SELECTOR
        );

    if (!nativeIcon) {
        return false;
    }

    const customIcon =
        createFileIconElement(
            definition,
            "gev-file-tree-icon"
        );

    nativeIcon.setAttribute(
        NATIVE_ICON_ATTRIBUTE,
        "true"
    );

    nativeIcon.insertAdjacentElement(
        "afterend",
        customIcon
    );

    item.setAttribute(
        PROCESSED_ATTRIBUTE,
        "true"
    );

    return true;
}

/**
 * Applies the SVG icons to the files
 * in the left GitHub tree.
 */
export function applyFileTreeIcons(): number {
    const treeRoot =
        document.querySelector<HTMLElement>(
            TREE_ROOT_SELECTOR
        );

    if (!treeRoot) {
        return 0;
    }

    const fileItems =
        treeRoot.querySelectorAll<HTMLElement>(
            FILE_ITEM_SELECTOR
        );

    let appliedCount = 0;

    fileItems.forEach((item) => {
        if (
            applyIconToTreeItem(item)
        ) {
            appliedCount++;
        }
    });

    return appliedCount;
}