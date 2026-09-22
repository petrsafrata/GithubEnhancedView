# Privacy Policy

**Effective date:** September 21, 2026  
**Last updated:** September 21, 2026

GitHub Enhanced View is a browser extension that provides additional repository navigation and display features on GitHub.

This policy explains what data the extension processes, where that data is stored, and when data is transmitted outside the browser.

## Summary

GitHub Enhanced View:

- Does not use analytics
- Does not display advertising
- Does not track users across websites
- Does not sell personal information
- Does not operate a developer-controlled backend service
- Does not transmit data to the extension developer
- Stores extension settings locally on the user's device
- Communicates only with GitHub's API when repository metadata or token validation is requested
- Does not expose GitHub tokens or absolute local filesystem paths to GitHub pages

## Data processed by the extension

### GitHub repository information

When a user visits a supported GitHub repository page, the extension may process:

- Repository owner
- Repository name
- Git reference or branch
- File and directory names
- Relative repository paths
- Repository page links
- File metadata returned by the GitHub API
- File sizes returned by the GitHub API

This information is used only to provide the extension's repository enhancement features, including file icons, labels, filtering, file sizes, and local editor actions.

Repository page content is processed locally by the content script.

### GitHub API token

Users may optionally provide a fine-grained GitHub personal access token.

The token is used to:

- Validate the token with GitHub
- Access repository metadata
- Access private repositories selected by the user
- Increase the GitHub API rate limit

The token:

- Is optional
- Is stored only in `chrome.storage.local`
- Is not stored in `chrome.storage.sync`
- Is not stored in website storage, cookies, or the GitHub page
- Is not sent to content scripts
- Is not inserted into the DOM
- Is not included in URLs
- Is not written to extension logs
- Is sent only to `https://api.github.com`
- Is sent only in the HTTP `Authorization` header
- Is never sent to the extension developer

The options page displays only a masked representation of a stored token.

The token is stored within the browser's extension storage area. It is not separately encrypted by GitHub Enhanced View. Users should therefore use a fine-grained token with the minimum required repository access and read-only permissions.

### Local repository mappings

Users may optionally map a GitHub repository to a local directory.

A mapping may contain:

- An internal mapping identifier
- A GitHub repository name
- An absolute local filesystem path
- An enabled or disabled state

Repository mappings are stored only in `chrome.storage.local`.

Absolute local paths are available only to trusted extension contexts. They are not sent to GitHub content scripts and are not inserted into GitHub's DOM.

The GitHub content script receives only the non-sensitive mapping information needed to display an editor button, such as the mapping identifier and repository name.

When the user explicitly selects an **Open in VS Code** action:

1. The content script sends the mapping identifier and relative repository path to the background service worker.
2. The background service worker validates the request.
3. The background service worker reads the absolute local path from extension storage.
4. It creates a local `vscode://` URL.
5. The browser passes that URL to the locally registered Visual Studio Code protocol handler.

The absolute local path is not returned to the GitHub page and is not transmitted to the extension developer.

### Extension settings

The extension stores user preferences such as:

- Whether file icons are enabled
- Whether file labels are enabled
- Whether configuration-file filtering is enabled
- File label rules
- File filter rules
- Repository mappings

These settings are stored in `chrome.storage.local` on the user's device.

The extension does not use `chrome.storage.sync`, so settings and sensitive values are not synchronized through the user's Google account.

### Temporary repository cache

The extension may temporarily cache GitHub repository tree information, including relative file paths and file sizes.

This cache:

- Is stored in `chrome.storage.session`
- Does not contain the GitHub token
- Does not contain authorization headers
- Does not contain absolute local filesystem paths
- Is separated when the token configuration changes
- Is cleared when the token is changed or removed
- Is temporary and does not use Chrome synchronization

## Data transmitted to GitHub

The extension communicates with:

```text
https://api.github.com
```

Requests may include:

- Repository owner
- Repository name
- Git reference
- Standard GitHub API headers
- The optional GitHub token in the Authorization header

These requests are required to validate a token or retrieve repository metadata used by a user-facing feature.

GitHub processes these requests according to GitHub's own privacy statement:

https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement

GitHub Enhanced View does not control GitHub's processing of API requests, account data, or server logs.

## Data transmitted to the developer

GitHub Enhanced View does not transmit personal information, repository information, GitHub tokens, local paths, settings, or usage information to the extension developer.

The project does not operate:

- Analytics endpoints
- Advertising services
- Telemetry servers
- Error-reporting services
- Tracking pixels
- Developer-controlled API proxies

## Third-party services

The extension communicates with GitHub only for its GitHub API functionality.

It does not send extension data to third-party analytics, advertising, artificial intelligence, or error-reporting providers.

Opening a local file in Visual Studio Code uses the locally registered vscode:// protocol handler and occurs only after a user action.

## Chrome permissions

The extension requests only permissions needed for its current functionality.

`storage`
Used to store:

- Extension settings
- File label and filter rules
- Repository mappings
- The optional GitHub API token
- Temporary repository metadata cache

Access to `https://github.com/*`

Used to provide repository-page enhancements such as:

- File icons
- Labels
- File filtering
- File sizes
- VS Code actions

Access to `https://api.github.com/*`

Used by the background service worker to:

- Validate an optional GitHub token
- Retrieve repository tree metadata
- Retrieve file-size information
- Access metadata for private repositories authorized by the user

The extension does not request access to all websites.

## Data retention and deletion

Data stored by the extension remains on the user's device until it is removed by the user, reset by the extension, or deleted when the extension is uninstalled.

Users can:

- Remove the GitHub token from the options page
- Remove individual repository mappings
- Restore extension settings to their defaults
- Clear the extension's storage through Chrome
- Uninstall the extension

Removing or replacing a token also clears temporary API cache data associated with the previous token configuration.

Uninstalling the extension causes Chrome to remove storage associated with the extension.

Removing data from the extension does not remove information that GitHub may retain independently as part of GitHub API or account logs.

## Security

The extension uses security controls intended to limit exposure of sensitive data:

- Authenticated API communication occurs only in the background service worker.
- API requests use HTTPS.
- Redirects are rejected for authenticated GitHub API requests.
- Credentials are not placed in request URLs.
- Content scripts cannot access the stored token.
- Content scripts cannot access absolute local repository paths.
- Privileged runtime messages are validated.
- API responses are treated as untrusted input.
- Sensitive values are excluded from logs and error messages.
- No remotely hosted code is executed.

No storage or software system can be guaranteed to be completely secure. Users should create a fine-grained GitHub token limited to selected repositories and grant only:

`Repository permissions → Contents → Read-only`

Users should revoke the token through GitHub if they believe it has been exposed.

## Children's privacy

GitHub Enhanced View is a developer tool and is not directed specifically at children.

The extension does not knowingly collect personal information from children.

## Chrome Web Store Limited Use disclosure

GitHub Enhanced View's use and transfer of information received from Google Chrome APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements.

Data accessed through Chrome extension permissions is used only to provide or improve user-facing functionality described in this policy.

The extension does not use this data for advertising, profiling, credit assessment, or sale to third parties.

## Changes to this policy

This policy may be updated when the extension's functionality, permissions, storage behavior, or external communication changes.

Material changes will be documented in the repository and reflected by updating the date at the top of this document.

## Contact

For privacy-related questions, open an issue in the project repository:

https://github.com/petrsafrata/GitHubEnhancedView/issues

Do not include GitHub tokens, authorization headers, private repository content, or absolute local filesystem paths in a public issue.