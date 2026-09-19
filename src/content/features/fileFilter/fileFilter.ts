import {
    shouldHideFile
} from "./filterRules";

const HIDDEN_ATTRIBUTE =
    "data-gev-filter-hidden";

/**
 * Skryje nebo obnoví konkrétní řádek.
 *
 * Používáme zároveň:
 * - vlastní atribut,
 * - nativní hidden,
 * - inline display: none !important.
 *
 * Díky tomu GitHub nemůže skrytí přepsat.
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
 * Vrátí název souboru z GitHub URL.
 */
function getFilenameFromHref(
    href: string
): string | null {
    try {
        const url = new URL(href);

        const parts = url.pathname
            .split("/")
            .filter(Boolean);

        const filename = parts.at(-1);

        if (!filename) {
            return null;
        }

        return decodeURIComponent(filename);
    } catch {
        return null;
    }
}

/**
 * Najde hlavní tabulkové řádky se soubory.
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
         * Levý adresářový strom zpracujeme zvlášť.
         */
        if (
            link.closest(
                '[data-testid="repos-file-tree-container"]'
            )
        ) {
            return;
        }

        const filename =
            getFilenameFromHref(link.href);

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

        result.set(row, filename);
    });

    return result;
}

/**
 * Získá název souboru v levém stromu.
 */
function getTreeItemFilename(
    item: HTMLElement
): string | null {
    /*
     * GitHub ukládá název položky také do ID:
     *
     * například:
     * frontend/.gitignore-item
     */
    if (item.id.endsWith("-item")) {
        const withoutSuffix =
            item.id.slice(0, -5);

        const parts =
            withoutSuffix.split("/");

        const filename =
            parts.at(-1)?.trim();

        if (filename) {
            return filename;
        }
    }

    /*
     * Záložní varianta pro případ změny GitHub DOM.
     */
    const text =
        item.textContent?.trim();

    if (!text) {
        return null;
    }

    const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    return lines.at(-1) ?? null;
}

/**
 * Najde soubory v levém adresářovém stromu.
 *
 * Adresáře mají aria-expanded.
 * Soubory tento atribut nemají.
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

        result.set(item, filename);
    });

    return result;
}

/**
 * Obnoví všechny prvky, které filtr dříve skryl.
 *
 * To je důležité také při navigaci GitHubu bez
 * klasického obnovení stránky.
 */
function restorePreviouslyHiddenElements(): void {
    const elements =
        document.querySelectorAll<HTMLElement>(
            `[${HIDDEN_ATTRIBUTE}="true"]`
        );

    elements.forEach((element) => {
        setElementHidden(
            element,
            false
        );
    });
}

/**
 * Zapne nebo vypne filtrování konfiguračních souborů.
 */
export function applyFileFilter(
    enabled: boolean
): number {
    restorePreviouslyHiddenElements();

    if (!enabled) {
        return 0;
    }

    let hiddenCount = 0;

    const repositoryRows =
        getRepositoryFileRows();

    repositoryRows.forEach(
        (filename, row) => {
            if (!shouldHideFile(filename)) {
                return;
            }

            setElementHidden(
                row,
                true
            );

            hiddenCount++;
        }
    );

    const treeItems =
        getFileTreeItems();

    treeItems.forEach(
        (filename, item) => {
            if (!shouldHideFile(filename)) {
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