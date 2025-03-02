const __browser__ = chrome;
const __storage__ = __browser__.storage.local;

// Store for whitelisted domains
let whitelist = [];

// Add a storage change listener to keep whitelist updated
// @NOTE Should revisit this logic to determine if it is necessary.
__storage__.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.whitelist) {
    whitelist = changes.whitelist.newValue || [];
  }
});

// Initial load
async function init() {
  __storage__.get("whitelist", (result) => {
    if (!result) return;
    whitelist = result.whitelist || [];
  });
}

function isDomainWhitelisted(domain, whitelist) {
  // Allow browser extensions to stay logged in
  if (['-extension://'].includes(domain)) return true;

  // Remove leading dot if present
  const cleanDomain = domain.startsWith('.') ? domain.slice(1) : domain;

  return whitelist.some((whitelistedDomain) => {
    if (cleanDomain === whitelistedDomain) return true; // Exact match

    // Subdomain match (ensure it ends with .whitelistedDomain)
    if (cleanDomain.endsWith('.' + whitelistedDomain)) return true;
    return false;
  });
}

__browser__.tabs.onRemoved.addListener((() => {
  // @TODO: #17 Should clear cookies on tab is close unless otherwise specifed
}));

// Listen for window close
__browser__.windows.onRemoved.addListener(async () => {
  const result = await __storage__.get(['isEnabledAutoPurge']);
  if (!result.isEnabledAutoPurge) return;

  // Get all cookies
  __browser__.cookies.getAll({}).then((cookies) => {
    cookies.forEach((cookie) => {
      const domain = cookie.domain.startsWith('.')
        ? cookie.domain.slice(1)
        : cookie.domain;

      const isWhitelisted = isDomainWhitelisted(domain, whitelist);

      if (!isWhitelisted) {
        __browser__.cookies.remove({
          url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path
            }`,
          name: cookie.name,
        });
      }
    });
  });
});

init();