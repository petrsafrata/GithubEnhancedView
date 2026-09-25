# Feature Overview

## File-type icons

GitHub's generic file icons are replaced with bundled SVG icons for supported file types.

Icons are applied to:

- The main repository file list
- The left repository file tree

The icon mapping recognizes common programming languages, frameworks, package files, configuration formats, and development tools.

## File labels

Labels make important files easier to identify without changing repository content.

Default rules include categories such as:

- `API`
- `AUTH`
- `CONFIG`
- `SECURITY`

Users can add, remove, disable, recolor, or restore rules from the options page.

## File filtering

Filtering temporarily hides files matched by enabled rules. It affects only the rendered GitHub list and does not modify repository content.

The current state is stored locally and can be changed from either the options page or the GitHub repository view.

## File sizes

File sizes are loaded through the GitHub REST API and aligned in the main repository list. Results are cached temporarily for the active browser session.

See [GitHub API and File Sizes](github-api.md) for authentication and rate-limit information.

## Open in Visual Studio Code

When a repository mapping exists, the extension adds an editor button next to supported files in the main repository list.

Absolute local paths are resolved only by the background service worker after an explicit click.

See [VS Code Integration](vscode-integration.md) for setup instructions.

## GitHub navigation support

GitHub uses client-side navigation. The extension observes relevant DOM changes and reapplies enhancements when repository content changes without a full page reload.

