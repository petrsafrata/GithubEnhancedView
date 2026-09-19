export type RepositoryItemType = "file" | "directory";

export interface RepositoryItem {
    /**
     * Item name.
     *
     * For example:
     * README.md
     * src
     * package.json
     */
    name: string;

    /**
     * Item type.
     */
    type: RepositoryItemType;

    /**
     * Absolute URL to the item on GitHub.
     */
    href: string;

    /**
     * File extension without the dot.
     *
     * For example:
     * ts
     * js
     * json
     *
     * For directories, it will be undefined.
     */
    extension?: string;
}