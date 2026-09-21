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
    applyFileSizes
} from "./features/fileSizes/fileSizes";

import {
    createDefaultExtensionSettings
} from "../settings/defaultSettings";

import {
    getContentConfiguration,
    observeContentConfiguration,
    setFileFilterEnabled
} from "./settings/contentConfigurationClient";

import type {
    ExtensionSettings,
    FileLabelRule
} from "../settings/types";

import type {
    ContentRepositoryMapping
} from "../shared/contentConfigurationMessages";

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
    ContentRepositoryMapping[] = [];

function getLabelRulesSignature(
    rules: FileLabelRule[]
): string {
    return JSON.stringify(rules);
}

function getMappingsSignature(
    mappings:
        ContentRepositoryMapping[]
): string {
    return JSON.stringify(mappings);
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

    void setFileFilterEnabled(
        settings.fileFilterEnabled
    );

    enhanceRepository();
}

function applyConfiguration(
    newSettings: ExtensionSettings,
    newMappings:
        ContentRepositoryMapping[]
): void {
    const labelsChanged =
        getLabelRulesSignature(
            settings.fileLabelRules
        ) !==
        getLabelRulesSignature(
            newSettings.fileLabelRules
        );

    const mappingsChanged =
        getMappingsSignature(
            repositoryMappings
        ) !==
        getMappingsSignature(
            newMappings
        );

    if (labelsChanged) {
        removeFileLabels();
    }

    if (mappingsChanged) {
        removeVsCodeLinks();
    }

    settings =
        newSettings;

    repositoryMappings =
        newMappings;

    settingsInitialized =
        true;
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

        applyFileSizes(items);

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
        const configuration =
            await getContentConfiguration();

        if (configuration) {
            applyConfiguration(
                configuration.settings,
                configuration
                    .repositoryMappings
            );
        } else {
            settingsInitialized =
                true;
        }

        enhanceRepository();

        observeGitHubDom(() => {
            enhanceRepository();
        });

        observeContentConfiguration(
            (newConfiguration) => {
                applyConfiguration(
                    newConfiguration.settings,
                    newConfiguration
                        .repositoryMappings
                );

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