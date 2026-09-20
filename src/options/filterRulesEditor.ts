import {
    createDefaultFileFilterRules
} from "../settings/defaultFilterRules";

import type {
    FileFilterRule
} from "../settings/types";

export interface FilterRulesEditor {
    setRules(
        rules: FileFilterRule[]
    ): void;
}

interface FilterRulesEditorOptions {
    initialRules: FileFilterRule[];

    onChange: (
        rules: FileFilterRule[]
    ) => void;
}

function getElement(
    id: string
): HTMLElement {
    const element =
        document.getElementById(id);

    if (!element) {
        throw new Error(
            `Element "${id}" was not found.`
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

function cloneRules(
    rules: FileFilterRule[]
): FileFilterRule[] {
    return rules.map(
        (rule) => ({
            ...rule
        })
    );
}

function createCustomRule():
    FileFilterRule {
    return {
        id:
            `custom-filter-${crypto.randomUUID()}`,

        pattern: "*.lock",

        enabled: true
    };
}

export function initializeFilterRulesEditor(
    options: FilterRulesEditorOptions
): FilterRulesEditor {
    const container =
        getElement(
            "filter-rules"
        );

    const addButton =
        getButton(
            "add-filter-rule"
        );

    const restoreButton =
        getButton(
            "restore-filter-rules"
        );

    let rules =
        cloneRules(
            options.initialRules
        );

    function notifyChange(): void {
        options.onChange(
            cloneRules(rules)
        );
    }

    function updateRule(
        id: string,
        changes: Partial<FileFilterRule>
    ): void {
        rules = rules.map(
            (rule) =>
                rule.id === id
                    ? {
                        ...rule,
                        ...changes
                    }
                    : rule
        );

        notifyChange();
    }

    function removeRule(
        id: string
    ): void {
        rules = rules.filter(
            (rule) =>
                rule.id !== id
        );

        render();
        notifyChange();
    }

    function createRuleElement(
        rule: FileFilterRule
    ): HTMLElement {
        const row =
            document.createElement("div");

        row.className =
            "filter-rule";

        row.classList.toggle(
            "filter-rule--disabled",
            !rule.enabled
        );

        row.dataset.ruleId =
            rule.id;

        const enabledLabel =
            document.createElement("label");

        enabledLabel.className =
            "filter-rule__enabled";

        const enabledInput =
            document.createElement("input");

        enabledInput.type =
            "checkbox";

        enabledInput.checked =
            rule.enabled;

        enabledInput.setAttribute(
            "aria-label",
            `Enable ${rule.pattern}`
        );

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

                row.classList.toggle(
                    "filter-rule--disabled",
                    !enabledInput.checked
                );
            }
        );

        enabledLabel.appendChild(
            enabledInput
        );

        const patternField =
            document.createElement("label");

        patternField.className =
            "filter-rule__field";

        const fieldLabel =
            document.createElement("span");

        fieldLabel.className =
            "filter-rule__label";

        fieldLabel.textContent =
            "File pattern";

        const patternInput =
            document.createElement("input");

        patternInput.type =
            "text";

        patternInput.className =
            "rule-input";

        patternInput.value =
            rule.pattern;

        patternInput.placeholder =
            "Example: *.lock";

        patternInput.spellcheck =
            false;

        patternInput.addEventListener(
            "input",
            () => {
                updateRule(
                    rule.id,
                    {
                        pattern:
                            patternInput.value
                    }
                );
            }
        );

        patternField.append(
            fieldLabel,
            patternInput
        );

        const removeButton =
            document.createElement("button");

        removeButton.type =
            "button";

        removeButton.className =
            "danger-button";

        removeButton.textContent =
            "Remove";

        removeButton.setAttribute(
            "aria-label",
            `Remove ${rule.pattern}`
        );

        removeButton.addEventListener(
            "click",
            () => {
                removeRule(
                    rule.id
                );
            }
        );

        row.append(
            enabledLabel,
            patternField,
            removeButton
        );

        return row;
    }

    function render(): void {
        container.replaceChildren();

        if (rules.length === 0) {
            const empty =
                document.createElement("p");

            empty.className =
                "filter-rules__empty";

            empty.textContent =
                "No file filter rules configured.";

            container.appendChild(
                empty
            );

            return;
        }

        rules.forEach((rule) => {
            container.appendChild(
                createRuleElement(rule)
            );
        });
    }

    addButton.addEventListener(
        "click",
        () => {
            const newRule =
                createCustomRule();

            rules = [
                ...rules,
                newRule
            ];

            render();
            notifyChange();

            const newRow =
                container.querySelector<HTMLElement>(
                    `[data-rule-id="${newRule.id}"]`
                );

            newRow
                ?.querySelector<HTMLInputElement>(
                    'input[type="text"]'
                )
                ?.select();
        }
    );

    restoreButton.addEventListener(
        "click",
        () => {
            rules =
                createDefaultFileFilterRules();

            render();
            notifyChange();
        }
    );

    render();

    return {
        setRules(
            newRules: FileFilterRule[]
        ): void {
            rules =
                cloneRules(
                    newRules
                );

            render();
        }
    };
}