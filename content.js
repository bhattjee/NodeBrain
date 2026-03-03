// content.js — Fixed with proper Claude ProseMirror support

const sleep = ms => new Promise(r => setTimeout(r, ms));

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'typePrompt') {
    injectPrompt(msg.prompt, msg.bot)
      .then(ok => sendResponse({ ok }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
});

// ── Find the text input on each AI site ───────────────────
function findInput(bot) {
  const selectors = {
    chatgpt: [
      '#prompt-textarea',
      'div[contenteditable="true"][data-virtualkeyboard-widget]',
      'div[contenteditable="true"]',
      'textarea[placeholder]'
    ],
    claude: [
      '.ProseMirror[contenteditable="true"]',
      'div.ProseMirror',
      '[contenteditable="true"][translate="no"]',
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

  for (const sel of (selectors[bot] || ['textarea'])) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

// ── Find the send button ───────────────────────────────────
function findSendButton(bot) {
  const selectors = {
    chatgpt: [
      'button[data-testid="send-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Send message"]'
    ],
    claude: [
      'button[aria-label="Send Message"]',
      'button[aria-label="Send message"]',
      'button[data-testid="send-button"]',
      'button[type="submit"]'
    ],
    gemini: [
      'button.send-button',
      'button[aria-label="Send message"]',
      'button[mattooltip="Send message"]'
    ],
    grok: [
      'button[type="submit"]',
      'button[aria-label*="send" i]',
      'button[aria-label*="Send" i]'
    ]
  };

  for (const sel of (selectors[bot] || ['button[type="submit"]'])) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

// ── Claude-specific: paste via clipboard API ──────────────
async function injectIntoClaude(prompt) {
  // Step 1: find the editor with retries
  let editor = null;
  for (let i = 0; i < 6; i++) {
    editor = document.querySelector('.ProseMirror[contenteditable="true"]')
          || document.querySelector('div.ProseMirror')
          || document.querySelector('[contenteditable="true"]');
    if (editor) break;
    await sleep(1000);
  }
  if (!editor) return false;

  // Step 2: click to focus the editor
  editor.click();
  editor.focus();
  await sleep(400);

  // Step 3: select all existing content and delete it
  document.execCommand('selectAll', false, null);
  await sleep(150);
  document.execCommand('delete', false, null);
  await sleep(150);

  // Step 4: use Clipboard API to paste — most reliable for ProseMirror
  try {
    await navigator.clipboard.writeText(prompt);
    document.execCommand('paste');
    await sleep(500);
  } catch (e) {
    // Clipboard blocked — fallback to DataTransfer paste event
    const dt = new DataTransfer();
    dt.setData('text/plain', prompt);
    editor.dispatchEvent(new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: dt
    }));
    await sleep(500);
  }

  // Step 5: verify text appeared, if not try direct DOM insert
  if (!editor.innerText || editor.innerText.trim().length < 2) {
    editor.focus();
    editor.innerText = prompt;
    editor.dispatchEvent(new InputEvent('input', { bubbles: true, data: prompt }));
    await sleep(400);
  }

  // Step 6: click send button
  await sleep(600);
  const btn = findSendButton('claude');
  if (btn && !btn.disabled) {
    btn.click();
    return true;
  }

  // Step 7: fallback — press Enter
  editor.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
  }));
  return true;
}

// ── Generic inject for ChatGPT / Gemini / Grok ────────────
async function injectGeneric(prompt, bot) {
  let input = null;
  for (let i = 0; i < 5; i++) {
    input = findInput(bot);
    if (input) break;
    await sleep(1000);
  }
  if (!input) return false;

  input.focus();
  await sleep(300);

  if (input.tagName === 'TEXTAREA') {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    ).set;
    nativeSetter.call(input, prompt);
    input.dispatchEvent(new Event('input',  { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    input.innerHTML = '';
    input.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, prompt);
    input.dispatchEvent(new InputEvent('input', {
      bubbles: true, cancelable: true, data: prompt
    }));
  }

  await sleep(700);

  const btn = findSendButton(bot);
  if (btn && !btn.disabled) {
    btn.click();
    return true;
  }

  input.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
  }));
  return true;
}

// ── Main entry point ──────────────────────────────────────
async function injectPrompt(prompt, bot) {
  if (bot === 'claude') {
    return await injectIntoClaude(prompt);
  }
  return await injectGeneric(prompt, bot);
}