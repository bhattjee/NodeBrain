// background.js — Supports all 16 AI models

const DASHBOARD_URL = chrome.runtime.getURL('dashboard.html');

const BOT_URLS = {
  chatgpt:    'https://chatgpt.com/',
  claude:     'https://claude.ai/new',
  gemini:     'https://gemini.google.com/',
  grok:       'https://grok.com/',
  deepseek:   'https://chat.deepseek.com/',
  perplexity: 'https://www.perplexity.ai/',
  kimi:       'https://kimi.moonshot.cn/',
  mistral:    'https://chat.mistral.ai/chat',
  copilot:    'https://copilot.microsoft.com/',
  metaai:     'https://www.meta.ai/',
  huggingchat:'https://huggingface.co/chat/',
  you:        'https://you.com/',
  poe:        'https://poe.com/',
  cohere:     'https://coral.cohere.com/',
  phind:      'https://www.phind.com/',
  pi:         'https://pi.ai/talk',
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Open dashboard as full tab on icon click
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

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'sendToBot') {
    sendToBot(msg.bot, msg.prompt)
      .then(sendResponse)
      .catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }
});

async function sendToBot(bot, prompt) {
  const url = BOT_URLS[bot];
  if (!url) return { ok: false, error: 'Unknown bot: ' + bot };

  const tab = await chrome.tabs.create({ url, active: true });
  await waitForLoad(tab.id);

  // Extra wait per bot (some need longer to boot)
  const waits = {
    claude:3500, chatgpt:3000, gemini:3000, grok:3000,
    deepseek:3500, perplexity:3000, kimi:4000, mistral:3000,
    copilot:4000, metaai:3500, huggingchat:3500, you:3000,
    poe:3500, cohere:3000, phind:3000, pi:3500
  };
  await sleep(waits[bot] || 3000);

  for (let i = 1; i <= 6; i++) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectPromptInPage,
        args: [prompt, bot]
      });
      if (results?.[0]?.result) return { ok: true };
    } catch(e) { console.log('Attempt', i, 'failed:', e.message); }
    await sleep(1500);
  }
  return { ok: false, error: 'Injection failed. Make sure you are logged in.' };
}

// Self-contained — runs inside the AI page
function injectPromptInPage(prompt, bot) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const INPUTS = {
    chatgpt:    ['#prompt-textarea','div[contenteditable="true"]','textarea'],
    claude:     ['.ProseMirror[contenteditable="true"]','div.ProseMirror','div[contenteditable="true"]'],
    gemini:     ['div.ql-editor[contenteditable="true"]','rich-textarea div[contenteditable="true"]','div[contenteditable="true"]','textarea'],
    grok:       ['textarea[placeholder]','div[contenteditable="true"]','textarea'],
    deepseek:   ['textarea[placeholder]','div[contenteditable="true"]','textarea#chat-input','textarea'],
    perplexity: ['textarea[placeholder]','div[contenteditable="true"]','textarea'],
    kimi:       ['div[contenteditable="true"]','textarea[placeholder]','textarea'],
    mistral:    ['div[contenteditable="true"]','textarea[placeholder]','textarea'],
    copilot:    ['div[contenteditable="true"]','textarea[placeholder]','textarea','cib-text-input textarea'],
    metaai:     ['div[contenteditable="true"]','textarea[placeholder]','textarea'],
    huggingchat:['div[contenteditable="true"]','textarea[placeholder]','textarea'],
    you:        ['div[contenteditable="true"]','textarea[placeholder]','textarea'],
    poe:        ['div[contenteditable="true"]','textarea[placeholder]','textarea'],
    cohere:     ['div[contenteditable="true"]','textarea[placeholder]','textarea'],
    phind:      ['div[contenteditable="true"]','textarea[placeholder]','textarea'],
    pi:         ['textarea[placeholder]','div[contenteditable="true"]','textarea'],
  };

  const SENDS = {
    chatgpt:    ['button[data-testid="send-button"]','button[aria-label="Send prompt"]','button[aria-label="Send message"]'],
    claude:     ['button[aria-label="Send Message"]','button[aria-label="Send message"]','button[data-testid="send-button"]','button[type="submit"]'],
    gemini:     ['button.send-button','button[aria-label="Send message"]','button[mattooltip="Send message"]'],
    grok:       ['button[type="submit"]','button[aria-label*="send" i]'],
    deepseek:   ['button[type="submit"]','div[role="button"][aria-label*="send" i]','button[aria-label*="send" i]'],
    perplexity: ['button[aria-label="Submit"]','button[type="submit"]','button[aria-label*="send" i]'],
    kimi:       ['button[type="submit"]','button[aria-label*="send" i]','div[role="button"]'],
    mistral:    ['button[type="submit"]','button[aria-label*="send" i]','button[data-testid*="send"]'],
    copilot:    ['button[type="submit"]','button[aria-label*="send" i]','cib-icon-button'],
    metaai:     ['button[type="submit"]','button[aria-label*="send" i]','div[aria-label*="send" i]'],
    huggingchat:['button[type="submit"]','button[aria-label*="send" i]'],
    you:        ['button[type="submit"]','button[aria-label*="send" i]','button[data-testid*="send"]'],
    poe:        ['button[class*="send"]','button[type="submit"]','button[aria-label*="send" i]'],
    cohere:     ['button[type="submit"]','button[aria-label*="send" i]','button[data-testid*="send"]'],
    phind:      ['button[type="submit"]','button[aria-label*="send" i]'],
    pi:         ['button[type="submit"]','button[aria-label*="send" i]','div[role="button"]'],
  };

  function getInput() {
    for (const sel of (INPUTS[bot] || [])) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function getSend() {
    for (const sel of (SENDS[bot] || [])) {
      const el = document.querySelector(sel);
      if (el && !el.disabled) return el;
    }
    return null;
  }

  async function clickSend(input) {
    await sleep(700);
    const btn = getSend();
    if (btn) { btn.click(); return; }
    input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true,cancelable:true}));
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

  async function injectTextarea(input) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set;
    setter.call(input, prompt);
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
    await sleep(500);
    await clickSend(input);
    return true;
  }

  async function injectContentEditable(input) {
    input.focus(); input.click(); await sleep(200);
    document.execCommand('selectAll',false,null);
    document.execCommand('insertText',false,prompt);
    input.dispatchEvent(new InputEvent('input',{bubbles:true,cancelable:true,data:prompt}));
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
    if (input.tagName === 'TEXTAREA') return injectTextarea(input);
    return injectContentEditable(input);
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