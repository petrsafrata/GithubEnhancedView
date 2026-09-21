export const GET_GITHUB_TOKEN_STATUS_MESSAGE =
    "GEV_GET_GITHUB_TOKEN_STATUS";

export const SAVE_GITHUB_TOKEN_MESSAGE =
    "GEV_SAVE_GITHUB_TOKEN";

export const REMOVE_GITHUB_TOKEN_MESSAGE =
    "GEV_REMOVE_GITHUB_TOKEN";

export interface GetGitHubTokenStatusRequest {
    type:
        typeof GET_GITHUB_TOKEN_STATUS_MESSAGE;
}

export interface SaveGitHubTokenRequest {
    type:
        typeof SAVE_GITHUB_TOKEN_MESSAGE;

    payload: {
        token: string;
    };
}

export interface RemoveGitHubTokenRequest {
    type:
        typeof REMOVE_GITHUB_TOKEN_MESSAGE;
}

export interface GitHubTokenStatus {
    stored: boolean;

    /**
     * For example:
     * ••••a1b2
     */
    maskedToken?: string;
}

export type GitHubTokenErrorCode =
    | "INVALID_FORMAT"
    | "INVALID_TOKEN"
    | "VALIDATION_FAILED"
    | "STORAGE_ERROR";

export interface GitHubTokenSuccessResponse {
    success: true;
    status: GitHubTokenStatus;

    /**
     * It is returned only immediately after verification.
     * We do not store it in storage.
     */
    accountLogin?: string;
}

export interface GitHubTokenFailureResponse {
    success: false;
    error: GitHubTokenErrorCode;
}

export type GitHubTokenResponse =
    | GitHubTokenSuccessResponse
    | GitHubTokenFailureResponse;