import "./styles.css";

import {
    createDefaultExtensionSettings
} from "../settings/defaultSettings";

import {
    createDefaultFileLabelRules
} from "../settings/defaultLabelRules";

import {
    getExtensionSettings,
    saveExtensionSettings
} from "../settings/settingsStorage";

import type {
    ExtensionSettings,
    FileLabelRule
} from "../settings/types";

import {
    initializeFilterRulesEditor
} from "./filterRulesEditor";

import type {
    FilterRulesEditor
} from "./filterRulesEditor";

import {
    initializeRepositoryMappingsEditor
} from "./repositoryMappingsEditor";

import {
    initializeGitHubTokenEditor
} from "./githubTokenEditor";

const iconsInput =
    getCheckbox("file-icons-enabled");

const labelsInput =
    getCheckbox("file-labels-enabled");

const filterInput =
    getCheckbox("file-filter-enabled");

const resetButton =
    getButton("reset-settings");

const addRuleButton =
    getButton("add-label-rule");

const restoreRulesButton =
    getButton("restore-label-rules");

const rulesContainer =
    document.getElementById(
        "label-rules"
    );

const statusElement =
    document.getElementById(
        "save-status"
    );

let settings =
    createDefaultExtensionSettings();

let saveTimeoutId:
    number | undefined;

let statusTimeoutId:
    number | undefined;

let filterRulesEditor:
    FilterRulesEditor | null = null;

function getCheckbox(
    id: string
): HTMLInputElement {
    const element =
        document.getElementById(id);

    if (
        !(element instanceof HTMLInputElement)
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
        !(element instanceof HTMLButtonElement)
    ) {
        throw new Error(
            `Button "${id}" was not found.`
        );
    }

    return element;
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
        window.setTimeout(() => {
            statusElement.textContent =
                "";
        }, 1800);
}

async function saveSettings():
    Promise<void> {
    await saveExtensionSettings(
        settings
    );

    showStatus("Settings saved.");
}

function scheduleSave(): void {
    if (
        saveTimeoutId !== undefined
    ) {
        window.clearTimeout(
            saveTimeoutId
        );
    }

    saveTimeoutId =
        window.setTimeout(() => {
            void saveSettings();
        }, 250);
}

function updateRule(
    id: string,
    changes: Partial<FileLabelRule>
): void {
    settings = {
        ...settings,

        fileLabelRules:
            settings.fileLabelRules.map(
                (rule) =>
                    rule.id === id
                        ? {
                            ...rule,
                            ...changes
                        }
                        : rule
            )
    };

    scheduleSave();
}

function parseKeywords(
    value: string
): string[] {
    return Array.from(
        new Set(
            value
                .split(/[,\n]/)
                .map((keyword) =>
                    keyword
                        .trim()
                        .toLowerCase()
                )
                .filter(Boolean)
        )
    );
}

function createTextInput(
    value: string
): HTMLInputElement {
    const input =
        document.createElement("input");

    input.type = "text";
    input.value = value;
    input.className =
        "rule-input";

    return input;
}

function createColorInput(
    value: string
): HTMLInputElement {
    const input =
        document.createElement("input");

    input.type = "color";
    input.value = value;
    input.className =
        "rule-color";

    return input;
}

function createField(
    labelText: string,
    control: HTMLElement
): HTMLLabelElement {
    const field =
        document.createElement("label");

    field.className =
        "rule-field";

    const label =
        document.createElement("span");

    label.className =
        "rule-field__label";

    label.textContent =
        labelText;

    field.append(
        label,
        control
    );

    return field;
}

