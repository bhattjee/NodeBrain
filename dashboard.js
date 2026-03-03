// dashboard.js — All models, 2-slot picker system

// ── ALL AVAILABLE MODELS ─────────────────────────────────
const ALL_MODELS = [
  // Tier 1 — Big players
  { id:'chatgpt',    name:'ChatGPT',      by:'OpenAI',        color:'#00ff41', tag:'GPT',  url:'https://chatgpt.com/' },
  { id:'claude',     name:'Claude',       by:'Anthropic',     color:'#ff8c42', tag:'CLA',  url:'https://claude.ai/new' },
  { id:'gemini',     name:'Gemini',       by:'Google',        color:'#4fc3f7', tag:'GEM',  url:'https://gemini.google.com/' },
  { id:'grok',       name:'Grok',         by:'xAI',           color:'#bf5fff', tag:'GRK',  url:'https://grok.com/' },
  // Tier 2 — Rising fast
  { id:'deepseek',   name:'DeepSeek',     by:'DeepSeek AI',   color:'#00e5ff', tag:'DSK',  url:'https://chat.deepseek.com/' },
  { id:'perplexity', name:'Perplexity',   by:'Perplexity AI', color:'#ffd740', tag:'PPX',  url:'https://www.perplexity.ai/' },
  { id:'kimi',       name:'Kimi',         by:'Moonshot AI',   color:'#69ff47', tag:'KIM',  url:'https://kimi.moonshot.cn/' },
  { id:'mistral',    name:'Le Chat',      by:'Mistral AI',    color:'#ff6b6b', tag:'MST',  url:'https://chat.mistral.ai/' },
  { id:'copilot',    name:'Copilot',      by:'Microsoft',     color:'#40c4ff', tag:'CPL',  url:'https://copilot.microsoft.com/' },
  // Tier 3 — Others
  { id:'metaai',     name:'Meta AI',      by:'Meta',          color:'#5c8fff', tag:'MET',  url:'https://www.meta.ai/' },
  { id:'huggingchat',name:'HuggingChat',  by:'HuggingFace',   color:'#ffab40', tag:'HUG',  url:'https://huggingface.co/chat/' },
  { id:'you',        name:'You.com',      by:'You.com',       color:'#e040fb', tag:'YOU',  url:'https://you.com/' },
  { id:'poe',        name:'Poe',          by:'Quora',         color:'#ff80ab', tag:'POE',  url:'https://poe.com/' },
  { id:'cohere',     name:'Coral',        by:'Cohere',        color:'#b9f6ca', tag:'COH',  url:'https://coral.cohere.com/' },
  { id:'phind',      name:'Phind',        by:'Phind',         color:'#ea80fc', tag:'PHD',  url:'https://www.phind.com/' },
  { id:'pi',         name:'Pi',           by:'Inflection AI', color:'#ff9e80', tag:'PI',   url:'https://pi.ai/' },
];

// ── STATE ────────────────────────────────────────────────
// slot1 and slot2 hold model IDs or null
let state = { slot1: null, slot2: null };

// ── HELPERS ──────────────────────────────────────────────
function log(msg, type = '') {
  const box = document.getElementById('logbox');
  const d = document.createElement('div');
  d.className = 'le ' + type;
  d.textContent = '» ' + msg;
  box.appendChild(d);
  box.scrollTop = box.scrollHeight;
}

function setStatus(slot, s) {
  const el = document.getElementById('s-' + slot);
  if (!el) return;
  el.textContent = s;
  el.className = 'sbadge' +
    (s==='SENDING'?' sending': s==='DONE'?' done': s==='ERROR'?' error':'');
}

function getModel(id) {
  return ALL_MODELS.find(m => m.id === id);
}

