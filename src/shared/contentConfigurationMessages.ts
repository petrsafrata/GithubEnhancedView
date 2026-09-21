import type {
    ExtensionSettings
} from "../settings/types";

import type {
    RepositoryMapping
} from "../settings/repositoryMappingsStorage";

export const GET_CONTENT_CONFIGURATION_MESSAGE =
    "GEV_GET_CONTENT_CONFIGURATION";

export const SET_FILE_FILTER_ENABLED_MESSAGE =
    "GEV_SET_FILE_FILTER_ENABLED";

export const CONTENT_CONFIGURATION_CHANGED_MESSAGE =
    "GEV_CONTENT_CONFIGURATION_CHANGED";

export const OPEN_OPTIONS_PAGE_MESSAGE =
    "GEV_OPEN_OPTIONS_PAGE";

export interface ContentConfiguration {
    settings: ExtensionSettings;
    repositoryMappings: RepositoryMapping[];
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