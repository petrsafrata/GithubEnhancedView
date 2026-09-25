# 🤝 Contributing to GitHub Enhanced View

Welcome and thank you for taking the time to contribute.

GitHub Enhanced View favors minimal, secure, and maintainable changes that follow the existing project structure.

For installation, development setup, build instructions, and project structure, see the [README](README.md).

---

## 📌 How to Contribute

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Build and test the extension.
5. Submit a pull request.

Example branch names:

```text
feature/file-icon-support
fix/github-tree-selector
docs/privacy-update
```

In your pull request description, include:

- What changed
- Why the change is needed
- How the change was tested
- Any security or privacy impact
- Any new permission, storage, or network requirement
- Screenshots for visible UI changes

---

## 🧭 Contribution Rules

### Code Quality

- Keep changes minimal, localized, and consistent with the existing codebase.
- Prefer explicit and maintainable solutions over clever abstractions.
- Use TypeScript and preserve the existing formatting style.
- Keep modules focused on a single responsibility.
- Avoid unrelated refactoring or formatting changes.
- Avoid new runtime dependencies unless clearly justified.
- Preserve existing behavior unless the change intentionally modifies it.

### Browser Extension Architecture

- Keep privileged operations in the background service worker.
- Content scripts must only receive the data required for their functionality.
- Validate data received from storage, runtime messages, GitHub pages, and APIs.
- Treat GitHub page content and API responses as untrusted input.
- Request only the minimum Chrome permissions required by an implemented feature.
- Do not add remotely hosted executable code.

### GitHub Compatibility

GitHub uses client-side navigation and may change its DOM structure without notice.

When changing GitHub integration:

- Test both direct page loads and client-side navigation.
- Avoid selectors that are broader than necessary.
- Do not remove or modify unrelated GitHub elements.
- Verify the main repository file list and the left file tree.
- Test both light and dark GitHub themes when changing styles.
- Preserve keyboard navigation and accessibility attributes.

### Security

Security-sensitive behavior must follow these rules:

- Never commit or log secrets, tokens, authorization headers, or credentials.
- Never expose GitHub tokens to content scripts, page scripts, URLs, or the DOM.
- Never expose absolute local filesystem paths to GitHub pages.
- Store sensitive extension data only in `chrome.storage.local`.
- Perform authenticated GitHub API requests only in the background service worker.
- Send authenticated requests only to `https://api.github.com`.
- Send tokens only through the HTTP `Authorization` header.
- Validate runtime messages and their senders.
- Use `textContent` instead of `innerHTML`.
- Do not introduce `eval`, `new Function`, inline scripts, or unsafe CSP directives.

> [!IMPORTANT]
> Any change affecting tokens, local repository mappings, runtime messaging, storage, permissions, or network communication should include a short security explanation in the pull request.

### Privacy

Update `PRIVACY.md` when a change affects:

- Data processed by the extension
- Local or session storage
- GitHub API communication
- Chrome permissions
- Repository mappings
- Token handling
- Data retention or deletion

> [!IMPORTANT]
> Do not introduce analytics, telemetry, advertising, or developer-controlled data collection without prior discussion and explicit documentation.

### Icons and Third-Party Assets

Before adding a third-party icon or asset:

- Verify that redistribution is permitted.
- Record its source and license in `THIRD_PARTY_NOTICES.md`.
- Preserve required copyright and attribution notices.
- Check whether it contains a protected product logo or trademark.
- Do not imply endorsement by the trademark owner.
- Ensure SVG files do not contain scripts, event handlers, external resources, or `foreignObject`.

### Documentation

Update `README.md` and the documentation in the `docs` directory when changing:

- User-visible behavior
- Installation or build instructions
- Extension settings
- Required permissions
- GitHub token requirements
- Supported file types or features

Update `THIRD_PARTY_NOTICES.md` when adding or replacing third-party assets.

---

## 🧪 Before Submitting a Pull Request

Run a production build:

```bash
npm run build
```

Then reload the unpacked extension in Chrome and test the affected functionality.

Before submitting, verify:

- [ ] The production build completes successfully
- [ ] The affected functionality works on GitHub
- [ ] GitHub client-side navigation still works
- [ ] No new console errors or warnings appear
- [ ] No secrets, tokens, local paths, or debug code were committed
- [ ] No unnecessary Chrome permissions were added
- [ ] Security-sensitive values are absent from the content-script bundle
- [ ] Accessibility and keyboard behavior remain functional
- [ ] README was updated if behavior or setup changed
- [ ] PRIVACY was updated if data handling changed
- [ ] THIRD_PARTY_NOTICES was updated if external assets were added

For security-sensitive changes, inspect the generated `dist` files and verify that `dist/content.js` does not contain:

```text
chrome.storage.local
gev-github-api-token
gev-extension-settings
gev-repository-mappings
TRUSTED_CONTEXTS
Authorization
Bearer
vscode://file/
localPath
```

Expected storage or authorization code may appear in trusted bundles such as `dist/background.js` and `dist/options.js`.

---

## 🐛 Reporting Bugs

Bug reports should include:

- Browser and browser version
- Extension version
- Steps to reproduce the problem
- Expected behavior
- Actual behavior
- Relevant console errors
- Screenshots, when useful

> [!NOTE]
> Provide a public repository as an example inside your GitHub Issue whenever possible.

Do not include:

- GitHub tokens
- Authorization headers
- Private repository content
- Absolute local filesystem paths
- Other sensitive information

---

## 📜 License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

Unless explicitly stated otherwise, contributions submitted to this project are provided under the same license.

By submitting a contribution, you confirm that you have the right to provide it under the Apache License 2.0.

---

Thank you for contributing to GitHub Enhanced View!