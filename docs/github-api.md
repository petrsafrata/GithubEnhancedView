# GitHub API and File Sizes

GitHub Enhanced View uses the official GitHub REST API to retrieve repository tree metadata and file sizes.

## Public repositories

Public repositories normally work without authentication. These requests are subject to GitHub's unauthenticated API rate limit.

If the limit is reached, file sizes may remain unavailable until the limit resets or a token is configured.

## Private repositories

Private repository metadata requires an optional fine-grained personal access token with access to the selected repository.

## Recommended token permissions

Create a fine-grained token at:

https://github.com/settings/personal-access-tokens/new

Select only the repositories you intend to use and grant:

```text
Repository permissions → Contents → Read-only
```

Do not grant write permissions.

## Save a token

1. Open the extension options page.
2. Enter the token in the password field.
3. Select **Verify and save**.

Validation is performed by the background service worker. After validation, the input is cleared and the options page displays only masked token information.

## Remove a token

Select **Remove token** on the options page.

Removing or replacing the token also invalidates temporary API cache data associated with the previous token configuration.

## Token handling

The token:

- Is stored only in `chrome.storage.local`
- Is not stored in `chrome.storage.sync`, website storage, cookies, or the DOM
- Is never sent to content scripts or GitHub page scripts
- Is never placed in a request URL
- Is sent only to `https://api.github.com`
- Is sent only through the HTTP `Authorization` header
- Is not transmitted to the extension developer

!!! warning
    Treat the token as a password. Never include it in screenshots, logs, commits, or GitHub Issues. Revoke it through GitHub if exposure is suspected.

## Caching and large repositories

Repository tree responses are cached temporarily in `chrome.storage.session`. The cache does not contain the token, authorization headers, or absolute local paths.

GitHub may return a truncated recursive tree for very large repositories. In that situation, sizes may not be available for every file.

