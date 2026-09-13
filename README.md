# NodeBrain — Unified Multi-LLM Control Dashboard

**One panel. Two AI slots. Sixteen models. Zero tab chaos.**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Manifest_V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3)
[![Version](https://img.shields.io/badge/version-1.0.0-00ff41)](./manifest.json)
[![License](https://img.shields.io/badge/license-see_LICENSE-informational)](#license)
[![Author](https://img.shields.io/badge/author-Jeet_B_Bhatt-00bb30)](https://jeet-portfolio-61sl.vercel.app/)

**NodeBrain** (also branded **AI Commander**) is a free Chromium browser extension that lets you pick any two AI chat products, write a prompt for each, and fire both at once. Each prompt opens in its own tab and is typed into that site’s composer so you can compare answers without copy-pasting across windows.

> Keywords: Chrome extension, Manifest V3, multi LLM dashboard, ChatGPT Claude Gemini Grok DeepSeek Perplexity, prompt dispatcher, side-by-side AI comparison, productivity, developer tools.

---

## Why NodeBrain

People already keep ChatGPT, Claude, Gemini, and Grok in separate tabs. NodeBrain is the control room in front of those tabs:

- Assign **Slot A** and **Slot B** from a 16-model picker
- Write independent prompts (or the same prompt twice to A/B test)
- **Send** one slot, or **Fire Both** in parallel
- Prompts and slot choices persist in `chrome.storage.local`
- No backend, no API keys, no account on this project — you stay logged into each AI site yourself

Built by [Jeet Bhatt](https://jeet-portfolio-61sl.vercel.app/). Contact: [jeetbhatt1323@gmail.com](mailto:jeetbhatt1323@gmail.com)

---

## Features

| Feature | Detail |
| --- | --- |
| Dual-slot workspace | Two live prompt panels (Slot A / Slot B) |
| 16 supported chats | OpenAI, Anthropic, Google, xAI, DeepSeek, Perplexity, Moonshot, Mistral, Microsoft, Meta, Hugging Face, You.com, Poe, Cohere, Phind, Inflection |
| Fire Both | Dispatches armed slots at the same time |
| Per-model send | Send only Slot A or only Slot B |
| Session memory | Last assigned models and prompt text restore on reopen |
| Full-tab dashboard | Toolbar icon opens `dashboard.html` (reuses the tab if it is already open) |
| Terminal-style UI | Dark “ops” theme with activity log and slot status (IDLE / SENDING / DONE / ERROR) |

---

## Supported AI products

| ID | Product | Provider | Opens |
| --- | --- | --- | --- |
| `chatgpt` | ChatGPT | OpenAI | https://chatgpt.com/ |
| `claude` | Claude | Anthropic | https://claude.ai/new |
| `gemini` | Gemini | Google | https://gemini.google.com/ |
| `grok` | Grok | xAI | https://grok.com/ |
| `deepseek` | DeepSeek | DeepSeek AI | https://chat.deepseek.com/ |
| `perplexity` | Perplexity | Perplexity AI | https://www.perplexity.ai/ |
| `kimi` | Kimi | Moonshot AI | https://kimi.moonshot.cn/ |
| `mistral` | Le Chat | Mistral AI | https://chat.mistral.ai/chat |
| `copilot` | Copilot | Microsoft | https://copilot.microsoft.com/ |
| `metaai` | Meta AI | Meta | https://www.meta.ai/ |
| `huggingchat` | HuggingChat | Hugging Face | https://huggingface.co/chat/ |
| `you` | You.com | You.com | https://you.com/ |
| `poe` | Poe | Quora | https://poe.com/ |
| `cohere` | Coral | Cohere | https://coral.cohere.com/ |
| `phind` | Phind | Phind | https://www.phind.com/ |
| `pi` | Pi | Inflection AI | https://pi.ai/talk |

You must already be signed in on each site. NodeBrain does not log you in and does not call vendor APIs.

---

## How to use

1. Click a model chip to fill Slot A. Click another for Slot B. Click again to move or remove (cycle: empty → A → B → off).
2. Type a prompt in each panel. Text auto-saves locally.
3. Click SEND on one slot, or FIRE BOTH when both slots have a prompt.
4. New tabs open for those products. After the page loads, the extension injects the text and tries to click Send.
5. Read and compare answers in those tabs. The dashboard log reports success or failure.

If injection fails, stay logged in, wait for the chat UI to finish loading, and try again. Vendor pages change often; selectors may need a refresh.

# Permissions (why they exist)
Review these before you load the extension. GitHub and Chrome users look for this section.
| Permission       | Use                                                           |
| ---------------- | ------------------------------------------------------------- |
| tabs             | Open dashboard and AI tabs; reuse an existing dashboard tab   |
| scripting        | Inject the prompt into the loaded chat page                   |
| storage          | Remember Slot A/B and draft prompts                           |
| activeTab        | Declared for tab interaction with the active page             |
| clipboardWrite   | Clipboard paste path for editors such as Claude’s ProseMirror |
| Host permissions | Only the 16 listed https:// chat origins — not <all_urls>     |

### NodeBrain does not send your prompts to a NodeBrain server. Prompts stay in the browser until they are written into the AI site you chose.

# Requirements

- Chromium browser with Manifest V3 support (Chrome, Edge, Brave)
- Active sessions on the AI sites you want to use
- Clipboard permission may be requested for some inject paths (especially Claude)

# Troubleshooting

| Symptom                 | What to try                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| Dashboard does not open | Confirm the unpacked folder includes manifest.json and dashboard.html  |
| “Injection failed”      | Log into that AI site first; wait until the composer is visible; retry |
| Empty composer          | Site layout changed — update selectors in background.js / content.js   |
| Wrong model             | Click the chip until Slot A / B badges match the panel headers         |
| Fire Both does nothing  | Both slots need a non-empty prompt (“armed”)                           |

# Privacy

- No analytics SDK in this repo
- No remote NodeBrain API
- Slot IDs and prompt drafts are stored with chrome.storage.local on your machine
- Host access is limited to the chat URLs listed in manifest.json

# Disclaimer

NodeBrain is an independent productivity tool. It is not affiliated with, endorsed by, or a product of OpenAI, Anthropic, Google, xAI, DeepSeek, Perplexity, Moonshot, Mistral, Microsoft, Meta, Hugging Face, You.com, Quora, Cohere, Phind, or Inflection.

Use of each chat product remains subject to that provider’s terms of service. You are responsible for how you use generated output.

Chat UIs change without notice. Prompt injection can break until selectors are updated.

# Contributing

Issues and pull requests are welcome.

* Fork the repo and create a branch.
* Keep changes focused (background.js injection vs dashboard UI).
* Test on at least two vendors (for example ChatGPT + Claude) while logged in.
* Describe the site/UI change if you are fixing a broken selector.
* Please do not commit secrets, session cookies, or personal chat logs.

Thank You !!
