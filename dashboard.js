// dashboard.js — Full dashboard logic (CSP compliant)

const BOTS = ['chatgpt', 'claude', 'gemini', 'grok'];

function log(msg, type = '') {
  const box = document.getElementById('logbox');
  const d = document.createElement('div');
  d.className = 'le ' + type;
  d.textContent = '» ' + msg;
  box.appendChild(d);
  box.scrollTop = box.scrollHeight;
}

function setStatus(bot, s) {
  const el = document.getElementById('s-' + bot);
  if (!el) return;
  el.textContent = s;
  el.className = 'sbadge' +
    (s === 'SENDING' ? ' sending' : s === 'DONE' ? ' done' : s === 'ERROR' ? ' error' : '');
}

function updateCounter() {
  const n = BOTS.filter(b => document.getElementById('p-' + b)?.value.trim()).length;
  document.getElementById('counter').textContent = n + ' / 4 LOADED';
  document.getElementById('hstatus').textContent =
    n === 0 ? 'AWAITING ORDERS' :
    n === 4 ? 'ALL SYSTEMS ARMED' :
    n + ' SYSTEM' + (n > 1 ? 'S' : '') + ' ARMED';
}

async function sendOne(bot) {
  const prompt = document.getElementById('p-' + bot)?.value.trim();
  if (!prompt) { log('No prompt for ' + bot.toUpperCase(), 'err'); return; }

  setStatus(bot, 'SENDING');
  log('Dispatching to ' + bot.toUpperCase() + '...', 'inf');

  try {
    const res = await chrome.runtime.sendMessage({ action: 'sendToBot', bot, prompt });
    if (res?.ok) {
      setStatus(bot, 'DONE');
      log(bot.toUpperCase() + ' ✓ Prompt delivered — tab opened', 'ok');
    } else {
      setStatus(bot, 'ERROR');
      log(bot.toUpperCase() + ' ✗ ' + (res?.error || 'Failed'), 'err');
    }
  } catch (e) {
    setStatus(bot, 'ERROR');
    log(bot.toUpperCase() + ' ✗ ' + e.message, 'err');
  }
}

async function fireAll() {
  const active = BOTS.filter(b => document.getElementById('p-' + b)?.value.trim());
  if (!active.length) { log('NO MISSIONS LOADED. Enter prompts first.', 'err'); return; }
  log('FIRING ' + active.length + ' MISSION(S)...', 'inf');
  await Promise.all(active.map(b => sendOne(b)));
  log('ALL MISSIONS FIRED ⚡ CHECK YOUR NEW TABS', 'ok');
}

function clearAll() {
  BOTS.forEach(b => {
    const el = document.getElementById('p-' + b);
    if (el) el.value = '';
    setStatus(b, 'IDLE');
  });
  chrome.storage.local.remove(BOTS.map(b => b + '_p'));
  document.getElementById('logbox').innerHTML =
    '<div class="le inf">» CLEARED. READY FOR NEW MISSION.</div>';
  updateCounter();
}

// Auto-save as user types
function setupAutoSave() {
  BOTS.forEach(b => {
    document.getElementById('p-' + b)?.addEventListener('input', () => {
      chrome.storage.local.set({ [b + '_p']: document.getElementById('p-' + b).value });
      updateCounter();
    });
  });
}

// Restore saved prompts on load
function restorePrompts() {
  chrome.storage.local.get(BOTS.map(b => b + '_p'), data => {
    BOTS.forEach(b => {
      const el = document.getElementById('p-' + b);
      if (el && data[b + '_p']) el.value = data[b + '_p'];
    });
    updateCounter();
  });
}

// Wire up buttons
document.addEventListener('DOMContentLoaded', () => {
  BOTS.forEach(b => {
    document.getElementById('btn-' + b)?.addEventListener('click', () => sendOne(b));
  });
  document.getElementById('fireAllBtn')?.addEventListener('click', fireAll);
  document.getElementById('clearBtn')?.addEventListener('click', clearAll);
  setupAutoSave();
  restorePrompts();
  log('DASHBOARD LOADED. ALL 4 SYSTEMS STANDING BY.', 'ok');
});