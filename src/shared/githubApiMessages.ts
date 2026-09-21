export const GET_REPOSITORY_TREE_MESSAGE =
    "GEV_GET_REPOSITORY_TREE";

export interface GetRepositoryTreeRequest {
    type:
        typeof GET_REPOSITORY_TREE_MESSAGE;

    payload: {
        owner: string;
        repository: string;
        ref: string;
    };
}

export interface GitHubFileSize {
    path: string;
    size: number;
}

export interface GetRepositoryTreeSuccess {
    success: true;

    files: GitHubFileSize[];

    truncated: boolean;

    rateLimit: {
        remaining?: number;
        resetAt?: number;
    };
}

export type GitHubApiErrorCode =
    | "INVALID_REQUEST"
    | "NOT_FOUND"
    | "RATE_LIMITED"
    | "UNAUTHORIZED"
    | "GITHUB_API_ERROR"
    | "INVALID_RESPONSE"
    | "NETWORK_ERROR";

export interface GetRepositoryTreeFailure {
    success: false;

    error: {
        code: GitHubApiErrorCode;
        message: string;
    };
}

export type GetRepositoryTreeResponse =
    | GetRepositoryTreeSuccess
    | GetRepositoryTreeFailure;