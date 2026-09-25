![GitHub Enhanced View Banner](docs/images/github-enhanced-view-banner.png)

# 🚀 GitHub Enhanced View

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-5F6368?logo=googlechrome&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![GitHub API](https://img.shields.io/badge/GitHub-API-181717?logo=github&logoColor=white)
![Local First](https://img.shields.io/badge/Local--First-Yes-brightgreen)
![Runtime Dependencies](https://img.shields.io/badge/Runtime_Dependencies-0-brightgreen)
[![Extension CI + Auto Release](https://github.com/petrsafrata/GithubEnhancedView/actions/workflows/ci-release.yml/badge.svg)](https://github.com/petrsafrata/GithubEnhancedView/actions/workflows/ci-release.yml)
[![Documentation](https://github.com/petrsafrata/GithubEnhancedView/actions/workflows/docs.yml/badge.svg)](https://github.com/petrsafrata/GithubEnhancedView/actions/workflows/docs.yml)
![Open Source](https://img.shields.io/badge/Open%20Source-Yes-brightgreen?logo=opensourceinitiative&logoColor=white)
![License](https://img.shields.io/badge/License-Apache%202.0-blue?logo=apache&logoColor=white)

---

## 🧾 Project Description

GitHub Enhanced View is a local-first Chrome extension that improves repository browsing directly on GitHub.

It adds file-type-specific icons, configurable file labels, configuration-file filtering, file sizes, and optional links for opening mapped repository files in Visual Studio Code.

The extension is built with security and privacy in mind. Sensitive operations are isolated in the Manifest V3 background service worker, GitHub tokens are never exposed to GitHub pages, and absolute local filesystem paths are never inserted into the page DOM.

GitHub Enhanced View does not use analytics, telemetry, advertising, or a developer-controlled backend service. 

---

## ✨ Features

### 🎨 File-Type Icons

- Replaces generic GitHub file icons with file-type-specific SVG icons
- Supports the main repository list and the left file tree
- Includes icons for common languages, frameworks, tools, and configuration files

### 🏷️ Configurable File Labels

- Adds labels according to keywords found in filenames
- Supports custom text, colors, keywords, and enabled state
- Includes useful defaults such as `API`, `AUTH`, `CONFIG`, and `SECURITY`

### 🙈 File Filtering

- Hides selected configuration or generated files
- Supports exact filenames and `*` or `?` wildcard patterns
- Can be toggled from GitHub or from the options page

Examples:

```text
.gitignore
*.lock
vite.config.*
tsconfig*.json
```

### 📦 File Sizes

- Displays file sizes in the main repository list
- Loads repository metadata through the official GitHub API
- Uses a temporary session cache to reduce repeated API requests

### 💻 Open in Visual Studio Code

- Maps a GitHub repository to an absolute local directory
- Opens the matching local file through the `vscode://` protocol
- Keeps absolute local paths outside the GitHub page DOM

### ⚙️ Options Page

The options page allows users to:

- Enable or disable individual features
- Manage label and filter rules
- Configure local repository mappings
- Add, validate, or remove an optional GitHub API token
- Restore default settings

### 🔑 Optional GitHub API Token

A fine-grained GitHub personal access token can be configured for:

- Private repository access
- A higher GitHub API rate limit
- More reliable repository metadata loading

The token is optional for public repositories.

The extension stores the token only in `chrome.storage.local` and uses it only from the background service worker.

### 🔒 Local-First and Privacy-Focused

GitHub Enhanced View is designed to keep user data on the user's device whenever possible.

- Settings, label rules, filter rules, and repository mappings are stored locally
- Temporary repository metadata is stored only in session storage
- The extension does not use `chrome.storage.sync`
- No analytics, telemetry, advertising, or tracking services are included
- No data is transmitted to a developer-controlled server
- GitHub API communication is performed only when required by a user-facing feature
- GitHub tokens and absolute local paths are never exposed to GitHub pages
- No remotely hosted executable code is used

---

## 🧱 Technology and Architecture

- **Language:** TypeScript
- **Build tool:** Vite
- **Extension platform:** Chrome Manifest V3
- **Storage:** `chrome.storage.local` and `chrome.storage.session`
- **External API:** GitHub REST API
- **Runtime dependencies:** None

| Context | Responsibility |
|---|---|
| Content script | Applies visual enhancements to GitHub pages |
| Background service worker | Handles storage, API requests, caching, tokens, and VS Code navigation |
| Options page | Manages extension settings and repository mappings |

Privileged information such as GitHub tokens and absolute local paths is handled only by trusted extension contexts.

### 🛡️ Security Boundaries

The extension separates public page interaction from privileged operations:

- The **content script** reads the visible GitHub repository interface and applies UI enhancements. It does not access the stored token or absolute local paths.
- The **background service worker** validates runtime messages, reads trusted storage, communicates with the GitHub API, maintains the temporary cache, and creates VS Code URLs.
- The **options page** lets the user manage settings, mappings, and the optional token without exposing sensitive values to GitHub tabs.

Only the minimum data required for a specific operation is sent between these contexts. Sensitive values are never returned to the content script.

---

## 📁 Project Structure

```text
GitHubEnhancedView/
├── public/
│   ├── options.html
│   └── icons/
│       └── *.svg
├── src/
│   ├── background/
│   ├── content/
│   │   ├── features/
│   │   │   ├── fileFilter/
│   │   │   ├── fileIcons/
│   │   │   ├── fileLabels/
│   │   │   ├── fileSizes/
│   │   │   └── vscodeLinks/
│   │   ├── github/
│   │   ├── settings/
│   │   ├── index.ts
│   │   └── styles.css
│   ├── options/
│   ├── settings/
│   ├── shared/
│   └── vite-env.d.ts
├── docs/
│   └── images/
├── dist/
├── CONTRIBUTING.md
├── LICENSE
├── PRIVACY.md
├── THIRD_PARTY_NOTICES.md
├── manifest.json
├── package-lock.json
├── package.json
├── tsconfig.json
└── vite.config.ts
```

The production extension files are generated in `dist/`.

---

## 🚀 Installation

### 📥 Install from GitHub Releases

1. Open the [GitHub Releases](https://github.com/petrsafrata/GitHubEnhancedView/releases) page.
2. Download the ZIP archive from the latest release.
3. Extract it to a permanent directory.
4. Open `chrome://extensions`.
5. Enable **Developer mode**.
6. Select **Load unpacked**.
7. Select the extracted directory containing `manifest.json`.
8. Open or refresh a GitHub repository page.

> [!NOTE]
> Manually installed extensions do not update automatically. To update, replace the extension files with a newer release and select **Reload** on `chrome://extensions`.

### 🗑️ Uninstalling the Extension

1. Open `chrome://extensions`.
2. Find **GitHub Enhanced View**.
3. Select **Remove**.
4. Confirm the removal.

Chrome will remove the extension and its associated extension storage. Information retained independently by GitHub, such as API request logs, is governed by GitHub's own policies.

---

## 🛠️ Local Development

### 🔧 Prerequisites

- Node.js 20 or newer
- npm
- Git
- Google Chrome or another compatible Chromium-based browser

Clone and build the project:

```powershell
git clone https://github.com/petrsafrata/GitHubEnhancedView.git
cd GitHubEnhancedView
npm ci
npm run build
```

Then open `chrome://extensions`, enable **Developer mode**, select **Load unpacked**, and choose the project root containing `manifest.json`.

For automatic rebuilds during development:

```powershell
npm run dev
```

> [!IMPORTANT]
> After rebuilding, reload the extension on `chrome://extensions` and refresh the GitHub page. Changes to the background worker, options page, or manifest always require an extension reload.

---

## ⚙️ Configuration

Open the options page through:

```text
chrome://extensions
→ GitHub Enhanced View
→ Details
→ Extension options
```

### 🔑 GitHub API Token

A token is optional for public repositories but recommended for private repositories and higher API rate limits.

Use a fine-grained personal access token limited to selected repositories with the minimum permission:

```text
Repository permissions → Contents → Read-only
```

Create a token at:

https://github.com/settings/personal-access-tokens/new

Enter it on the options page and select **Verify and save**. The token is stored only in `chrome.storage.local`, used only by the background service worker, and never exposed to GitHub pages.

> [!WARNING]
> Treat the token as a password. Never include it in commits, screenshots, console output, or bug reports.

### 💻 Local Repository Mapping

Enter the GitHub repository as:

```text
owner/repository
```

Then provide its absolute local path.

Windows example:

```text
D:\Development\GithubEnhancedView
```

Linux or macOS example:

```text
/home/user/projects/GithubEnhancedView
```

After saving the mapping, supported files can be opened through the Visual Studio Code button in the main repository list.

Visual Studio Code must be installed and registered as the handler for `vscode://` URLs.

---

## 🔐 Permissions

| Permission or access | Purpose |
|---|---|
| `storage` | Stores settings, mappings, the optional token, and temporary cache data |
| `https://github.com/*` | Applies repository enhancements to GitHub pages |
| `https://api.github.com/*` | Retrieves repository metadata and validates the optional token |

The extension does not request `<all_urls>` access and does not use `externally_connectable`.

---

## 🔒 Security

The extension follows a least-privilege security model:

- Authenticated API requests run only in the background service worker
- The optional token is stored only in `chrome.storage.local`
- Tokens are never sent to content scripts, page scripts, URLs, the DOM, or logs
- Tokens are sent only through the HTTP `Authorization` header
- Authenticated requests are restricted to `https://api.github.com`
- Authenticated request redirects are rejected
- Absolute local paths remain in trusted extension storage
- Absolute local paths and `vscode://` URLs are never persisted in the GitHub DOM
- VS Code URLs are created by the background worker only after an explicit user action
- Runtime messages are validated together with their sender and GitHub origin
- Repository names, Git references, relative paths, stored settings, and API responses are validated before use
- Untrusted text is inserted into the page using `textContent`, not `innerHTML`
- Temporary API cache data does not contain tokens, authorization headers, or absolute local paths
- No unsafe CSP directives, dynamic code evaluation, or remote executable code is used
- No analytics, telemetry, or advertising services are included

For private repositories, use a fine-grained GitHub token restricted to selected repositories with read-only contents access. Revoke the token through GitHub immediately if you believe it has been exposed.

See [PRIVACY.md](PRIVACY.md) for complete information about data handling, storage, retention, and deletion.

Security-sensitive contributions must preserve these trust boundaries. See [CONTRIBUTING.md](CONTRIBUTING.md) for the project requirements.

---

## 🧯 Troubleshooting

### Changes are not visible

1. Run `npm run build`.
2. Reload the extension on `chrome://extensions`.
3. Refresh the GitHub page, using `Ctrl + F5` if necessary.

### File sizes are not displayed

- Check whether the GitHub API rate limit has been reached
- Configure a valid token for private repositories
- Confirm that the token has read-only access to the repository
- Be aware that GitHub may truncate tree responses for very large repositories

### The VS Code button is missing or does not work

- Verify the exact `owner/repository` mapping
- Confirm that the local path is absolute and exists
- Confirm that the local and GitHub directory structures match
- Make sure Visual Studio Code handles `vscode://` URLs

### Icons or labels are missing

- Confirm that the feature is enabled in the options page
- Reload the extension and refresh GitHub
- Check the GitHub page console for errors

GitHub may change its DOM structure, which can temporarily affect extension selectors.

> [!WARNING]
> Never publish logs containing tokens, authorization headers, private repository content, or absolute local paths.

---

## ⚠️ Current Limitations

- Designed primarily for Chrome and Chromium-based browsers
- Unpacked installations require manual updates
- File-size loading is subject to GitHub API rate limits
- Very large repository trees may be truncated by GitHub
- Private repositories require an appropriately scoped token
- Local file opening requires Visual Studio Code and a repository mapping
- GitHub DOM changes may require extension updates

---

## 🤝 Contributing

Contributions are welcome. Before submitting a pull request, read [CONTRIBUTING.md](CONTRIBUTING.md).

Changes should preserve the project's local-first behavior, minimal permission model, security boundaries, and absence of unnecessary runtime dependencies.

---

## 📦 Third-Party Assets

Some bundled icons originate from or are based on the VSCode Material Icon Theme and its upstream sources.

Third-party assets retain their original licenses and trademark conditions. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for details.

---

## ⚖️ License

GitHub Enhanced View is open-source software released under the Apache License 2.0.
See [LICENSE](LICENSE) for the full license text.

```text
Apache-2.0 – Copyright © 2026 Petr Šafrata
```

Third-party assets remain subject to their respective licenses.

---