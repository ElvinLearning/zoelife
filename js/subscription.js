/* Consent changes require an explicit button press; GET/link scanners do nothing. */
(() => {
  const params = new URLSearchParams(location.search);
  const action = params.get('action');
  const token = params.get('token');
  // Keep the private token out of subsequent navigation and referrers.
  history.replaceState(null, '', location.pathname);
  const status = document.getElementById('status');
  const form = document.getElementById('subscription-form');
  const button = document.getElementById('subscription-button');
  const endpoint = window.ZOE_CONFIG?.newsletterEndpoint;
  if (!/^(confirm|unsubscribe)$/.test(action || '') || !/^[a-f0-9-]{72}$/.test(token || '') || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(endpoint || '')) {
    status.textContent = 'This link is unavailable. Please request a new signup on the website, or email contact@zoelifehub.com for help.';
    return;
  }
  button.textContent = action === 'confirm' ? 'Confirm subscription' : 'Unsubscribe';
  status.textContent = `Select the button below to ${button.textContent.toLowerCase()}.`;
  form.hidden = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    status.textContent = 'Saving your preference…';
    try {
      const response = await fetch(endpoint, {
        method: 'POST', credentials: 'omit', redirect: 'follow',
        body: new URLSearchParams({action, token, format: 'json'}),
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error('Request failed');
      const result = await response.json();
      if (result.state === 'expired') {
        form.hidden = true;
        status.textContent = 'This confirmation has expired. Please sign up again on the website.';
      } else if (result.success === true && result.state === (action === 'confirm' ? 'subscribed' : 'unsubscribed')) {
        form.hidden = true;
        status.textContent = action === 'confirm' ? 'Your subscription is confirmed. Thank you for joining Zoe Life.' : 'You are unsubscribed from Zoe Life updates.';
      } else throw new Error('Preference was not saved');
    } catch {
      status.textContent = 'We could not confirm that your preference was saved. Try again, or email contact@zoelifehub.com for help.';
      button.disabled = false;
    }
  });
})();
