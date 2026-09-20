import "./styles.css";

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

const iconsInput =
    getCheckbox(
        "file-icons-enabled"
    );

const labelsInput =
    getCheckbox(
        "file-labels-enabled"
    );

const filterInput =
    getCheckbox(
        "file-filter-enabled"
    );

const resetButton =
    getButton(
        "reset-settings"
    );

const statusElement =
    document.getElementById(
        "save-status"
    );

let statusTimeoutId:
    number | undefined;

function getCheckbox(
    id: string
): HTMLInputElement {
    const element =
        document.getElementById(id);

    if (
        !(
            element instanceof
            HTMLInputElement
        )
    ) {
        throw new Error(
            `Checkbox "${id}" was not found.`
        );
    }

    return element;
}

function getButton(
    id: string
): HTMLButtonElement {
    const element =
        document.getElementById(id);

    if (
        !(
            element instanceof
            HTMLButtonElement
        )
    ) {
        throw new Error(
            `Button "${id}" was not found.`
        );
    }

    return element;
}

function renderSettings(
    settings: ExtensionSettings
): void {
    iconsInput.checked =
        settings.fileIconsEnabled;

    labelsInput.checked =
        settings.fileLabelsEnabled;

    filterInput.checked =
        settings.fileFilterEnabled;
}

function getSettingsFromForm():
    ExtensionSettings {
    return {
        fileIconsEnabled:
            iconsInput.checked,

        fileLabelsEnabled:
            labelsInput.checked,

        fileFilterEnabled:
            filterInput.checked
    };
}

function showStatus(
    message: string
): void {
    if (!statusElement) {
        return;
    }

    statusElement.textContent =
        message;

    if (
        statusTimeoutId !== undefined
    ) {
        window.clearTimeout(
            statusTimeoutId
        );
    }

    statusTimeoutId =
        window.setTimeout(
            () => {
                statusElement.textContent =
                    "";
            },
            1800
        );
}

async function saveForm(): Promise<void> {
    await saveExtensionSettings(
        getSettingsFromForm()
    );

    showStatus(
        "Settings saved."
    );
}

async function resetSettings():
    Promise<void> {
    const settings: ExtensionSettings = {
        ...DEFAULT_EXTENSION_SETTINGS
    };

    renderSettings(settings);

    await saveExtensionSettings(
        settings
    );

    showStatus(
        "Default settings restored."
    );
}

async function init(): Promise<void> {
    const settings =
        await getExtensionSettings();

    renderSettings(settings);

    iconsInput.addEventListener(
        "change",
        () => {
            void saveForm();
        }
    );

    labelsInput.addEventListener(
        "change",
        () => {
            void saveForm();
        }
    );

    filterInput.addEventListener(
        "change",
        () => {
            void saveForm();
        }
    );

    resetButton.addEventListener(
        "click",
        () => {
            void resetSettings();
        }
    );

    observeExtensionSettings(
        renderSettings
    );
}

void init();