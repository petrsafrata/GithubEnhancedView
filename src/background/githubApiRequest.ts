export const GITHUB_API_ORIGIN =
    "https://api.github.com";

const GITHUB_API_VERSION =
    "2022-11-28";

interface GitHubApiRequestOptions {
    authenticationToken:
        string | null;

    signal:
        AbortSignal;
}

export async function fetchGitHubApi(
    endpoint: URL,
    options: GitHubApiRequestOptions
): Promise<Response> {
    if (
        endpoint.origin !==
        GITHUB_API_ORIGIN
    ) {
        throw new Error(
            "Invalid GitHub API origin."
        );
    }

    const headers:
        Record<string, string> = {
        Accept:
            "application/vnd.github+json",

        "X-GitHub-Api-Version":
            GITHUB_API_VERSION
    };

    if (options.authenticationToken) {
        headers.Authorization =
            `Bearer ${options.authenticationToken}`;
    }

    return fetch(
        endpoint.toString(),
        {
            method:
                "GET",

            headers,

            /*
             * Prevents the Authorization
             * header from being sent on redirects.
             */
            redirect:
                "error",

            credentials:
                "omit",

            cache:
                "no-store",

            referrerPolicy:
                "no-referrer",

            signal:
                options.signal
        }
    );
}