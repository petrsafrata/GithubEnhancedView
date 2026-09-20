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
    applyVsCodeLinks,
    removeVsCodeLinks
} from "./features/vscodeLinks/vscodeLinks";

import {
    createDefaultExtensionSettings
} from "../settings/defaultSettings";

import {
    getExtensionSettings,
    observeExtensionSettings,
    saveExtensionSettings
} from "../settings/settingsStorage";

import {
    getRepositoryMappings,
    observeRepositoryMappings
} from "../settings/repositoryMappingsStorage";

import type {
    ExtensionSettings,
    FileLabelRule
} from "../settings/types";

import type {
    RepositoryMapping
} from "../settings/repositoryMappingsStorage";

document.documentElement?.classList.add(
    "gev-initializing"
);

console.log(
    "[GitHub Enhanced View] loaded"
);

let processing = false;
let settingsInitialized = false;

let settings: ExtensionSettings =
    createDefaultExtensionSettings();

let repositoryMappings:
    RepositoryMapping[] = [];

function getLabelRulesSignature(
    rules: FileLabelRule[]
): string {
    return JSON.stringify(rules);
}

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
        let appliedVsCodeLinkCount = 0;

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
                applyFileLabels(
                    items,
                    settings.fileLabelRules
                );
        } else {
            removeFileLabels();
        }

        appliedVsCodeLinkCount =
            applyVsCodeLinks(
                items,
                repositoryMappings
            );

        if (settingsInitialized) {
            applyFileFilter(
                settings.fileFilterEnabled,
                settings.fileFilterRules
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

        if (
            appliedVsCodeLinkCount > 0
        ) {
            console.debug(
                `[GitHub Enhanced View] Applied ${appliedVsCodeLinkCount} VS Code links.`
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
        const [
            loadedSettings,
            loadedMappings
        ] = await Promise.all([
            getExtensionSettings(),
            getRepositoryMappings()
        ]);

        settings =
            loadedSettings;

        repositoryMappings =
            loadedMappings;

        settingsInitialized =
            true;

        enhanceRepository();

        observeGitHubDom(() => {
            enhanceRepository();
        });

        observeExtensionSettings(
            (newSettings) => {
                const labelsChanged =
                    getLabelRulesSignature(
                        settings.fileLabelRules
                    ) !==
                    getLabelRulesSignature(
                        newSettings.fileLabelRules
                    );

                if (labelsChanged) {
                    removeFileLabels();
                }

                settings =
                    newSettings;

                enhanceRepository();
            }
        );

        observeRepositoryMappings(
            (newMappings) => {
                repositoryMappings =
                    newMappings;

                removeVsCodeLinks();
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