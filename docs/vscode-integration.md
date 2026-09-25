# VS Code Integration

The extension can open a GitHub file in a matching local repository through Visual Studio Code.

## Requirements

- Visual Studio Code is installed
- The `vscode://` protocol is registered with the operating system
- The GitHub repository exists locally
- The local directory structure matches the GitHub repository structure

## Create a mapping

1. Open the extension options page.
2. Select **Add repository**.
3. Enter the repository as `owner/repository`.
4. Enter its absolute local directory.
5. Keep the mapping enabled.

Example repository:

```text
petrsafrata/GitHubEnhancedView
```

Windows path:

```text
D:\Development\GithubEnhancedView
```

Linux path:

```text
/home/user/projects/GithubEnhancedView
```

macOS path:

```text
/Users/user/Projects/GithubEnhancedView
```

## Open a file

After a valid mapping is saved, a VS Code button appears next to supported files in the main repository list.

When clicked, the extension:

1. Sends the mapping identifier, repository name, and relative file path to the background service worker.
2. Validates the sender, repository, mapping, and relative path.
3. Reads the absolute local root from trusted extension storage.
4. Creates the `vscode://` URL in the background worker.
5. Opens it in the originating browser tab.

## Privacy and security

The GitHub page receives neither the absolute local path nor the generated `vscode://` URL.

The DOM contains only a button and a non-sensitive mapping identifier. The local path remains in `chrome.storage.local` and is read only by trusted extension contexts.

Relative paths containing traversal, absolute paths, URL schemes, backslashes, empty segments, null bytes, or control characters are rejected.

