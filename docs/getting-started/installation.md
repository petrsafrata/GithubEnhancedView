# Installation

GitHub Enhanced View can be installed from a packaged GitHub release or built locally from source.

## Install from GitHub Releases

1. Open the [GitHub Releases](https://github.com/petrsafrata/GitHubEnhancedView/releases) page.
2. Download the ZIP archive attached to the latest release.
3. Extract it to a permanent directory.
4. Open `chrome://extensions` in Chrome.
5. Enable **Developer mode**.
6. Select **Load unpacked**.
7. Choose the extracted directory containing `manifest.json`.
8. Open or refresh a GitHub repository page.

!!! note
    Chrome may display a warning for extensions installed in Developer mode. This is expected for manually loaded unpacked extensions.

## Build and install from source

### Requirements

- Node.js 20 or newer
- npm
- Git
- Google Chrome or a compatible Chromium-based browser

Clone and build the project:

```powershell
git clone https://github.com/petrsafrata/GitHubEnhancedView.git
cd GitHubEnhancedView
npm ci
npm run build
```

Then load the project root as an unpacked extension from `chrome://extensions`.

## Update a manual installation

Manual installations do not update automatically.

1. Download and extract the new release over the existing extension directory.
2. Open `chrome://extensions`.
3. Select **Reload** for GitHub Enhanced View.
4. Refresh open GitHub tabs.

Chrome normally preserves settings when the extension files are replaced without removing the extension.

## Uninstall

1. Open `chrome://extensions`.
2. Find **GitHub Enhanced View**.
3. Select **Remove**.
4. Confirm the removal.

Chrome removes the extension and its associated extension storage. Data retained independently by GitHub is governed by GitHub's own policies.

