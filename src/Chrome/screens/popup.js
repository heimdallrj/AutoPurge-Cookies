document.addEventListener('DOMContentLoaded', () => {
  const elmCbToggle = document.getElementById('status-toggle');
  const elmDivWhitelistContainer = document.getElementById(
    'whitelist-container'
  );
  const elmSpanInputError = document.getElementById('domain-input-error');
  const elmTextDomainInput = document.getElementById('domain');
  const elmBtnAddButton = document.getElementById('add');
  const elmUlWhitelist = document.getElementById('whitelist');

  const logger = console;

  const validDomainRegex = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

  let whitelist = [];
  let isEnabledAutoPurge;

  // Initialize
  async function init() {
    await preload();
    await loadView();
    await loadWhitelist();
    await loadDefaults();
  }

  function getHostName(url) {
    try {
      const hostname = new URL(url).hostname;
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        return parts.slice(-2).join('.');
      }
      return hostname;
    } catch (err) {
      logger.error(err);
      return "";
    }
  }

  async function loadDefaults() {
    // Set hostname by default if not already in the list
    try {
      const tabs = await __browser__.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0 && tabs[0]?.url) {
        const currentHost = getHostName(tabs[0]?.url);
        if (validDomainRegex.test(currentHost) && !whitelist.includes(currentHost)) {
          elmTextDomainInput.value = getHostName(tabs[0]?.url);
        }
      }
    } catch (err) {
      logger.error(err);
    }
  }

  async function preload() {
    elmSpanInputError.style.display = 'none';
  }

  async function loadView() {
    try {
      isEnabledAutoPurge = !!(await Storage.get("isEnabledAutoPurge"));

      elmCbToggle.textContent = isEnabledAutoPurge ? 'Disable' : 'Enable';
      elmCbToggle.checked = isEnabledAutoPurge;

      if (isEnabledAutoPurge) {
        elmDivWhitelistContainer.style.display = 'block';
      } else {
        elmDivWhitelistContainer.style.display = 'none';
      }
    } catch (err) {
      logger.error(err);
    }
  }

  async function loadWhitelist() {
    if (!isEnabledAutoPurge) return;

    try {
      whitelist = (await Storage.get("whitelist") || []).sort();
      elmUlWhitelist.innerHTML = '';

      if (whitelist.length > 0) {
        whitelist.forEach((domain) => {
          const elmLiDomainRow = document.createElement('li');
          const elmSpanDomainLabel = document.createElement('span');
          const elmSpanDomainRemoveBtn = document.createElement('span');

          elmSpanDomainLabel.textContent = domain;

          elmSpanDomainRemoveBtn.classList.add('apc__whitelist-domain-delete-icon');
          elmSpanDomainRemoveBtn.classList.add('remove-domain');
          elmSpanDomainRemoveBtn.setAttribute('data-domain', domain);
          elmSpanDomainRemoveBtn.textContent = '✕';

          elmLiDomainRow.appendChild(elmSpanDomainLabel);
          elmLiDomainRow.appendChild(elmSpanDomainRemoveBtn);

          elmUlWhitelist.appendChild(elmLiDomainRow);
        });
        elmUlWhitelist.style.display = 'block';
      } else {
        elmUlWhitelist.style.display = 'none';
      }
    } catch (err) {
      logger.error(err);
    }
  }

  // Toggle auto purge status
  elmCbToggle.addEventListener('click', async () => {
    try {
      await Storage.set("isEnabledAutoPurge", !isEnabledAutoPurge);
      await preload();
      await loadView();
    } catch (err) {
      logger.error(err);
    }
  });

  // Add domain to whitelist
  elmBtnAddButton.addEventListener('click', async () => {
    if (!isEnabledAutoPurge) return;

    const input = elmTextDomainInput.value.trim().toLowerCase();
    if (!input) return;

    try {
      const domains = input.includes(',')
        ? input.split(',').map(d => d.trim()).filter(d => d)
        : [input];

      // Validate domain(s)
      const invalidDomains = domains.filter(d => !validDomainRegex.test(d));

      if (invalidDomains.length > 0) {
        elmSpanInputError.style.display = 'block';
        elmSpanInputError.innerText = domains.length > 1
          ? `Invalid domain names: ${invalidDomains.join(', ')}`
          : 'Invalid domain name!';
        return;
      }

      const whitelistToUpdate = await Storage.get("whitelist") || [];
      const duplicateDomains = domains.filter(d => whitelistToUpdate.includes(d));

      if (duplicateDomains.length > 0) {
        elmSpanInputError.innerText = domains.length > 1
          ? `These domains are already in the whitelist: ${duplicateDomains.join(', ')}`
          : 'This domain is already in the whitelist!';
        elmSpanInputError.style.display = 'block';
        return;
      }

      // Add new domains
      whitelistToUpdate.push(...domains);
      whitelistToUpdate.sort();
      await Storage.set("whitelist", whitelistToUpdate);
      loadWhitelist();
      elmTextDomainInput.value = '';
    } catch (err) {
      logger.error(err);
    }
  });

  // Remove domain from whitelist
  elmUlWhitelist.addEventListener('click', async (e) => {
    if (!isEnabledAutoPurge) return;

    if (e.target.classList.contains('remove-domain')) {
      const domain = e.target.dataset.domain;
      try {
        whitelist = await Storage.get("whitelist") || [];
        const newWhitelist = whitelist.filter((d) => d !== domain);
        await Storage.set("whitelist", newWhitelist);
        loadWhitelist();
      } catch (err) {
        logger.error(err);
      }
    }
  });

  // Add domain on Enter key press
  elmTextDomainInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      elmBtnAddButton.click();
    }
    preload();
  });

  init();
});
