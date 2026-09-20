import type {
    RepositoryItem
} from "../../github/types";

import {
    getMatchingFileLabelRules
} from "./labelRules";

import type {
    FileLabelRule
} from "../../../settings/types";

const LABEL_CONTAINER_ATTRIBUTE =
    "data-gev-file-labels";

const LABEL_ATTRIBUTE =
    "data-gev-file-label";

const LABEL_CONTAINER_CLASS =
    "gev-file-labels";

const LABEL_CLASS =
    "gev-file-label";

const LABEL_ICON_CLASS =
    "gev-file-label-icon";

const LABEL_CELL_CLASS =
    "gev-file-label-cell";

const LABEL_ICON_PATH =
    "dist/icons/label.svg";

/**
 * Finds references to a specific file
 * in the repository's main list.
 */
function findMatchingLinks(
    item: RepositoryItem
): HTMLAnchorElement[] {
    const links =
        document.querySelectorAll<HTMLAnchorElement>(
            'a[href*="/blob/"]'
        );

    return Array.from(links).filter(
        (link) => {
            /*
             * We ignore links in the left tree.
             */
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

/**
 * Finds the cell containing the filename.
 *
 * Labels will remain inside this cell,
 * but will be aligned to its right side using CSS.
 */
function findFilenameCell(
    link: HTMLAnchorElement
): HTMLElement | null {
    return link.closest<HTMLElement>(
        "td"
    );
}

/**
 * Creates an icon inside the label.
 */
function createLabelIcon(): HTMLImageElement {
    const icon =
        document.createElement("img");

    icon.className =
        LABEL_ICON_CLASS;

    icon.src =
        chrome.runtime.getURL(
            LABEL_ICON_PATH
        );

    icon.alt = "";

    icon.setAttribute(
        "aria-hidden",
        "true"
    );

    icon.draggable = false;

    return icon;
}

/**
 * Creates a single colored label.
 */
function createLabel(
    rule: FileLabelRule
): HTMLSpanElement {
    const label =
        document.createElement("span");

    label.className =
        LABEL_CLASS;

    label.title =
        `${rule.label}: matched file name rule`;

    label.setAttribute(
        LABEL_ATTRIBUTE,
        rule.id
    );

    label.setAttribute(
        "aria-label",
        `${rule.label} file`
    );

    label.style.setProperty(
        "--gev-label-text-color",
        rule.textColor
    );

    label.style.setProperty(
        "--gev-label-background-color",
        rule.backgroundColor
    );

    label.style.setProperty(
        "--gev-label-border-color",
        rule.borderColor
    );

    const icon =
        createLabelIcon();

    const text =
        document.createElement("span");

    text.className =
        "gev-file-label-text";

    text.textContent =
        rule.label;

    label.append(
        icon,
        text
    );

    return label;
}

/**
 * Creates a container holding all
 * labels for a specific file.
 */
function createLabelContainer(
    rules: FileLabelRule[]
): HTMLSpanElement {
    const container =
        document.createElement("span");

    container.className =
        LABEL_CONTAINER_CLASS;

    container.setAttribute(
        LABEL_CONTAINER_ATTRIBUTE,
        "true"
    );

    rules.forEach((rule) => {
        container.appendChild(
            createLabel(rule)
        );
    });

    return container;
}

/**
 * Checks if the cell already contains
 * our labels.
 */
function hasLabelContainer(
    cell: HTMLElement
): boolean {
    return Boolean(
        cell.querySelector(
            `:scope > [${LABEL_CONTAINER_ATTRIBUTE}="true"]`
        )
    );
}

/**
 * Adds labels to a single file.
 */
function applyLabelsToFile(
    item: RepositoryItem,
    rules: FileLabelRule[]
): boolean {
    const matchingRules =
        getMatchingFileLabelRules(
            item.name,
            rules
        );

    if (matchingRules.length === 0) {
        return false;
    }

    const links =
        findMatchingLinks(item);

    let applied = false;

    links.forEach((link) => {
        const cell =
            findFilenameCell(link);

        if (!cell) {
            return;
        }

        if (hasLabelContainer(cell)) {
            return;
        }

        cell.classList.add(
            LABEL_CELL_CLASS
        );

        const container =
            createLabelContainer(
                matchingRules
            );

        cell.appendChild(
            container
        );

        applied = true;
    });

    return applied;
}

/**
 * Adds labels to all matching
 * files in the main list.
 */
export function applyFileLabels(
    items: RepositoryItem[],
    rules: FileLabelRule[]
): number {
    let appliedCount = 0;

    const files =
        items.filter(
            (item) =>
                item.type === "file"
        );

    files.forEach((file) => {
        if (
            applyLabelsToFile(
                file,
                rules
            )
        ) {
            appliedCount++;
        }
    });

    return appliedCount;
}