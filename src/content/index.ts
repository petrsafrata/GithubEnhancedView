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
    applyFileLabels
} from "./features/fileLabels/fileLabels";

import {
    DEFAULT_EXTENSION_SETTINGS
} from "../settings/defaultSettings";

import {
    getExtensionSettings,
    observeExtensionSettings,
    saveExtensionSettings
} from "../settings/settingsStorage";

import type {
    ExtensionSettings
} from "../settings/types";

document.documentElement?.classList.add(
    "gev-initializing"
);

console.log(
    "[GitHub Enhanced View] loaded"
);

let processing = false;
let settingsInitialized = false;

let settings: ExtensionSettings = {
    ...DEFAULT_EXTENSION_SETTINGS
};

function removeFileIcons(): void {
    document
        .querySelectorAll<HTMLElement>(
            ".gev-file-icon, .gev-file-tree-icon"
        )
        .forEach((icon) => {
            icon.remove();
        });

    document
        .querySelectorAll<HTMLElement>(
            '[data-gev-native-file-icon="true"]'
        )
        .forEach((icon) => {
            icon.removeAttribute(
                "data-gev-native-file-icon"
            );
        });
}

function removeFileLabels(): void {
    document
        .querySelectorAll<HTMLElement>(
            '[data-gev-file-labels="true"]'
        )
        .forEach((container) => {
            container.remove();
        });

    document
        .querySelectorAll<HTMLElement>(
            ".gev-file-label-cell"
        )
        .forEach((cell) => {
            cell.classList.remove(
                "gev-file-label-cell"
            );
        });
}

function toggleFileFilter(): void {
    settings = {
        ...settings,

        fileFilterEnabled:
            !settings.fileFilterEnabled
    };

    void saveExtensionSettings(
        settings
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

        let appliedIconCount = 0;
        let appliedLabelCount = 0;

        if (
            settings.fileIconsEnabled
        ) {
            appliedIconCount +=
                applyFileIcons(items);

            appliedIconCount +=
                applyFileTreeIcons();
        } else {
            removeFileIcons();
        }

        if (
            settings.fileLabelsEnabled
        ) {
            appliedLabelCount =
                applyFileLabels(items);
        } else {
            removeFileLabels();
        }

        if (settingsInitialized) {
            applyFileFilter(
                settings.fileFilterEnabled
            );

            updateFilterButton(
                settings.fileFilterEnabled,
                toggleFileFilter
            );
        }

        if (appliedIconCount > 0) {
            console.debug(
                `[GitHub Enhanced View] Applied ${appliedIconCount} file icons.`
            );
        }

        if (appliedLabelCount > 0) {
            console.debug(
                `[GitHub Enhanced View] Applied labels to ${appliedLabelCount} files.`
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
        settings =
            await getExtensionSettings();

        settingsInitialized =
            true;

        enhanceRepository();

        observeGitHubDom(() => {
            enhanceRepository();
        });

        observeExtensionSettings(
            (newSettings) => {
                settings =
                    newSettings;

                enhanceRepository();
            }
        );
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