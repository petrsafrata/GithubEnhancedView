import type {
    ExtensionSettings
} from "./types";

export const DEFAULT_EXTENSION_SETTINGS:
    Readonly<ExtensionSettings> = {
        fileIconsEnabled: true,
        fileLabelsEnabled: true,
        fileFilterEnabled: false
    };