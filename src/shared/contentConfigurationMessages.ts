import type {
    ExtensionSettings
} from "../settings/types";

export const GET_CONTENT_CONFIGURATION_MESSAGE =
    "GEV_GET_CONTENT_CONFIGURATION";

export const SET_FILE_FILTER_ENABLED_MESSAGE =
    "GEV_SET_FILE_FILTER_ENABLED";

export const CONTENT_CONFIGURATION_CHANGED_MESSAGE =
    "GEV_CONTENT_CONFIGURATION_CHANGED";

export const OPEN_OPTIONS_PAGE_MESSAGE =
    "GEV_OPEN_OPTIONS_PAGE";

export const OPEN_FILE_IN_VSCODE_MESSAGE =
    "GEV_OPEN_FILE_IN_VSCODE";

/**
 * Safe repository mapping metadata that may be
 * sent to a content script.
 *
 * The absolute local path must never be included.
 */
export interface ContentRepositoryMapping {
    id: string;
    repository: string;
    enabled: boolean;
}

export interface ContentConfiguration {
    settings: ExtensionSettings;

    repositoryMappings:
        ContentRepositoryMapping[];
}

export interface GetContentConfigurationRequest {
    type:
        typeof GET_CONTENT_CONFIGURATION_MESSAGE;
}

export interface SetFileFilterEnabledRequest {
    type:
        typeof SET_FILE_FILTER_ENABLED_MESSAGE;

    payload: {
        enabled: boolean;
    };
}

export interface ContentConfigurationChangedMessage {
    type:
        typeof CONTENT_CONFIGURATION_CHANGED_MESSAGE;

    payload: ContentConfiguration;
}

export interface GetContentConfigurationSuccess {
    success: true;
    configuration: ContentConfiguration;
}

export interface ContentConfigurationFailure {
    success: false;
}

export type GetContentConfigurationResponse =
    | GetContentConfigurationSuccess
    | ContentConfigurationFailure;

export interface UpdateContentConfigurationResponse {
    success: boolean;
}

export interface OpenOptionsPageRequest {
    type:
        typeof OPEN_OPTIONS_PAGE_MESSAGE;
}

export interface OpenOptionsPageResponse {
    success: boolean;
}

export interface OpenFileInVsCodeRequest {
    type:
        typeof OPEN_FILE_IN_VSCODE_MESSAGE;

    payload: {
        mappingId: string;
        repository: string;
        relativePath: string;
    };
}

export type OpenFileInVsCodeErrorCode =
    | "INVALID_REQUEST"
    | "MAPPING_NOT_FOUND"
    | "OPEN_FAILED";

export interface OpenFileInVsCodeSuccess {
    success: true;
}

export interface OpenFileInVsCodeFailure {
    success: false;

    error: {
        code:
            OpenFileInVsCodeErrorCode;
    };
}

export type OpenFileInVsCodeResponse =
    | OpenFileInVsCodeSuccess
    | OpenFileInVsCodeFailure;