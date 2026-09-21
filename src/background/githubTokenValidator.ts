import {
    fetchGitHubApi,
    GITHUB_API_ORIGIN
} from "./githubApiRequest";

const VALIDATION_TIMEOUT_MS =
    15_000;

export type GitHubTokenValidationResult =
    | {
        valid: true;
        accountLogin: string;
    }
    | {
        valid: false;

        reason:
            | "INVALID_TOKEN"
            | "VALIDATION_FAILED";
    };

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null
    );
}

export async function validateGitHubToken(
    token: string
): Promise<GitHubTokenValidationResult> {
    const controller =
        new AbortController();

    const timeoutId =
        setTimeout(
            () => {
                controller.abort();
            },
            VALIDATION_TIMEOUT_MS
        );

    try {
        const endpoint =
            new URL(
                "/user",
                GITHUB_API_ORIGIN
            );

        const response =
            await fetchGitHubApi(
                endpoint,
                {
                    authenticationToken:
                        token,

                    signal:
                        controller.signal
                }
            );

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            return {
                valid: false,
                reason:
                    "INVALID_TOKEN"
            };
        }

        if (!response.ok) {
            return {
                valid: false,
                reason:
                    "VALIDATION_FAILED"
            };
        }

        const rawData: unknown =
            await response.json();

        if (!isRecord(rawData)) {
            return {
                valid: false,
                reason:
                    "VALIDATION_FAILED"
            };
        }

        const login =
            rawData.login;

        if (
            typeof login !== "string" ||
            login.length < 1 ||
            login.length > 100
        ) {
            return {
                valid: false,
                reason:
                    "VALIDATION_FAILED"
            };
        }

        return {
            valid: true,
            accountLogin:
                login
        };
    } catch {
        /*
         * Token, URL and HTTP headers
         * are intentionally not logged.
         */
        return {
            valid: false,
            reason:
                "VALIDATION_FAILED"
        };
    } finally {
        clearTimeout(
            timeoutId
        );
    }
}