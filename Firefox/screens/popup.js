document.addEventListener('DOMContentLoaded', () => {
  const domainInputElement = document.getElementById('domain');
  const addButtonElement = document.getElementById('add');
  const whitelistContainerElement = document.getElementById(
    'whitelist-container'
  );
  const whitelistElement = document.getElementById('whitelist');
  const toggleStatusElement = document.getElementById('toggle-status');

  let autoPurgeEnabled;

  // Initialize
  async function init() {
    await updateToggleStatus();
    await loadWhitelist();
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

  // Load and display whitelist
  async function loadWhitelist() {
    if (!autoPurgeEnabled) {
      return;
    }
    try {
      browser.storage.local.get('whitelist').then((result) => {
        const whitelist = result.whitelist || [];
        whitelistElement.innerHTML = '';

        whitelist.forEach((domain) => {
          const li = document.createElement('li');
          li.innerHTML = `
          <span>${domain}</span>
          <span class="remove-domain" data-domain="${domain}">✕</span>
        `;
          whitelistElement.appendChild(li);
        });
      });
    } catch (error) {
      console.error('$loadWhitelist():', error);
    }
  }

  // Add domain to whitelist
  addButtonElement.addEventListener('click', () => {
    if (!autoPurgeEnabled) {
      return;
    }

    const domain = domainInputElement.value.trim();

    if (domain) {
      try {
        const domainRegex = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
        if (!domainRegex.test(domain)) {
          alert('Invalid domain name!');
          domainInputElement.value = '';
          return;
        }

        browser.storage.local.get('whitelist').then((result) => {
          const whitelist = result.whitelist || [];
          if (!whitelist.includes(domain)) {
            whitelist.push(domain);
            browser.storage.local.set({ whitelist });
            loadWhitelist();
            domainInputElement.value = '';
          }
        });
      } catch (error) {
        console.error('Error adding domain:', error);
      }
    }
  });

  // Remove domain from whitelist
  whitelistElement.addEventListener('click', (e) => {
    if (!autoPurgeEnabled) {
      return;
    }

    if (e.target.classList.contains('remove-domain')) {
      const domain = e.target.dataset.domain;
      try {
        browser.storage.local.get('whitelist').then((result) => {
          const whitelist = result.whitelist || [];
          const newWhitelist = whitelist.filter((d) => d !== domain);
          browser.storage.local.set({ whitelist: newWhitelist });
          loadWhitelist();
        });
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
  });

  // Initialize
  init();
});
