## [1.0.0]

### Added

- Custom file and directory icons.
- Configurable file labels and filters.
- GitHub API file-size information.
- Secure local VS Code integration.
- Local repository mappings.
- GitHub API token support for private repositories.

### Security

- Tokens remain isolated in the background service worker.
- Local filesystem paths are not exposed to GitHub pages.
- Content scripts have no direct access to extension storage.