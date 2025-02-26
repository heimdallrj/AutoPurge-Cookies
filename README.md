# Autopurge Cookies - Browser Extension

**Autopurge Cookies** is a browser extension that helps users automatically purge all cookies upon closing the browser window, except for those belonging to whitelisted domains. This extension is designed to enhance user privacy by ensuring that browsing data is cleaned up while still allowing users to retain essential cookies for their trusted sites.

## Features
- **Automatic Cookie Purge:** Cleans up all cookies when you close your browser window.
- **Whitelist Trusted Domains:** Prevent specific domains from being purged by adding them to the whitelist.
- **Easy to Use:** Add or remove domains from the whitelist via the extension settings.
- **Cross-Browser Support:** Compatible with both Google Chrome and Mozilla Firefox.

## Installation

### Firefox

Install AutoPurge-Cookies directly from the [Firefox Extensions Gallery](https://addons.mozilla.org/en-US/firefox/addon/autopurge-cookies/).

### Chrome

Not yet available on the Chrome Web Store. Install manually using the source files, available [here](https://github.com/heimdallrj/AutoPurge-Cookies/releases/).

## How to Use

### Adding/Removing Domains from the Whitelist
- Click on the extension icon in the browser toolbar.
- In the popup, you’ll see an option to manage your whitelist.
- To add a domain to the whitelist, simply enter the domain name (e.g., example.com) and click “Add”.
- To remove a domain from the whitelist, click the close icon next to the domain name.

### Purging Cookies
- Cookies from non-whitelisted domains will automatically be purged when you close your browser window.
- Cookies from whitelisted domains will remain intact.

## Privacy and Security
- **No Tracking:** Autopurge Cookies does not track or collect any personal information about users.
- **Local Data Storage:** The extension only stores whitelisted domains locally in your browser’s storage. It does not transmit any data externally.

## Troubleshooting
- **Cookies Aren’t Purging:** Make sure the extension is enabled, and that no domains you need to whitelist are accidentally included in the list.
- **Extension Not Working After Update:** Try restarting your browser or reinstalling the extension to ensure it’s working properly.


## Developer Guide

The build script is only compatible with **UNIX-based environments** (Linux & macOS).

When implementing new features or fixing issues, be mindful of *browser differences*. We maintain a unified codebase for both Chrome and Firefox to reduce duplication and ensure easier maintenance.

### Branching Strategy
- Always branch out from the `dev` branch for feature development, improvements, or bug fixes.
- The `main` branch contains the stable version and is protected.
- All development work happens on the `dev` branch before being merged into `main`.

### Distribution & Release Process

**Versioning:**
- When preparing a new release, update the version number in `manifest.json` on the `dev` branch.
- Create a pull request from `dev` to `main`, using the title format as `v{major}.{minor}.{patch}`

**Building & Packaging:**
- Run the build script locally to generate packaged extensions for both browsers.
- Artifacts will be available in `dist/`.

**Releasing:**
- [Draft a new release](https://github.com/heimdallrj/AutoPurge-Cookies/releases/new) on GitHub.
- Use the same version format (`v{major}.{minor}.{patch}`) for the release title and tag.
- Upload the build artifacts (`dist/*`) to the release draft.
- Add a changelog in the description.
- Publish the release.

**Publishing to Browser Stores:**
- Firefox Add-ons: Submit the build artifact to the Firefox Extension Library.
- Chrome Web Store: Not yet published, but planned for future releases.

## Contributing

Interested in contributing to AutoPurge Cookies? Follow these steps:

- Fork the repository and clone it locally.
- Create a feature branch from dev.
- Make your changes and test across both browsers.
- Submit a pull request to merge into dev.

For major changes, open an issue first to discuss improvements.

## License

This project is licensed under the MIT License.
