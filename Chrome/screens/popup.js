document.addEventListener('DOMContentLoaded', () => {
  const domainInput = document.getElementById('domainInput');
  const addButton = document.getElementById('addDomain');
  const whitelistElement = document.getElementById('whitelist');

  // Load and display whitelisted domains
  function loadWhitelist() {
    chrome.storage.local.get(['whitelist'], (result) => {
      const whitelist = result.whitelist || [];
      whitelistElement.innerHTML = '';
      
      whitelist.forEach(domain => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span>${domain}</span>
          <span class="remove-domain" data-domain="${domain}">x</span>
        `;
        whitelistElement.appendChild(li);
      });
    });
  }

  // Add new domain
  addButton.addEventListener('click', async () => {
    const domain = domainInput.value.trim().toLowerCase();
    
    if (domain) {
      try {
        const result = await chrome.storage.local.get(['whitelist']);
        const domains = result.whitelist || [];
        
        if (!domains.includes(domain)) {
          domains.push(domain);
          await chrome.storage.local.set({ whitelist: domains });
          
          domainInput.value = '';
          loadWhitelist();
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
    if (e.target.classList.contains('remove-domain')) {
      const domainToRemove = e.target.dataset.domain;
      try {
        const result = await chrome.storage.local.get(['whitelist']);
        const domains = result.whitelist || [];
        const updatedDomains = domains.filter((d) => d !== domainToRemove);

        await chrome.storage.local.set({ whitelist: updatedDomains });
        loadWhitelist();
      } catch (error) {
        console.error('Error removing domain:', error);
      }
    }
  });

  // Add domain on Enter key press
  domainInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addButton.click();
    }
  });

  // Initial load
  loadWhitelist();
});
