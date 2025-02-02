// Store for whitelisted domains
let whitelist = [];

// Add a storage change listener to keep whitelist updated
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.whitelist) {
    whitelist = changes.whitelist.newValue || [];
    console.log('Whitelist updated:', whitelist);
  }
});

// Initial load
chrome.storage.local.get(['whitelist'], (result) => {
  whitelist = result.whitelist || [];
  console.log('Initial whitelist loaded:', whitelist);
});

function isDomainWhitelisted(domain, whitelist) {
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
chrome.windows.onRemoved.addListener(() => {
  // Get all cookies
  chrome.cookies.getAll({}).then((cookies) => {
    console.log('Total cookies found:', cookies.length);

    cookies.forEach((cookie) => {
      const domain = cookie.domain.startsWith('.')
        ? cookie.domain.slice(1)
        : cookie.domain;

      const isWhitelisted = isDomainWhitelisted(domain, whitelist);
      console.log('Checking cookie:', {
        domain: domain,
        isWhitelisted: isWhitelisted,
        whitelist: whitelist,
      });

      if (!isWhitelisted) {
        console.log('Removing cookie:', {
          domain: domain,
          name: cookie.name,
          path: cookie.path,
        });

        chrome.cookies.remove({
          url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${
            cookie.path
          }`,
          name: cookie.name,
        });
      }
    });
  });
});
