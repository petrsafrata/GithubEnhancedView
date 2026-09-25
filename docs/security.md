# Security

GitHub Enhanced View uses a least-privilege, local-first security model.

## Trust boundaries

GitHub page content and scripts are considered untrusted. Sensitive values remain in trusted extension contexts.

The content script cannot access:

- The stored GitHub token
- Authorization headers
- Absolute local repository paths
- Direct `chrome.storage.local` data

## GitHub API security

- Authenticated requests run only in the background service worker
- Requests containing a token are restricted to `https://api.github.com`
- Tokens are sent only through the `Authorization` header
- Tokens are never placed in URLs or returned to content scripts
- Redirects are rejected
- Browser credentials are omitted
- Requests use a timeout and can be aborted
- API responses are validated before use

## Runtime messaging

Privileged message handlers validate:

- Message type and payload structure
- Extension sender ID
- GitHub HTTPS origin where required
- Top-level frame where required
- Originating tab where required
- Repository identity and mapping ownership
- Repository names, references, and relative paths

## DOM security

- Untrusted text is inserted using `textContent`
- `innerHTML`, `eval`, and `new Function` are not used
- Tokens, authorization data, absolute paths, and `vscode://` URLs are not stored in the GitHub DOM
- Bundled SVG files must not contain scripts, external resources, event handlers, or `foreignObject`

## Storage security

- Sensitive data is stored only in `chrome.storage.local`
- Session cache data contains no token, authorization header, or absolute local path
- Trusted-context storage access is used as defense in depth
- Changing or removing a token invalidates its related cache partition

The token is protected by Chrome's extension storage isolation but is not separately encrypted by the extension. Use a fine-grained, read-only token and revoke it if the local browser profile may be compromised.

## Permissions

The extension requests only:

- `storage`
- Access to `https://github.com/*`
- Host access to `https://api.github.com/*`

It does not request `<all_urls>` and does not declare `externally_connectable`.

## Reporting security issues

Do not publish a token, authorization header, private repository content, or local filesystem path in a public issue.

When reporting a security issue, provide only the minimum information required to reproduce it and redact all sensitive values.