// ── UPDATE SLOT UI ────────────────────────────────────────
function updateSlotUI(slot) {
  const modelId = state[slot];
  const model   = modelId ? getModel(modelId) : null;
  const badge   = document.getElementById('badge-' + slot);
  const pname   = document.getElementById('pname-' + slot);
  const plabel  = document.getElementById('plabel-' + slot);
  const empty   = document.getElementById('empty-' + slot);
  const textarea= document.getElementById('p-' + slot);

  if (model) {
    badge.textContent    = model.tag;
    badge.style.color    = model.color;
    badge.style.borderColor = model.color + '55';
    badge.style.background  = model.color + '11';
    pname.textContent    = model.name.toUpperCase() + ' · ' + model.by.toUpperCase();
    plabel.textContent   = 'MISSION BRIEF → ' + model.name.toUpperCase();
    empty.style.display  = 'none';
    textarea.style.display = 'flex';
    textarea.placeholder = `Type your prompt for ${model.name}...\n\nExample tasks:\n→ Write a React login component with form validation\n→ Build a REST API with authentication\n→ Research best database for real-time apps\n→ Generate a PostgreSQL schema for e-commerce`;
    textarea.focus();
  } else {
    badge.textContent    = '—';
    badge.style.color    = slot === 'slot1' ? '#00ff41' : '#4fc3f7';
    badge.style.borderColor = slot === 'slot1' ? 'rgba(0,255,65,0.3)' : 'rgba(79,195,247,0.3)';
    badge.style.background  = slot === 'slot1' ? 'rgba(0,255,65,0.06)' : 'rgba(79,195,247,0.06)';
    pname.textContent    = 'NO MODEL SELECTED';
    plabel.textContent   = 'SELECT A MODEL ABOVE TO BEGIN';
    empty.style.display  = 'flex';
    textarea.style.display = 'none';
    textarea.value       = '';
    setStatus(slot, 'IDLE');
  }
  updateCounter();
}

// ── RENDER MODEL CHIPS ────────────────────────────────────
function renderChips() {
  const grid = document.getElementById('modelsGrid');
  grid.innerHTML = '';
  ALL_MODELS.forEach(model => {
    const chip = document.createElement('div');
    chip.className = 'model-chip';
    chip.id = 'chip-' + model.id;

    // Check if assigned
    const isSlot1 = state.slot1 === model.id;
    const isSlot2 = state.slot2 === model.id;
    if (isSlot1) chip.classList.add('slot1');
    if (isSlot2) chip.classList.add('slot2');

    chip.innerHTML = `
      <div class="chip-dot" style="background:${model.color};box-shadow:0 0 5px ${model.color}"></div>
      <span>${model.name}</span>
      <span style="font-size:8px;opacity:.5">${model.by}</span>
      ${isSlot1 ? '<span class="chip-slot s1">A</span>' : ''}
      ${isSlot2 ? '<span class="chip-slot s2">B</span>' : ''}
    `;

    chip.addEventListener('click', () => onChipClick(model.id));
    grid.appendChild(chip);
  });
}

// ── CHIP CLICK LOGIC ─────────────────────────────────────
// Click cycle: unassigned → slot1 → slot2 → unassigned
function onChipClick(modelId) {
  const isSlot1 = state.slot1 === modelId;
  const isSlot2 = state.slot2 === modelId;

  if (!isSlot1 && !isSlot2) {
    // Not assigned → assign to first empty slot
    if (!state.slot1) {
      state.slot1 = modelId;
      log('Assigned ' + getModel(modelId).name + ' to SLOT A', 'ok');
    } else if (!state.slot2) {
      state.slot2 = modelId;
      log('Assigned ' + getModel(modelId).name + ' to SLOT B', 'ok');
    } else {
      // Both full — replace slot1
      log('Both slots full. Replacing SLOT A with ' + getModel(modelId).name, 'inf');
      state.slot1 = modelId;
    }
  } else if (isSlot1) {
    // In slot1 → move to slot2
    if (state.slot2) {
      // slot2 taken → just remove from slot1
      state.slot1 = null;
      log(getModel(modelId).name + ' removed from SLOT A', '');
    } else {
      state.slot1 = null;
      state.slot2 = modelId;
      log(getModel(modelId).name + ' moved to SLOT B', 'ok');
    }
  } else if (isSlot2) {
    // In slot2 → remove
    state.slot2 = null;
    log(getModel(modelId).name + ' removed from SLOT B', '');
  }

  renderChips();
  updateSlotUI('slot1');
  updateSlotUI('slot2');
  saveState();
}

