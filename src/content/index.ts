import "./styles.css";

import {
    getRepositoryItems
} from "./github/repositoryParser";

import {
    observeGitHubDom
} from "./github/domObserver";

import {
    applyFileIcons
} from "./features/fileIcons/fileIcons";

import {
    applyFileTreeIcons
} from "./features/fileIcons/fileTreeIcons";

import {
    applyFileFilter
} from "./features/fileFilter/fileFilter";

import {
    updateFilterButton
} from "./features/fileFilter/filterButton";

import {
    getFileFilterEnabled,
    setFileFilterEnabled
} from "./features/fileFilter/filterStorage";

import {
    applyFileLabels
} from "./features/fileLabels/fileLabels";

document.documentElement?.classList.add(
    "gev-initializing"
);

console.log(
    "[GitHub Enhanced View] loaded"
);

let processing = false;
let filterEnabled = false;
let filterInitialized = false;

function toggleFileFilter(): void {
    filterEnabled =
        !filterEnabled;

    void setFileFilterEnabled(
        filterEnabled
    );

    enhanceRepository();
}

function enhanceRepository(): void {
    if (processing) {
        return;
    }

    processing = true;

    try {
        const items =
            getRepositoryItems();

        const repositoryIconCount =
            applyFileIcons(items);

        const treeIconCount =
            applyFileTreeIcons();

        const labelCount =
            applyFileLabels(items);

        if (filterInitialized) {
            applyFileFilter(
                filterEnabled
            );

            updateFilterButton(
                filterEnabled,
                toggleFileFilter
            );
        }

        const appliedIconCount =
            repositoryIconCount +
            treeIconCount;

        if (appliedIconCount > 0) {
            console.debug(
                `[GitHub Enhanced View] Applied ${appliedIconCount} file icons.`
            );
        }

        if (labelCount > 0) {
            console.debug(
                `[GitHub Enhanced View] Applied labels to ${labelCount} files.`
            );
        }
    } finally {
        processing = false;
    }
}

function finishInitialization(): void {
    document.documentElement.classList.remove(
        "gev-initializing"
    );

    document.documentElement.classList.add(
        "gev-ready"
    );
}

async function init(): Promise<void> {
    try {
        filterEnabled =
            await getFileFilterEnabled();

        filterInitialized =
            true;

        enhanceRepository();

        observeGitHubDom(() => {
            enhanceRepository();
        });
    } finally {
        finishInitialization();
    }
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        () => {
            void init();
        },
        {
            once: true
        }
    );
} else {
    void init();
}