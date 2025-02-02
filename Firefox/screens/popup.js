document.addEventListener('DOMContentLoaded', () => {
  const domainInput = document.getElementById('domain');
  const addButton = document.getElementById('add');
  const whitelistElement = document.getElementById('whitelist');

  // Load and display whitelist
  function loadWhitelist() {
    browser.storage.local.get('whitelist').then(result => {
      const whitelist = result.whitelist || [];
      whitelistElement.innerHTML = '';
      
      whitelist.forEach(domain => {
        const li = document.createElement('li');
        li.innerHTML = `
          ${domain}
          <span class="remove-domain" data-domain="${domain}">✕</span>
        `;
        whitelistElement.appendChild(li);
      });
    });
  }

  // Add domain to whitelist
  addButton.addEventListener('click', () => {
    const domain = domainInput.value.trim();
    if (domain) {
      browser.storage.local.get('whitelist').then(result => {
        const whitelist = result.whitelist || [];
        if (!whitelist.includes(domain)) {
          whitelist.push(domain);
          browser.storage.local.set({ whitelist });
          loadWhitelist();
          domainInput.value = '';
        }
      });
    }
  });

  // Remove domain from whitelist
  whitelistElement.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-domain')) {
      const domain = e.target.dataset.domain;
      browser.storage.local.get('whitelist').then(result => {
        const whitelist = result.whitelist || [];
        const newWhitelist = whitelist.filter(d => d !== domain);
        browser.storage.local.set({ whitelist: newWhitelist });
        loadWhitelist();
      });
    }
  });

  // Initial load
  loadWhitelist();
}); 
