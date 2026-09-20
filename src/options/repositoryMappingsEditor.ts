import {
    getRepositoryMappings,
    normalizeRepositoryName,
    saveRepositoryMappings
} from "../settings/repositoryMappingsStorage";

import type {
    RepositoryMapping
} from "../settings/repositoryMappingsStorage";

const SAVE_DELAY =
    250;

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

function createMapping():
    RepositoryMapping {
    return {
        id:
            `repository-${crypto.randomUUID()}`,

        repository:
            "owner/repository",

        localPath: "",

        enabled: true
    };
}

export async function initializeRepositoryMappingsEditor():
    Promise<void> {
    const container =
        getElement(
            "repository-mappings"
        );

    const addButton =
        getButton(
            "add-repository-mapping"
        );

    const statusElement =
        getElement(
            "repository-mapping-status"
        );

    let mappings =
        await getRepositoryMappings();

    let saveTimeoutId:
        number | undefined;

    let statusTimeoutId:
        number | undefined;

    function showStatus(
        message: string
    ): void {
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

    async function save(): Promise<void> {
        await saveRepositoryMappings(
            mappings
        );

        showStatus(
            "Repository mappings saved."
        );
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
            window.setTimeout(
                () => {
                    void save();
                },
                SAVE_DELAY
            );
    }

    function updateMapping(
        id: string,
        changes:
            Partial<RepositoryMapping>
    ): void {
        mappings =
            mappings.map(
                (mapping) =>
                    mapping.id === id
                        ? {
                            ...mapping,
                            ...changes
                        }
                        : mapping
            );

        scheduleSave();
    }

    function removeMapping(
        id: string
    ): void {
        mappings =
            mappings.filter(
                (mapping) =>
                    mapping.id !== id
            );

        render();
        void save();
    }

    function createField(
        labelText: string,
        input: HTMLInputElement
    ): HTMLLabelElement {
        const field =
            document.createElement(
                "label"
            );

        field.className =
            "mapping-field";

        const label =
            document.createElement(
                "span"
            );

        label.className =
            "mapping-field__label";

        label.textContent =
            labelText;

        field.append(
            label,
            input
        );

        return field;
    }

    function createMappingElement(
        mapping: RepositoryMapping
    ): HTMLElement {
        const row =
            document.createElement(
                "article"
            );

        row.className =
            "repository-mapping";

        row.dataset.mappingId =
            mapping.id;

        row.classList.toggle(
            "repository-mapping--disabled",
            !mapping.enabled
        );

        const enabledLabel =
            document.createElement(
                "label"
            );

        enabledLabel.className =
            "repository-mapping__enabled";

        const enabledInput =
            document.createElement(
                "input"
            );

        enabledInput.type =
            "checkbox";

        enabledInput.checked =
            mapping.enabled;

        enabledInput.setAttribute(
            "aria-label",
            `Enable ${mapping.repository}`
        );

        enabledInput.addEventListener(
            "change",
            () => {
                updateMapping(
                    mapping.id,
                    {
                        enabled:
                            enabledInput.checked
                    }
                );

                row.classList.toggle(
                    "repository-mapping--disabled",
                    !enabledInput.checked
                );
            }
        );

        enabledLabel.appendChild(
            enabledInput
        );

        const repositoryInput =
            document.createElement(
                "input"
            );

        repositoryInput.type =
            "text";

        repositoryInput.className =
            "rule-input";

        repositoryInput.value =
            mapping.repository;

        repositoryInput.placeholder =
            "owner/repository";

        repositoryInput.spellcheck =
            false;

        repositoryInput.addEventListener(
            "input",
            () => {
                updateMapping(
                    mapping.id,
                    {
                        repository:
                            repositoryInput.value
                    }
                );
            }
        );

        repositoryInput.addEventListener(
            "blur",
            () => {
                const normalized =
                    normalizeRepositoryName(
                        repositoryInput.value
                    );

                repositoryInput.value =
                    normalized;

                updateMapping(
                    mapping.id,
                    {
                        repository:
                            normalized
                    }
                );
            }
        );

        const pathInput =
            document.createElement(
                "input"
            );

        pathInput.type =
            "text";

        pathInput.className =
            "rule-input mapping-path-input";

        pathInput.value =
            mapping.localPath;

        pathInput.placeholder =
            "C:\\Users\\name\\Projects\\repository";

        pathInput.spellcheck =
            false;

        pathInput.addEventListener(
            "input",
            () => {
                updateMapping(
                    mapping.id,
                    {
                        localPath:
                            pathInput.value
                    }
                );
            }
        );

        const removeButton =
            document.createElement(
                "button"
            );

        removeButton.type =
            "button";

        removeButton.className =
            "danger-button";

        removeButton.textContent =
            "Remove";

        removeButton.addEventListener(
            "click",
            () => {
                removeMapping(
                    mapping.id
                );
            }
        );

        row.append(
            enabledLabel,

            createField(
                "GitHub repository",
                repositoryInput
            ),

            createField(
                "Local directory",
                pathInput
            ),

            removeButton
        );

        return row;
    }

    function render(): void {
        container.replaceChildren();

        if (mappings.length === 0) {
            const empty =
                document.createElement(
                    "p"
                );

            empty.className =
                "repository-mappings__empty";

            empty.textContent =
                "No repository mappings configured.";

            container.appendChild(
                empty
            );

            return;
        }

        mappings.forEach((mapping) => {
            container.appendChild(
                createMappingElement(
                    mapping
                )
            );
        });
    }

    addButton.addEventListener(
        "click",
        () => {
            const mapping =
                createMapping();

            mappings = [
                ...mappings,
                mapping
            ];

            render();
            scheduleSave();

            const newRow =
                container.querySelector<HTMLElement>(
                    `[data-mapping-id="${mapping.id}"]`
                );

            newRow
                ?.querySelector<HTMLInputElement>(
                    'input[type="text"]'
                )
                ?.select();
        }
    );

    render();
}