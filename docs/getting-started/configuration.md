# Configuration

## Open the options page

Navigate to:

```text
chrome://extensions
→ GitHub Enhanced View
→ Details
→ Extension options
```

The options page opens in a separate browser tab.

## Feature switches

The following features can be enabled or disabled independently:

- File icons
- File labels
- Configuration-file filtering

Changes are stored locally and are applied to open GitHub repository pages through extension messaging.

## Label rules

A label rule contains:

| Field | Purpose |
|---|---|
| Label | Text displayed in the repository list |
| Keywords | Filename fragments that activate the label |
| Text color | Label text color |
| Background color | Label background color |
| Border color | Label border color |
| Enabled | Determines whether the rule is active |

Rules are evaluated against filenames. More than one rule may match the same file.

## Filter rules

Filter rules hide matching files when file filtering is enabled.

Supported patterns include exact names and `*` or `?` wildcards:

```text
.gitignore
*.lock
vite.config.*
tsconfig*.json
```

Filtering can also be toggled using the button displayed on GitHub repository pages.

## Restore defaults

The options page provides actions for restoring default label rules, filter rules, or the complete default configuration.

Restoring defaults does not change data retained independently by GitHub.

## Optional integrations

- Configure a token for private repositories or higher API limits in [GitHub API and File Sizes](../github-api.md).
- Configure a local repository in [VS Code Integration](../vscode-integration.md).

