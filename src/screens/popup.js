
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
  const storage = browser.storage.sync || browser.storage;

  let autoPurgeEnabled;

  async function detectBrowser() {
    if (browser.runtime.getBrowserInfo) {
      return "firefox";
    }
    return "chrome";
  }

  // Initialize
  async function init() {
    await resetUIContainer();
    await loadUIContainer();
    await loadWhitelist();
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

    const domain = domainInputElement.value.trim().toLowerCase();

    if (domain) {
      try {
        const domainRegex = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
        if (!domainRegex.test(domain)) {
          inputErrorElement.innerText = 'Invalid domain name!';
          inputErrorElement.style.display = 'block';
          return;
        }

        const browserName = await detectBrowser();

        let __whitelist__ = "whitelist";
        if (browserName === "chrome") __whitelist__ = "[whitelist]";

        storage.get(__whitelist__, (result) => {
          const whitelistToUpdate = result.whitelist || [];
          if (!whitelistToUpdate.includes(domain)) {
            whitelistToUpdate.push(domain);
            whitelistToUpdate.sort();
            storage.set({ whitelist: whitelistToUpdate });
            loadWhitelist();
            domainInputElement.value = '';
          } else {
            inputErrorElement.innerText =
              'This domain is already in the whitelist!';
            inputErrorElement.style.display = 'block';
          }
        })
      } catch (err) {
        console.error(err);
      }
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
