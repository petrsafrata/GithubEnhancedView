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
}