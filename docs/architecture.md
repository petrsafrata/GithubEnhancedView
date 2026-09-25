# Architecture

GitHub Enhanced View follows the Manifest V3 extension model and separates page-facing code from privileged operations.

## Extension contexts

| Context | Main responsibilities | Sensitive access |
|---|---|---|
| Content script | Parses GitHub repository views and applies icons, labels, filtering, file sizes, and buttons | No token or absolute local paths |
| Background service worker | Storage access, GitHub API requests, caching, message validation, and VS Code navigation | Token and repository mappings |
| Options page | User configuration and token management | Communicates with trusted background handlers |

## Data flow

### Repository enhancements

1. The content script parses the current GitHub repository view.
2. It applies local visual enhancements.
3. A DOM observer detects GitHub client-side navigation and changed repository content.
4. Enhancements are reapplied without modifying repository data.

### File-size requests

1. The content script determines the repository owner, name, and reference.
2. It sends a typed request to the background service worker.
3. The worker validates the message and sender.
4. The worker uses a valid session cache entry or calls `https://api.github.com`.
5. Only validated file paths and sizes are returned.

### Configuration delivery

The content script does not directly read `chrome.storage.local`. The background worker loads and sanitizes settings, then sends only the configuration needed by the content script.

Repository mappings delivered to the content script contain no absolute local paths.

## Storage

| Storage area | Stored data |
|---|---|
| `chrome.storage.local` | Settings, rules, repository mappings, and the optional token |
| `chrome.storage.session` | Temporary GitHub repository tree cache |

`chrome.storage.sync`, website local storage, session storage, and cookies are not used for extension configuration or secrets.

## Network communication

Runtime API communication is restricted to:

```text
https://api.github.com
```

The extension has no analytics, advertising, telemetry, error-reporting, proxy, or developer-controlled backend endpoint.

