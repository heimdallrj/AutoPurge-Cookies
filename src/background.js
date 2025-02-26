const browser = window.browser || window.chrome;
const storage = browser.storage.sync || browser.storage;

async function detectBrowser() {
  if (typeof window.browser !== "undefined") {
    return "firefox";
  } else if (typeof window.chrome !== "undefined") {
    return "chrome";
  } else {
    return "unknown";
  }
}

// Store for whitelisted domains
let whitelist = [];

// Add a storage change listener to keep whitelist updated
storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.whitelist) {
    whitelist = changes.whitelist.newValue || [];
  }
});

// Initial load
async function init() {
  const browserName = await detectBrowser();

  let __whitelist__ = "whitelist";
  if (browserName === "chrome") __whitelist__ = "[whitelist]";

  storage.get(__whitelist__, (result) => {
    whitelist = result.whitelist || [];
  });
}

function isDomainWhitelisted(domain, whitelist) {
  // Allow browser extensions to stay logged in
  if (['-extension://'].includes(domain)) return true;

  // Remove leading dot if present
  const cleanDomain = domain.startsWith('.') ? domain.slice(1) : domain;

  return whitelist.some((whitelistedDomain) => {
    // Exact match
    if (cleanDomain === whitelistedDomain) return true;
    // Subdomain match (ensure it ends with .whitelistedDomain)
    if (cleanDomain.endsWith('.' + whitelistedDomain)) return true;
    return false;
  });
}

// Listen for window close
browser.windows.onRemoved.addListener(async () => {
  const result = await storage.get(['autoPurgeEnabled']);
  if (!result.autoPurgeEnabled) return;

  // Get all cookies
  browser.cookies.getAll({}).then((cookies) => {
    cookies.forEach((cookie) => {
      const domain = cookie.domain.startsWith('.')
        ? cookie.domain.slice(1)
        : cookie.domain;

      const isWhitelisted = isDomainWhitelisted(domain, whitelist);

      if (!isWhitelisted) {
        browser.cookies.remove({
          url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path
            }`,
          name: cookie.name,
        });
      }
    });
  });
});

init();