// ── COUNTER ──────────────────────────────────────────────
function updateCounter() {
  let armed = 0;
  ['slot1','slot2'].forEach(slot => {
    if (state[slot] && document.getElementById('p-' + slot)?.value.trim()) armed++;
  });
  document.getElementById('counter').textContent = armed + ' / 2 SLOTS ARMED';
}

// ── SEND ─────────────────────────────────────────────────
async function sendSlot(slot) {
  const modelId = state[slot];
  if (!modelId) { log('No model in ' + slot.toUpperCase().replace('SLOT','SLOT '), 'err'); return; }

  const prompt = document.getElementById('p-' + slot)?.value.trim();
  if (!prompt) { log('No prompt in SLOT ' + (slot==='slot1'?'A':'B'), 'err'); return; }

  const model = getModel(modelId);
  setStatus(slot, 'SENDING');
  log('Dispatching to ' + model.name + '...', 'inf');

  try {
    const res = await chrome.runtime.sendMessage({
      action: 'sendToBot', bot: modelId, prompt
    });
    if (res?.ok) {
      setStatus(slot, 'DONE');
      log(model.name + ' ✓ New tab opened — prompt delivered', 'ok');
    } else {
      setStatus(slot, 'ERROR');
      log(model.name + ' ✗ ' + (res?.error || 'Failed'), 'err');
    }
  } catch(e) {
    setStatus(slot, 'ERROR');
    log(model.name + ' ✗ ' + e.message, 'err');
  }
}

async function fireAll() {
  const active = ['slot1','slot2'].filter(s =>
    state[s] && document.getElementById('p-' + s)?.value.trim()
  );
  if (!active.length) { log('NO MISSIONS LOADED. Select models and enter prompts.', 'err'); return; }
  log('FIRING ' + active.length + ' MISSION(S) SIMULTANEOUSLY...', 'inf');
  await Promise.all(active.map(s => sendSlot(s)));
  log('ALL MISSIONS FIRED ⚡ CHECK YOUR NEW TABS', 'ok');
}

function clearAll() {
  ['slot1','slot2'].forEach(slot => {
    const el = document.getElementById('p-' + slot);
    if (el) el.value = '';
    setStatus(slot, 'IDLE');
  });
  chrome.storage.local.remove(['slot1_p','slot2_p']);
  document.getElementById('logbox').innerHTML =
    '<div class="le inf">» CLEARED. READY FOR NEW MISSION.</div>';
  updateCounter();
}

// ── PERSIST ───────────────────────────────────────────────
function saveState() {
  chrome.storage.local.set({ 
    aicommander_slot1: state.slot1,
    aicommander_slot2: state.slot2
  });
}

function restoreState() {
  chrome.storage.local.get(['aicommander_slot1','aicommander_slot2','slot1_p','slot2_p'], data => {
    if (data.aicommander_slot1) state.slot1 = data.aicommander_slot1;
    if (data.aicommander_slot2) state.slot2 = data.aicommander_slot2;
    renderChips();
    updateSlotUI('slot1');
    updateSlotUI('slot2');
    if (data.slot1_p) { const el = document.getElementById('p-slot1'); if(el) el.value = data.slot1_p; }
    if (data.slot2_p) { const el = document.getElementById('p-slot2'); if(el) el.value = data.slot2_p; }
    updateCounter();
  });
}

// Auto-save prompts
function setupAutoSave() {
  ['slot1','slot2'].forEach(slot => {
    document.getElementById('p-' + slot)?.addEventListener('input', () => {
      chrome.storage.local.set({ [slot + '_p']: document.getElementById('p-' + slot).value });
      updateCounter();
    });
  });
}

// ── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderChips();
  updateSlotUI('slot1');
  updateSlotUI('slot2');

  document.getElementById('btn-slot1')?.addEventListener('click', () => sendSlot('slot1'));
  document.getElementById('btn-slot2')?.addEventListener('click', () => sendSlot('slot2'));
  document.getElementById('fireAllBtn')?.addEventListener('click', fireAll);
  document.getElementById('clearBtn')?.addEventListener('click', clearAll);

  setupAutoSave();
  restoreState();
  log('DASHBOARD LOADED · ' + ALL_MODELS.length + ' MODELS AVAILABLE · SELECT 2 TO BEGIN', 'ok');
});