// content.js — Runs inside ChatGPT/Claude/Gemini/Grok pages
// Receives prompt from background.js and types it into the page

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'typePrompt') {
    injectPrompt(msg.prompt, msg.bot)
      .then(ok => sendResponse({ ok }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function injectPrompt(prompt, bot) {
  const input = findInput(bot);
  if (!input) return false;

  input.focus();
  await sleep(300);

  // Handle textarea vs contenteditable differently
  if (input.tagName === 'TEXTAREA') {
    // Use native setter to bypass React's event system
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    ).set;
    setter.call(input, prompt);
    input.dispatchEvent(new Event('input',  { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    // ContentEditable div (most modern AI sites use this)
    input.innerHTML = '';
    input.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, prompt);
    input.dispatchEvent(new InputEvent('input', { bubbles: true, data: prompt }));
  }

  await sleep(700);

  // Click the send button
  const btn = findSendButton(bot);
  if (btn && !btn.disabled) {
    btn.click();
    return true;
  }

  // Fallback: simulate Enter key press
  input.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true
  }));

  return true;
}

function findInput(bot) {
  const map = {
    chatgpt: [
      '#prompt-textarea',
      'div[contenteditable="true"][data-id="root"]',
      'div[contenteditable="true"]',
      'textarea[placeholder]'
    ],
    claude: [
      '.ProseMirror[contenteditable="true"]',
      'div.ProseMirror[contenteditable="true"]',
      'div[contenteditable="true"]'
    ],
    gemini: [
      'div.ql-editor[contenteditable="true"]',
      'rich-textarea div[contenteditable="true"]',
      'div[contenteditable="true"]',
      'textarea'
    ],
    grok: [
      'textarea[placeholder]',
      'div[contenteditable="true"]',
      'textarea'
    ]
  };

  for (const sel of (map[bot] || ['textarea'])) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function findSendButton(bot) {
  const map = {
    chatgpt: [
      'button[data-testid="send-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Send message"]'
    ],
    claude: [
      'button[aria-label="Send Message"]',
      'button[aria-label="Send message"]',
      'button[type="submit"]'
    ],
    gemini: [
      'button.send-button',
      'button[aria-label="Send message"]',
      'button[mattooltip="Send message"]'
    ],
    grok: [
      'button[type="submit"]',
      'button[aria-label*="send" i]'
    ]
  };

  for (const sel of (map[bot] || ['button[type="submit"]'])) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}
