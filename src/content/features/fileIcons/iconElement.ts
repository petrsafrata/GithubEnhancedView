import type {
    FileIconDefinition
} from "./iconMap";

export function createFileIconElement(
    definition: FileIconDefinition,
    additionalClass?: string
): HTMLImageElement {
    const element =
        document.createElement("img");

    element.className =
        additionalClass
            ? `gev-file-icon ${additionalClass}`
            : "gev-file-icon";

    element.src =
        chrome.runtime.getURL(
            definition.path
        );

    element.alt = "";

    element.title =
        definition.label;

    element.draggable =
        false;

    element.setAttribute(
        "data-gev-file-icon",
        "true"
    );

    element.setAttribute(
        "aria-hidden",
        "true"
    );

    return element;
}