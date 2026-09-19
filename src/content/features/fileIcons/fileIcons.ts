import type {
    RepositoryItem
} from "../../github/types";

import {
    getFileIcon,
    type FileIconDefinition
} from "./iconMap";

import {
    createFileIconElement
} from "./iconElement";

const PROCESSED_ATTRIBUTE =
    "data-gev-icon-applied";

const NATIVE_ICON_ATTRIBUTE =
    "data-gev-native-file-icon";

const NATIVE_FILE_ICON_SELECTOR = [
    "svg.octicon-file",
    "svg.octicon-file-code",
    "svg.octicon-file-media",
    "svg.octicon-file-zip",
    'svg[aria-label="File"]',
    'svg[aria-label="file"]'
].join(", ");

interface IconTarget {
    container: HTMLElement;
    nativeIcon: SVGElement;
}

/**
 * Finds all links corresponding to
 * a specific file.
 */
function findMatchingLinks(
    item: RepositoryItem
): HTMLAnchorElement[] {
    const links =
        document.querySelectorAll<HTMLAnchorElement>(
            'a[href*="/blob/"]'
        );

    return Array.from(links).filter(
        (link) => link.href === item.href
    );
}

/**
 * Finds the closest parent element
 * that contains the original GitHub icon.
 */
function findIconTarget(
    link: HTMLAnchorElement
): IconTarget | null {
    let currentElement:
        HTMLElement | null = link;

    const maximumParentDepth = 6;

    for (
        let depth = 0;
        currentElement &&
        depth < maximumParentDepth;
        depth++
    ) {
        const nativeIcon =
            currentElement.querySelector<SVGElement>(
                NATIVE_FILE_ICON_SELECTOR
            );

        if (nativeIcon) {
            return {
                container: currentElement,
                nativeIcon
            };
        }

        currentElement =
            currentElement.parentElement;
    }

    return null;
}

/**
 * Applies the icon to a single found element.
 */
function applyIconToTarget(
    target: IconTarget,
    definition: FileIconDefinition
): boolean {
    const {
        container,
        nativeIcon
    } = target;

    if (
        container.querySelector(
            `[${PROCESSED_ATTRIBUTE}="true"]`
        )
    ) {
        return false;
    }

    const customIcon =
        createFileIconElement(
            definition
        );

    customIcon.setAttribute(
        PROCESSED_ATTRIBUTE,
        "true"
    );

    nativeIcon.setAttribute(
        NATIVE_ICON_ATTRIBUTE,
        "true"
    );

    nativeIcon.insertAdjacentElement(
        "afterend",
        customIcon
    );

    return true;
}

/**
 * Applies the icon to all occurrences
 * of a single file.
 */
function applyIconToFile(
    item: RepositoryItem
): number {
    const definition =
        getFileIcon(
            item.name,
            item.extension
        );

    if (!definition) {
        return 0;
    }

    const links =
        findMatchingLinks(item);

    const processedContainers =
        new Set<HTMLElement>();

    let appliedCount = 0;

    for (const link of links) {
        const target =
            findIconTarget(link);

        if (!target) {
            continue;
        }

        if (
            processedContainers.has(
                target.container
            )
        ) {
            continue;
        }

        processedContainers.add(
            target.container
        );

        if (
            applyIconToTarget(
                target,
                definition
            )
        ) {
            appliedCount++;
        }
    }

    return appliedCount;
}

/**
 * Applies the SVG icons to the files
 * in the main GitHub list.
 */
export function applyFileIcons(
    items: RepositoryItem[]
): number {
    let appliedCount = 0;

    for (const item of items) {
        if (item.type !== "file") {
            continue;
        }

        appliedCount +=
            applyIconToFile(item);
    }

    return appliedCount;
}