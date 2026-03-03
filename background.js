// background.js — Opens tabs and coordinates everything

const BOT_URLS = {
  chatgpt: 'https://chatgpt.com/',
  claude:  'https://claude.ai/new',
  gemini:  'https://gemini.google.com/',
  grok:    'https://grok.com/'
};

const BOT_HOSTS = {
  chatgpt: 'chatgpt.com',
  claude:  'claude.ai',
  gemini:  'gemini.google.com',
  grok:    'grok.com'
};

// Listen for messages from popup.html
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'sendToBot') {
    sendToBot(msg.bot, msg.prompt)
      .then(sendResponse)
      .catch(e => sendResponse({ ok: false, error: e.message }));
    return true; // keep message channel open for async
  }
});

async function sendToBot(bot, prompt) {
  const url  = BOT_URLS[bot];
  const host = BOT_HOSTS[bot];

  // Check if tab is already open
  const allTabs = await chrome.tabs.query({});
  let tab = allTabs.find(t => t.url && t.url.includes(host));

  if (!tab) {
    // Open new tab (keep in background, don't steal focus)
    tab = await chrome.tabs.create({ url, active: true });
    await waitForLoad(tab.id);
    await sleep(2500); // wait for page JS to fully init
  } else {
    // For Claude, always go to /new for fresh chat
    if (bot === 'claude' && !tab.url.includes('/new')) {
      await chrome.tabs.update(tab.id, { url });
      await waitForLoad(tab.id);
      await sleep(2500);
    }
    await chrome.tabs.update(tab.id, { active: true });
    await sleep(500);
  }

  // Try to send message to content.js (retry 5 times)
  for (let i = 0; i < 5; i++) {
    try {
      const result = await chrome.tabs.sendMessage(tab.id, {
        action: 'typePrompt',
        prompt,
        bot
      });
      if (result?.ok) return { ok: true };
    } catch (e) {
      // content script not ready yet, wait and retry
    }
    await sleep(1200);
  }

  return { ok: false, error: 'Page did not respond after 5 attempts' };
}

function waitForLoad(tabId) {
  return new Promise(resolve => {
    const fn = (id, info) => {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(fn);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(fn);
    setTimeout(resolve, 15000); // timeout after 15s
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));