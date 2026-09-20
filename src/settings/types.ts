export interface FileLabelRule {
    /**
     * Unique identifier for the rule.
     */
    id: string;

    /**
     * Text displayed on the label.
     */
    label: string;

    /**
     * Keywords searched for in the filename.
     */
    keywords: string[];

    /**
     * Text color.
     */
    textColor: string;

    /**
     * Background color.
     */
    backgroundColor: string;

    /**
     * Border color.
     */
    borderColor: string;

    /**
     * Whether the rule is enabled.
     */
    enabled: boolean;
}

export interface FileFilterRule {
    /**
     * A unique identifier for the rule.
     */
    id: string;

    /**
     * The filename or glob pattern.
     *
     * Examples:
     * .gitignore
     * *.lock
     * vite.config.*
     * tsconfig*.json
     */
    pattern: string;

    /**
     * Determines whether the rule is active.
     */
    enabled: boolean;
}

export interface ExtensionSettings {
    /**
     * Replaces GitHub icons with custom SVG icons.
     */
    fileIconsEnabled: boolean;

    /**
     * Displays automatic labels.
     */
    fileLabelsEnabled: boolean;

    /**
     * Hides configuration files.
     */
    fileFilterEnabled: boolean;

    /**
     * Configures file label rules.
     */
    fileLabelRules: FileLabelRule[];
    /**
     * Configures file filter rules.
     */
    fileFilterRules: FileFilterRule[];

}