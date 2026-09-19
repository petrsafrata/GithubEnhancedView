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

document.documentElement?.classList.add(
    "gev-initializing"
);

console.log(
    "[GitHub Enhanced View] loaded"
);

let processing = false;

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

        const appliedCount =
            repositoryIconCount +
            treeIconCount;

        if (appliedCount > 0) {
            console.debug(
                `[GitHub Enhanced View] Applied ${appliedCount} file icons.`
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

function init(): void {
    try {
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
        init,
        {
            once: true
        }
    );
} else {
    init();
}