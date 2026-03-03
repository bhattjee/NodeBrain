// background.js — Opens dashboard as full tab + handles prompt injection

const DASHBOARD_URL = chrome.runtime.getURL('dashboard.html');

const BOT_URLS = {
  chatgpt: 'https://chatgpt.com/',
  claude:  'https://claude.ai/new',
  gemini:  'https://gemini.google.com/',
  grok:    'https://grok.com/'
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Click extension icon → open dashboard as full tab ────
chrome.action.onClicked.addListener(async () => {
  const tabs = await chrome.tabs.query({});
  const existing = tabs.find(t => t.url && t.url.includes('dashboard.html'));
  if (existing) {
    await chrome.tabs.update(existing.id, { active: true });
    await chrome.windows.update(existing.windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url: DASHBOARD_URL, active: true });
  }
});

// ── Listen for messages from dashboard.js ────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'sendToBot') {
    sendToBot(msg.bot, msg.prompt)
      .then(sendResponse)
      .catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }
});

// ── Always open fresh tab and inject ─────────────────────
async function sendToBot(bot, prompt) {
  const url = BOT_URLS[bot];
  const tab = await chrome.tabs.create({ url, active: true });
  await waitForLoad(tab.id);

  const extraWait = { chatgpt: 3000, claude: 3500, gemini: 3000, grok: 3000 };
  await sleep(extraWait[bot] || 3000);

  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectPromptInPage,
        args: [prompt, bot]
      });
      const ok = results?.[0]?.result;
      if (ok) return { ok: true };
    } catch (e) {
      console.log(`Attempt ${attempt} failed:`, e.message);
    }
    await sleep(1500);
  }
  return { ok: false, error: 'Injection failed after 6 attempts.' };
}

// ── Injected into AI page — must be self-contained ───────
function injectPromptInPage(prompt, bot) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const INPUT_SELECTORS = {
    chatgpt: ['#prompt-textarea','div[contenteditable="true"]','textarea[placeholder]','textarea'],
    claude:  ['.ProseMirror[contenteditable="true"]','div.ProseMirror','div[contenteditable="true"]'],
    gemini:  ['div.ql-editor[contenteditable="true"]','rich-textarea div[contenteditable="true"]','div[contenteditable="true"]','textarea'],
    grok:    ['textarea[placeholder]','div[contenteditable="true"]','textarea']
  };

  const SEND_SELECTORS = {
    chatgpt: ['button[data-testid="send-button"]','button[aria-label="Send prompt"]','button[aria-label="Send message"]'],
    claude:  ['button[aria-label="Send Message"]','button[aria-label="Send message"]','button[data-testid="send-button"]','button[type="submit"]'],
    gemini:  ['button.send-button','button[aria-label="Send message"]','button[mattooltip="Send message"]'],
    grok:    ['button[data-testid="tweetButton"]','button[type="submit"]','button[aria-label*="send" i]']
  };

  function getInput() {
    for (const sel of (INPUT_SELECTORS[bot] || [])) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function getSendBtn() {
    for (const sel of (SEND_SELECTORS[bot] || [])) {
      const el = document.querySelector(sel);
      if (el && !el.disabled) return el;
    }
    return null;
  }

  async function clickSend(input) {
    await sleep(700);
    const btn = getSendBtn();
    if (btn) { btn.click(); return; }
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true,cancelable:true
    }));
  }

  async function injectClaude(input) {
    input.click(); input.focus(); await sleep(400);
    document.execCommand('selectAll',false,null);
    document.execCommand('delete',false,null);
    await sleep(200);
    try {
      await navigator.clipboard.writeText(prompt);
      document.execCommand('paste');
      await sleep(600);
      if (input.innerText.trim().length > 2) { await clickSend(input); return true; }
    } catch(e) {}
    try {
      const dt = new DataTransfer();
      dt.setData('text/plain', prompt);
      input.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:dt}));
      await sleep(600);
      if (input.innerText.trim().length > 2) { await clickSend(input); return true; }
    } catch(e) {}
    input.innerText = prompt;
    input.dispatchEvent(new InputEvent('input',{bubbles:true}));
    await sleep(500);
    await clickSend(input);
    return true;
  }

  async function run() {
    let input = null;
    for (let i = 0; i < 8; i++) {
      input = getInput();
      if (input) break;
      await sleep(1000);
    }
    if (!input) return false;
    if (bot === 'claude') return injectClaude(input);
    if (input.tagName === 'TEXTAREA') {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set;
      setter.call(input, prompt);
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
      await sleep(500);
      await clickSend(input);
      return true;
    }
    input.focus(); input.click(); await sleep(200);
    document.execCommand('selectAll',false,null);
    document.execCommand('insertText',false,prompt);
    input.dispatchEvent(new InputEvent('input',{bubbles:true,cancelable:true,data:prompt}));
    await sleep(500);
    await clickSend(input);
    return true;
  }

  return run();
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
    setTimeout(resolve, 20000);
  });
}