function createRuleElement(
    rule: FileLabelRule
): HTMLElement {
    const card =
        document.createElement("article");

    card.className =
        "label-rule";

    card.dataset.ruleId =
        rule.id;

    const header =
        document.createElement("div");

    header.className =
        "label-rule__header";

    const enabledLabel =
        document.createElement("label");

    enabledLabel.className =
        "rule-enabled";

    const enabledInput =
        document.createElement("input");

    enabledInput.type =
        "checkbox";

    enabledInput.checked =
        rule.enabled;

    enabledInput.addEventListener(
        "change",
        () => {
            updateRule(
                rule.id,
                {
                    enabled:
                        enabledInput.checked
                }
            );

            card.classList.toggle(
                "label-rule--disabled",
                !enabledInput.checked
            );
        }
    );

    const enabledText =
        document.createElement("span");

    enabledText.textContent =
        rule.label;

    enabledLabel.append(
        enabledInput,
        enabledText
    );

    const removeButton =
        document.createElement("button");

    removeButton.type =
        "button";

    removeButton.className =
        "danger-button";

    removeButton.textContent =
        "Remove";

    removeButton.addEventListener(
        "click",
        () => {
            settings = {
                ...settings,

                fileLabelRules:
                    settings.fileLabelRules
                        .filter(
                            (item) =>
                                item.id !== rule.id
                        )
            };

            renderRules();
            void saveSettings();
        }
    );

    header.append(
        enabledLabel,
        removeButton
    );

    const fields =
        document.createElement("div");

    fields.className =
        "label-rule__fields";

    const labelInput =
        createTextInput(
            rule.label
        );

    labelInput.addEventListener(
        "input",
        () => {
            updateRule(
                rule.id,
                {
                    label:
                        labelInput.value
                }
            );

            enabledText.textContent =
                labelInput.value ||
                "Unnamed label";
        }
    );

    const keywordsInput =
        document.createElement(
            "textarea"
        );

    keywordsInput.className =
        "rule-input rule-textarea";

    keywordsInput.rows = 2;

    keywordsInput.value =
        rule.keywords.join(", ");

    keywordsInput.addEventListener(
        "input",
        () => {
            updateRule(
                rule.id,
                {
                    keywords:
                        parseKeywords(
                            keywordsInput.value
                        )
                }
            );
        }
    );

    const textColorInput =
        createColorInput(
            rule.textColor
        );

    textColorInput.addEventListener(
        "input",
        () => {
            updateRule(
                rule.id,
                {
                    textColor:
                        textColorInput.value
                }
            );
        }
    );

    const backgroundColorInput =
        createColorInput(
            rule.backgroundColor
        );

    backgroundColorInput.addEventListener(
        "input",
        () => {
            updateRule(
                rule.id,
                {
                    backgroundColor:
                        backgroundColorInput.value
                }
            );
        }
    );

    const borderColorInput =
        createColorInput(
            rule.borderColor
        );

    borderColorInput.addEventListener(
        "input",
        () => {
            updateRule(
                rule.id,
                {
                    borderColor:
                        borderColorInput.value
                }
            );
        }
    );

    fields.append(
        createField(
            "Label",
            labelInput
        ),

        createField(
            "Keywords",
            keywordsInput
        ),

        createField(
            "Text color",
            textColorInput
        ),

        createField(
            "Background",
            backgroundColorInput
        ),

        createField(
            "Border",
            borderColorInput
        )
    );

    card.append(
        header,
        fields
    );

    card.classList.toggle(
        "label-rule--disabled",
        !rule.enabled
    );

    return card;
}

function renderRules(): void {
    if (!rulesContainer) {
        return;
    }

    rulesContainer.replaceChildren();

    if (
        settings.fileLabelRules.length === 0
    ) {
        const empty =
            document.createElement("p");

        empty.className =
            "label-rules__empty";

        empty.textContent =
            "No label rules configured.";

        rulesContainer.appendChild(
            empty
        );

        return;
    }

    settings.fileLabelRules.forEach(
        (rule) => {
            rulesContainer.appendChild(
                createRuleElement(rule)
            );
        }
    );
}

function renderSettings(): void {
    iconsInput.checked =
        settings.fileIconsEnabled;

    labelsInput.checked =
        settings.fileLabelsEnabled;

    filterInput.checked =
        settings.fileFilterEnabled;

    renderRules();
}

function createCustomRule():
    FileLabelRule {
    return {
        id:
            `custom-${crypto.randomUUID()}`,

        label: "NEW LABEL",

        keywords: [
            "keyword"
        ],

        textColor: "#ffffff",
        backgroundColor: "#30363d",
        borderColor: "#6e7681",

        enabled: true
    };
}

async function init(): Promise<void> {
    settings =
        await getExtensionSettings();

    renderSettings();

    filterRulesEditor =
        initializeFilterRulesEditor({
            initialRules:
                settings.fileFilterRules,

            onChange: (
                rules
            ) => {
                settings = {
                    ...settings,

                    fileFilterRules:
                        rules
                };

                scheduleSave();
            }
        });

    iconsInput.addEventListener(
        "change",
        () => {
            settings = {
                ...settings,
                fileIconsEnabled:
                    iconsInput.checked
            };

            void saveSettings();
        }
    );

    labelsInput.addEventListener(
        "change",
        () => {
            settings = {
                ...settings,
                fileLabelsEnabled:
                    labelsInput.checked
            };

            void saveSettings();
        }
    );

    filterInput.addEventListener(
        "change",
        () => {
            settings = {
                ...settings,
                fileFilterEnabled:
                    filterInput.checked
            };

            void saveSettings();
        }
    );

    addRuleButton.addEventListener(
        "click",
        () => {
            settings = {
                ...settings,

                fileLabelRules: [
                    ...settings.fileLabelRules,
                    createCustomRule()
                ]
            };

            renderRules();
            void saveSettings();
        }
    );

    restoreRulesButton.addEventListener(
        "click",
        () => {
            settings = {
                ...settings,

                fileLabelRules:
                    createDefaultFileLabelRules()
            };

            renderRules();
            void saveSettings();
        }
    );

    resetButton.addEventListener(
        "click",
        () => {
            settings =
                createDefaultExtensionSettings();

            renderSettings();

            filterRulesEditor?.setRules(
                settings.fileFilterRules
            );

            void saveSettings();
        }
    );

    await initializeRepositoryMappingsEditor();
    await initializeGitHubTokenEditor();
}

void init();