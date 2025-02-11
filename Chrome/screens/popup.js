document.addEventListener('DOMContentLoaded', () => {
  const domainInputElement = document.getElementById('domain-input');
  const addButtonElement = document.getElementById('add-domain');
  const whitelistContainerElement = document.getElementById(
    'whitelist-container'
  );
  const whitelistElement = document.getElementById('whitelist');
  const toggleStatusElement = document.getElementById('toggle-status');
  const inputErrorElement = document.getElementById('input-error');

  const browser = chrome || browser;

  let autoPurgeEnabled;

  // Initialize
  async function init() {
    await resetErrors();
    await updateToggleStatus();
    await loadWhitelist();
  }

  // Reset all errors
  async function resetErrors() {
    inputErrorElement.style.display = 'none';
  }

  // Update toggle status
  async function updateToggleStatus() {
    try {
      const result = await browser.storage.local.get(['autoPurgeEnabled']);
      autoPurgeEnabled = !!result.autoPurgeEnabled;

      toggleStatusElement.textContent = autoPurgeEnabled ? 'Disable' : 'Enable';
      toggleStatusElement.checked = autoPurgeEnabled;

      if (autoPurgeEnabled) {
        whitelistContainerElement.style.display = 'block';
      } else {
        whitelistContainerElement.style.display = 'none';
      }
    } catch (error) {
      console.error('$updateToggleStatus():', error);
    }
  }

  // Load and display whitelisted domains
  async function loadWhitelist() {
    if (!autoPurgeEnabled) {
      return;
    }
    try {
      browser.storage.local.get(['whitelist'], (result) => {
        const whitelist = result.whitelist || [];

        whitelistElement.innerHTML = '';
        if (whitelist.length > 0) {
          whitelist.forEach((domain) => {
            const listElement = document.createElement('li');
            const domainLabelElement = document.createElement('span');
            const removeBtnElement = document.createElement('span');

            domainLabelElement.textContent = domain;
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
    } catch (error) {
      console.error('$loadWhitelist():', error);
    }
  }

  // Add new domain
  addButtonElement.addEventListener('click', async () => {
    if (!autoPurgeEnabled) {
      return;
    }

    const domain = domainInputElement.value.trim().toLowerCase();

    if (domain) {
      try {
        const domainRegex = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
        if (!domainRegex.test(domain)) {
          inputErrorElement.innerText = 'Invalid domain name!';
          inputErrorElement.style.display = 'block';

          domainInputElement.value = '';
          return;
        }

        const result = await browser.storage.local.get(['whitelist']);
        const domains = result.whitelist || [];

        if (!domains.includes(domain)) {
          domains.push(domain);
          await browser.storage.local.set({ whitelist: domains });

          domainInputElement.value = '';
          loadWhitelist();

          whitelistElement.style.display = 'block';
        } else {
          alert('This domain is already in the whitelist!');
        }
      } catch (error) {
        console.error('Error adding domain:', error);
      }
    }
  });

  // Remove domain from whitelist
  whitelistElement.addEventListener('click', async (e) => {
    if (!autoPurgeEnabled) {
      return;
    }

    if (e.target.classList.contains('remove-domain')) {
      const domainToRemove = e.target.dataset.domain;
      try {
        const result = await browser.storage.local.get(['whitelist']);
        const domains = result.whitelist || [];
        const updatedDomains = domains.filter((d) => d !== domainToRemove);

        await browser.storage.local.set({ whitelist: updatedDomains });
        loadWhitelist();
      } catch (error) {
        console.error('Error removing domain:', error);
      }
    }
  });

  // Toggle auto purge status
  toggleStatusElement.addEventListener('click', async () => {
    try {
      await browser.storage.local.set({ autoPurgeEnabled: !autoPurgeEnabled });
      await updateToggleStatus();
    } catch (error) {
      console.error('$toggleStatusElement.click():', error);
    }
  });

  // Add domain on Enter key press
  domainInputElement.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addButtonElement.click();
    }
    resetErrors();
  });

  // Initialize
  init();
});
