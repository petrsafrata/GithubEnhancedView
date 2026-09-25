# Troubleshooting

## Changes are not visible after a build

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Reload GitHub Enhanced View.
4. Refresh the GitHub page with `Ctrl + F5` if necessary.

## Icons or labels are missing

- Confirm that the feature is enabled on the options page
- Reload the extension and refresh GitHub
- Confirm that bundled icons exist in `dist/icons`
- Check the GitHub page console for errors

GitHub may change its DOM structure, which can temporarily affect extension selectors.

## File sizes are missing

- Confirm that the repository is accessible
- Check whether the GitHub API rate limit has been reached
- Configure a valid token for private repositories
- Confirm that the token has read-only access to the repository
- Confirm that the current branch or Git reference exists

GitHub may return a truncated recursive tree for very large repositories.

## The VS Code button is missing

- Confirm that the repository mapping is enabled
- Use the exact `owner/repository` format
- Confirm that the mapping matches the current repository
- Confirm that the configured local path is absolute

## The VS Code button does not open a file

- Confirm that Visual Studio Code is installed
- Confirm that the browser allows `vscode://` URLs
- Confirm that the local directory and file exist
- Confirm that the local structure matches the GitHub repository structure

## The options page does not open

Open it manually through:

```text
chrome://extensions
→ GitHub Enhanced View
→ Details
→ Extension options
```

## Inspect extension errors

For content-script errors, open Developer Tools on the GitHub page and inspect the **Console** tab.

For background-worker errors, open `chrome://extensions` and select the service-worker inspection link for GitHub Enhanced View.

!!! warning
    Never publish logs containing tokens, authorization headers, private repository content, or absolute local paths.

