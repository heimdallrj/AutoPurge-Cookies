document.addEventListener('DOMContentLoaded', () => {
  const toggleStatusElement = document.getElementById('status-toggle');
  const whitelistContainerElement = document.getElementById(
    'whitelist-container'
  );
  const inputErrorElement = document.getElementById('domain-input-error');
  const domainInputElement = document.getElementById('domain');
  const addButtonElement = document.getElementById('add');
  const whitelistElement = document.getElementById('whitelist');

  let autoPurgeEnabled;

  // Initialize
  async function init() {
    await resetErrors();
    await toggleStatus();
    await loadWhitelist();
  }

  async function resetErrors() {
    inputErrorElement.style.display = 'none';
  }

  async function toggleStatus() {
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
    } catch (err) {
      console.error(err);
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
      await browser.storage.local.set({ autoPurgeEnabled: !autoPurgeEnabled });
      await resetErrors();
      await toggleStatus();
    } catch (err) {
      console.error(err);
    }
  });

  // Add domain to whitelist
  addButtonElement.addEventListener('click', () => {
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
          return;
        }

        browser.storage.local.get('whitelist').then((result) => {
          const whitelistToUpdate = result.whitelist || [];
          if (!whitelistToUpdate.includes(domain)) {
            whitelistToUpdate.push(domain);
            browser.storage.local.set({ whitelist: whitelistToUpdate });
            loadWhitelist();
            domainInputElement.value = '';
          } else {
            inputErrorElement.innerText =
              'This domain is already in the whitelist!';
            inputErrorElement.style.display = 'block';
          }
        });
      } catch (err) {
        console.error(err);
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
    resetErrors();
  });

  init();
});
