document.addEventListener('DOMContentLoaded', () => {
  const toggleStatusElement = document.getElementById('status-toggle');
  const whitelistContainerElement = document.getElementById(
    'whitelist-container'
  );
  const inputErrorElement = document.getElementById('domain-input-error');
  const domainInputElement = document.getElementById('domain');
  const addButtonElement = document.getElementById('add');
  const whitelistElement = document.getElementById('whitelist');

  const browser = window.browser || window.chrome;
  const storage = browser.storage.local || browser.storage;

  let autoPurgeEnabled;

  async function detectBrowser() {
    if (typeof window.browser !== "undefined") {
      return "firefox";
    } else if (typeof window.chrome !== "undefined") {
      return "chrome";
    } else {
      return "unknown";
    }
  }
  
  // Initialize
  async function init() {
    await resetUIContainer();
    await loadUIContainer();
    await loadWhitelist();
  }

  // Add this new function
  async function setCurrentTabDomain() {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        domainInputElement.value = url.hostname;
      }
    } catch (err) {
      console.error('Error getting active tab:', err);
    }
  }

  // Reset all errors
  async function resetUIContainer() {
    inputErrorElement.style.display = 'none';
  }

  // Update toggle status
  async function loadUIContainer() {
    try {
      const result = await storage.get(['autoPurgeEnabled']);
      autoPurgeEnabled = !!result.autoPurgeEnabled;

      toggleStatusElement.textContent = autoPurgeEnabled ? 'Disable' : 'Enable';
      toggleStatusElement.checked = autoPurgeEnabled;

      if (autoPurgeEnabled) {
        whitelistContainerElement.style.display = 'block';
        setCurrentTabDomain();
      } else {
        whitelistContainerElement.style.display = 'none';
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Load and display whitelisted domains
  async function loadWhitelist() {
    if (!autoPurgeEnabled) return;

    const browserName = await detectBrowser();

    let __whitelist__ = "whitelist";
    if (browserName === "chrome") __whitelist__ = "[whitelist]";

    try {
      storage.get(__whitelist__, (result) => {
        const whitelist = (result.whitelist || []).sort();
        whitelistElement.innerHTML = '';

        if (whitelist.length > 0) {
          whitelist.forEach((domain) => {
            const listElement = document.createElement('li');
            const domainLabelElement = document.createElement('span');
            const removeBtnElement = document.createElement('span');

            domainLabelElement.textContent = domain;
            removeBtnElement.classList.add('apc__whitelist-domain-delete-icon');
            removeBtnElement.classList.add('remove-domain');
            removeBtnElement.setAttribute('data-domain', domain);
            removeBtnElement.textContent = '✕';

            listElement.appendChild(domainLabelElement);
            listElement.appendChild(removeBtnElement);
            whitelistElement.appendChild(listElement);
          });
          whitelistElement.style.display = 'block';
        } else {
          whitelistElement.style.display = 'none';
        }
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Toggle auto purge status
  toggleStatusElement.addEventListener('click', async () => {
    try {
      storage.set({ autoPurgeEnabled: !autoPurgeEnabled });
      await resetUIContainer();
      await loadUIContainer();
    } catch (err) {
      console.error(err);
    }
  });

  // Add domain to whitelist
  addButtonElement.addEventListener('click', async () => {
    if (!autoPurgeEnabled) return;

    const input = domainInputElement.value.trim().toLowerCase();
    if (!input) return;

    try {
      const domains = input.includes(',') 
        ? input.split(',').map(d => d.trim()).filter(d => d)
        : [input];

      // Domain validation
      const domainRegex = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
      const invalidDomains = domains.filter(d => !domainRegex.test(d));
      
      if (invalidDomains.length > 0) {
        inputErrorElement.innerText = domains.length > 1
          ? `Invalid domain names: ${invalidDomains.join(', ')}`
          : 'Invalid domain name!';
        inputErrorElement.style.display = 'block';
        return;
      }

      const browserName = await detectBrowser();
      let __whitelist__ = "whitelist";
      if (browserName === "chrome") __whitelist__ = "[whitelist]";

      storage.get(__whitelist__, (result) => {
        const whitelistToUpdate = result.whitelist || [];
        const duplicateDomains = domains.filter(d => whitelistToUpdate.includes(d));

        if (duplicateDomains.length > 0) {
          inputErrorElement.innerText = domains.length > 1
            ? `These domains are already in the whitelist: ${duplicateDomains.join(', ')}`
            : 'This domain is already in the whitelist!';
          inputErrorElement.style.display = 'block';
          return;
        }

        // Add new domains
        whitelistToUpdate.push(...domains);
        whitelistToUpdate.sort();
        storage.set({ whitelist: whitelistToUpdate });
        loadWhitelist();
        domainInputElement.value = '';
      });
    } catch (err) {
      console.error(err);
    }
  });

  // Remove domain from whitelist
  whitelistElement.addEventListener('click', async (e) => {
    if (!autoPurgeEnabled) return;

    const browserName = await detectBrowser();

    let __whitelist__ = "whitelist";
    if (browserName === "chrome") __whitelist__ = "[whitelist]";

    if (e.target.classList.contains('remove-domain')) {
      const domain = e.target.dataset.domain;
      try {
        storage.get(__whitelist__, (result) => {
          const whitelist = result.whitelist || [];
          const newWhitelist = whitelist.filter((d) => d !== domain);
          storage.set({ whitelist: newWhitelist });
          loadWhitelist();
        });
      } catch (err) {
        console.error(err);
      }
    }
  });

  // Add domain on Enter key press
  domainInputElement.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addButtonElement.click();
    }
    resetUIContainer();
  });

  init();
});
