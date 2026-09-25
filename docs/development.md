# Development

## Requirements

- Node.js 20 or newer
- npm
- Git
- Google Chrome or a compatible Chromium-based browser
- Python 3.13 for local documentation builds

## Build the extension

```powershell
git clone https://github.com/petrsafrata/GitHubEnhancedView.git
cd GitHubEnhancedView
npm ci
npm run build
```

For automatic rebuilds:

```powershell
npm run dev
```

Load the project root through `chrome://extensions` using **Load unpacked**.

After changes to the background worker, options page, shared code, or manifest, reload the extension and refresh the GitHub tab.

## Project areas

```text
src/
├── background/   Privileged operations and API communication
├── content/      GitHub parsing and user-interface enhancements
├── options/      Settings page
├── settings/     Settings types, defaults, sanitization, and storage
└── shared/       Typed runtime message contracts
```

Bundled SVG icons are stored under `public/icons/`. Production output is generated in `dist/`.

## Build the documentation locally

Install the documentation dependencies:

```powershell
python -m pip install mkdocs-material==9.7.7
```

Prepare the canonical legal documents:

```powershell
Copy-Item PRIVACY.md docs/privacy.md
Copy-Item THIRD_PARTY_NOTICES.md docs/third-party-notices.md
Copy-Item LICENSE docs/LICENSE
```

Start the local documentation server:

```powershell
mkdocs serve
```

Open the URL displayed by MkDocs, normally `http://127.0.0.1:8000`.

Generated legal-document copies are ignored by Git and should not be edited directly. Edit the corresponding root files instead.

## Contribution requirements

Read the repository [contributing guidelines](https://github.com/petrsafrata/GitHubEnhancedView/blob/master/CONTRIBUTING.md) before submitting a pull request.

Security-sensitive changes must preserve the boundaries documented on the [Security](security.md) page.
