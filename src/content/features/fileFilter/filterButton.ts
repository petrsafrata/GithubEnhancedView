const BUTTON_ID =
    "gev-file-filter-button";

export type FilterToggleCallback =
    () => void;

function createButton(
    onToggle: FilterToggleCallback
): HTMLButtonElement {
    const button =
        document.createElement("button");

    button.id =
        BUTTON_ID;

    button.type =
        "button";

    button.className =
        "gev-filter-button";

    button.addEventListener(
        "click",
        () => {
            onToggle();
        }
    );

    document.body.appendChild(
        button
    );

    return button;
}

export function updateFilterButton(
    enabled: boolean,
    onToggle: FilterToggleCallback
): void {
    let button =
        document.getElementById(
            BUTTON_ID
        ) as HTMLButtonElement | null;

    if (!button) {
        button =
            createButton(
                onToggle
            );
    }

    const text =
        enabled
            ? "Show config files"
            : "Hide config files";

    /**
     * Text měníme pouze tehdy, když je opravdu
     * jiný. Zabráníme zbytečným DOM mutacím.
     */
    if (button.textContent !== text) {
        button.textContent =
            text;
    }

    button.setAttribute(
        "aria-pressed",
        String(enabled)
    );

    button.title =
        enabled
            ? "Show hidden configuration files"
            : "Hide configuration files";
}