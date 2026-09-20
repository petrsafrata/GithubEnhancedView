import {
    createDefaultFileLabelRules
} from "./defaultLabelRules";

import {
    createDefaultFileFilterRules
} from "./defaultFilterRules";

import type {
    ExtensionSettings
} from "./types";

export function createDefaultExtensionSettings():
    ExtensionSettings {
    return {
        fileIconsEnabled: true,
        fileLabelsEnabled: true,
        fileFilterEnabled: false,

        fileLabelRules:
            createDefaultFileLabelRules(),

        fileFilterRules:
            createDefaultFileFilterRules()
    };
}