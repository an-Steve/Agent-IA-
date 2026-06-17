let isThinking = false;
let currentLang = 'fr'; // 'fr' ou 'en'

// 1. Ajoutez les traductions manquantes
const TRANSLATIONS = {
  fr: {
    statusLabel: "Système Opérationnel",
    toolCount: "7 outils activés",
    welcomeSubtitle: "Une interface d'agent avancée capable de planifier, chercher, coder et raisonner en autonomie.",
    placeholder: "Demandez n'importe quoi (recherche, code, analyse)...",
    inputHint: "<span>Enter</span> Envoyer · <span>Shift + Enter</span> Ligne",
    traceTitle: "Console d'exécution de l'agent",
    traceEmpty: "En attente d'instructions...<br>L'arbre de pensée s'affichera ici.",
    clearBtn: "[ clear ]",
    // Nouvelles traductions pour les suggestions
    titleSciences: "🎓 ENCYCLOPÉDIE & SCIENCES",
    btnSolar: "Système Solaire"
  },
  en: {
    statusLabel: "System Operational",
    toolCount: "7 tools activated",
    welcomeSubtitle: "An advanced agent interface capable of planning, searching, coding, and reasoning autonomously.",
    placeholder: "Ask anything (search, code, analysis)...",
    inputHint: "<span>Enter</span> Send · <span>Shift + Enter</span> Line break",
    traceTitle: "Agent Execution Console",
    traceEmpty: "Waiting for instructions...<br>The thought tree will be displayed here.",
    clearBtn: "[ clear ]",
    // Nouvelles traductions pour les suggestions
    titleSciences: "🎓 ENCYCLOPEDIA & SCIENCES",
    btnSolar: "Solar System"
  }
};

// 2. Mettez à jour la fonction pour appliquer les traductions et modifier la propriété "data-q" des boutons
function updateInterfaceLanguage() {
  const t = TRANSLATIONS[currentLang];
  const btn = document.getElementById('langBtn');
  
  if (btn) {
    btn.innerHTML = currentLang === 'fr' ? '🇫🇷 Français' : '🇬🇧 English';
  }
  
  if(document.getElementById('statusLabel')) document.getElementById('statusLabel').innerText = t.statusLabel;
  if(document.getElementById('toolCount')) document.getElementById('toolCount').innerText = t.toolCount;
  if(document.getElementById('welcomeSubtitle')) document.getElementById('welcomeSubtitle').innerText = t.welcomeSubtitle;
  if(document.getElementById('userInput')) document.getElementById('userInput').placeholder = t.placeholder;
  if(document.getElementById('inputHint')) document.getElementById('inputHint').innerHTML = t.inputHint;
  if(document.getElementById('traceTitle')) document.getElementById('traceTitle').innerText = t.traceTitle;
  if(document.getElementById('clearBtn')) document.getElementById('clearBtn').innerText = t.clearBtn;
  if(document.getElementById('traceEmptyText')) document.getElementById('traceEmptyText').innerHTML = t.traceEmpty;

  // Traduction des suggestions dynamiques
  if(document.getElementById('titleSciences')) document.getElementById('titleSciences').innerText = t.titleSciences;
  
  const btnSolar = document.getElementById('btnSolar');
  if(btnSolar) {
    btnSolar.querySelector('.btn-text').innerText = t.btnSolar;
    // On change la valeur envoyée lors du clic selon la langue active
    btnSolar.dataset.q = currentLang === 'fr' ? btnSolar.dataset.qFr : btnSolar.dataset.qEn;
  }
}

// 3. Réparation de la fonction coupée tout en bas de votre script
function showTyping() {
  const msgs = document.getElementById('messages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'msg agent';
  div.id = 'typing-indicator';
  div.innerHTML = `
    <div class="msg-avatar">⬡</div>
    <div class="msg-body">
      <div class="msg-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// Configuration des réponses de l'IA par langue
const AI_BRAIN = {
  fr: {
    greetings: [
      "Bonjour ! Je suis l'Agent IA CapG. Qu'est-ce qu'on code ou analyse aujourd'hui ? 🤖",
      "Hello ! Content de vous revoir. Je suis paré, balancez vos requêtes ! ⚡",
      "Salut ! Système opérationnel. En quoi puis-je vous assister ? ⬡"
    ],
    defaultResponse: "J'ai bien reçu votre demande. Mes modules d'analyse sont prêts à traiter cette information.",
    weatherResponse: "Veuillez suivre ce lien pour consulter les prévisions en temps réel :<br><br>👉 <a href='https://an-steve.github.io/Dashboard-Meteo/' target='_blank'>Cliquez ici pour accéder au Dashboard Météo</a>",
    toolTrace: "Appel de l'outil en cours...",
    toolOutput: "Analyse conceptuelle validée."
  },
  en: {
    greetings: [
      "Hello! I am AI Agent CapG. What are we coding or analyzing today? 🤖",
      "Hi there! Great to see you again. I'm ready, send over your requests! ⚡",
      "Hello! System operational. How can I assist you today? ⬡"
    ],
    defaultResponse: "I have successfully received your request. My analysis modules are ready to process this information.",
    weatherResponse: "Please follow this link to check the real-time weather forecast:<br><br>👉 <a href='https://an-steve.github.io/Dashboard-Meteo/' target='_blank'>Click here to access the Weather Dashboard</a>",
    toolTrace: "Calling tool in progress...",
    toolOutput: "Conceptual analysis validated."
  }
};

// Traductions de l'interface utilisateur
const TRANSLATIONS = {
  fr: {
    statusLabel: "Système Opérationnel",
    toolCount: "7 outils activés",
    welcomeSubtitle: "Une interface d'agent avancée capable de planifier, chercher, coder et raisonner en autonomie.",
    placeholder: "Demandez n'importe quoi (recherche, code, analyse)...",
    inputHint: "<span>Enter</span> Envoyer · <span>Shift + Enter</span> Ligne",
    traceTitle: "Console d'exécution de l'agent",
    traceEmpty: "En attente d'instructions...<br>L'arbre de pensée s'affichera ici.",
    clearBtn: "[ clear ]"
  },
  en: {
    statusLabel: "System Operational",
    toolCount: "7 tools activated",
    welcomeSubtitle: "An advanced agent interface capable of planning, searching, coding, and reasoning autonomously.",
    placeholder: "Ask anything (search, code, analysis)...",
    inputHint: "<span>Enter</span> Send · <span>Shift + Enter</span> Line break",
    traceTitle: "Agent Execution Console",
    traceEmpty: "Waiting for instructions...<br>The thought tree will be displayed here.",
    clearBtn: "[ clear ]"
  }
};

// 💾 Chargement de l'historique et de la langue au démarrage
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('chatHistory')) {
    document.getElementById('messages').innerHTML = localStorage.getItem('chatHistory');
  }
  if (localStorage.getItem('traceHistory')) {
    document.getElementById('traceBody').innerHTML = localStorage.getItem('traceHistory');
  }
  if (localStorage.getItem('langSetting')) {
    currentLang = localStorage.getItem('langSetting');
  }
  updateInterfaceLanguage();
});

// 💾 Sauvegarde automatique de l'état de l'interface
function saveState() {
  localStorage.setItem('chatHistory', document.getElementById('messages').innerHTML);
  localStorage.setItem('traceHistory', document.getElementById('traceBody').innerHTML);
}

function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById('themeBtn');
  body.classList.toggle('light-mode');
  if (btn) {
    btn.innerHTML = body.classList.contains('light-mode') ? '🌙 Mode Sombre' : '☀️ Mode Clair';
  }
}

function toggleLang() {
  currentLang = currentLang === 'fr' ? 'en' : 'fr';
  localStorage.setItem('langSetting', currentLang);
  updateInterfaceLanguage();
}

function updateInterfaceLanguage() {
  const t = TRANSLATIONS[currentLang];
  const btn = document.getElementById('langBtn');
  
  if (btn) {
    btn.innerHTML = currentLang === 'fr' ? '🇫🇷 Français' : '🇬🇧 English';
  }
  
  if(document.getElementById('statusLabel')) document.getElementById('statusLabel').innerText = t.statusLabel;
  if(document.getElementById('toolCount')) document.getElementById('toolCount').innerText = t.toolCount;
  if(document.getElementById('welcomeSubtitle')) document.getElementById('welcomeSubtitle').innerText = t.welcomeSubtitle;
  if(document.getElementById('userInput')) document.getElementById('userInput').placeholder = t.placeholder;
  if(document.getElementById('inputHint')) document.getElementById('inputHint').innerHTML = t.inputHint;
  if(document.getElementById('traceTitle')) document.getElementById('traceTitle').innerText = t.traceTitle;
  if(document.getElementById('clearBtn')) document.getElementById('clearBtn').innerText = t.clearBtn;
  if(document.getElementById('traceEmptyText')) document.getElementById('traceEmptyText').innerHTML = t.traceEmpty;
}

function closeTrace() {
  const panel = document.getElementById('tracePanel');
  if (panel) panel.style.display = 'none';
}

function formatTime() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function suggest(query) {
  const input = document.getElementById('userInput');
  if (input) {
    input.value = query;
    autoResize(input);
    sendMessage();
  }
}

function getRandomResponse(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function typeWriteMessage(element, text, callback) {
  let i = 0;
  element.innerHTML = "";

  function type() {
    if (i < text.length) {
      if (text.substr(i, 4) === '<br>') {
        element.innerHTML += '<br>';
        i += 4;
      } else if (text.substr(i, 2) === '<a') {
        const closingIdx = text.indexOf('</a>', i);
        if (closingIdx !== -1) {
          element.innerHTML += text.substring(i, closingIdx + 4);
          i = closingIdx + 4;
        } else {
          element.innerHTML += text.charAt(i);
          i++;
        }
      } else {
        element.innerHTML += text.charAt(i);
        i++;
      }
      setTimeout(type, Math.random() * 5 + 5);
      const msgs = document.getElementById('messages');
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
    } else {
      element.innerHTML = text;
      saveState();
      if (callback) callback();
    }
  }
  type();
}

function addMessage(role, content, isStreaming = false, callback = null) {
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.remove();

  const msgs = document.getElementById('messages');
  if (!msgs) return;
  
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  const avatar = role === 'agent' ? '⬡' : 'U';

  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-body">
      <div class="msg-bubble" id="latest-bubble"></div>
      <div class="msg-time">${formatTime()}</div>
    </div>
  `;
  msgs.appendChild(div);

  const bubble = div.querySelector('#latest-bubble');
  bubble.removeAttribute('id');

  if (isStreaming && role === 'agent') {
    typeWriteMessage(bubble, content, callback);
  } else {
    bubble.innerHTML = content;
    msgs.scrollTop = msgs.scrollHeight;
    saveState();
    if (callback) callback();
  }
}

function showTyping() {
  const msgs = document.getElementById('messages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'msg agent';
  div.id = 'typing-indicator';
  div.innerHTML = `
    <div class="msg-avatar">⬡</div>
    <div class="msg-body">
      <div class="msg-bubble">
        <div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>
      </div>
    </div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

function showThinkingTrace(message = "Agent en cours de traitement...") {
  const body = document.getElementById('traceBody');
  if (!body) return;
  const empty = document.getElementById('traceEmpty');
  if (empty) empty.remove();
  hideThinkingTrace();
  const div = document.createElement('div');
  div.className = 'thinking-trace';
  div.id = 'thinking-trace';
  div.innerHTML = `<div class="t-dot"></div><span>${message}</span>`;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function hideThinkingTrace() {
  const el = document.getElementById('thinking-trace');
  if (el) el.remove();
}

function addToolCard(toolName, input, output, duration) {
  const typeMap = {
    web_search: { cls: 'tool-web', icon: '🔍', label: 'WEB_SEARCH' },
    summarize: { cls: 'tool-summarize', icon: '📝', label: 'SUMMARIZE' },
    call_api: { cls: 'tool-api', icon: '⚡', label: 'CALL_API' },
    reason: { cls: 'tool-reason', icon: '🧠', label: 'REASON' },
    write_code: { cls: 'tool-code', icon: '💻', label: 'WRITE_CODE' }
  };
  const t = typeMap[toolName] || { cls: '', icon: '🔧', label: toolName.toUpperCase() };
  const body = document.getElementById('traceBody');
  if (!body) return;
  
  const card = document.createElement('div');
  card.className = `tool-card ${t.cls}`;
  card.innerHTML = `
    <div class="tool-card-header" onclick="this.parentElement.classList.toggle('expanded')">
      <div class="tool-icon">${t.icon}</div>
      <span class="tool-name">${t.label}</span>
      <span class="tool-badge">SUCCESS</span>
      <span class="tool-duration">${duration}ms</span>
    </div>
    <div class="tool-card-body">
      <div class="tool-label">Arguments d'entrée</div>
      <div class="tool-value">${JSON.stringify(input, null, 2)}</div>
      <div class="tool-label">Retour Outil</div>
      <div class="tool-value">${output}</div>
    </div>
  `;
  card.classList.add('expanded');
  body.appendChild(card);
  body.scrollTop = body.scrollHeight;
  saveState();
}

function clearTrace() {
  const emptyText = TRANSLATIONS[currentLang].traceEmpty;
  const body = document.getElementById('traceBody');
  if (body) {
    body.innerHTML = `
      <div class="trace-empty" id="traceEmpty">
        <p id="traceEmptyText">${emptyText}</p>
      </div>`;
  }
  saveState();
}

function resetChat() {
  localStorage.clear();
  const msgs = document.getElementById('messages');
  if (msgs) {
    msgs.innerHTML = `
      <div class="welcome" id="welcome">
        <div class="welcome-orb">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#00E5FF" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <h2>Agent IA CapG</h2>
        <p class="welcome-subtitle" id="welcomeSubtitle">${TRANSLATIONS[currentLang].welcomeSubtitle}</p>
      </div>`;
  }
  clearTrace();
  window.location.reload(); 
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function sendMessage() {
  if (isThinking) return;
  const input = document.getElementById('userInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const sendBtn = document.getElementById('sendBtn');
  input.value = '';
  input.style.height = 'auto';
  if (sendBtn) sendBtn.disabled = true;
  isThinking = true;

  addMessage('user', text.replace(/\n/g, '<br>'));
  showTyping();

  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const langKit = AI_BRAIN[currentLang];

  let chosenTool = "reason";
  let toolInput = { problem: text };
  let toolOutput = langKit.toolOutput;
  let finalResponse = "";

  // Détection d'intentions multi-langues (Météo ou Salutations)
  if (lower.includes("meteo") || lower.includes("weather")) {
    chosenTool = "web_search";
    toolInput = { query: "dashboard meteo an-steve" };
    toolOutput = currentLang === 'fr' ? "Routage vers le dashboard." : "Routing to dashboard.";
    finalResponse = langKit.weatherResponse;
  } else if (lower.includes("bonjour") || lower.includes("hello") || lower.includes("salut") || lower.includes("hi")) {
    finalResponse = getRandomResponse(langKit.greetings);
  } else {
    finalResponse = langKit.defaultResponse;
  }

  // Animation de la console
  showThinkingTrace(langKit.toolTrace);
  await sleep(1200);
  hideThinkingTrace();
  addToolCard(chosenTool, toolInput, toolOutput, 450);

  await sleep(400);
  hideTyping();
  addMessage('agent', finalResponse, true);

  isThinking = false;
  if (sendBtn) sendBtn.disabled = false;
}let isThinking = false;

const AI_BRAIN = {
  greetings_casual: [
    "Bonjour ! Je suis l'Agent IA CapG. Qu'est-ce qu'on code ou analyse aujourd'hui ? 🤖",
    "Hello ! Content de vous revoir. Je suis paré, balancez vos requêtes ! ⚡",
    "Salut ! Système opérationnel. En quoi puis-je vous assister ? ⬡"
  ],
  greetings_formal: [
    "Bonjour. Je suis pleinement opérationnel et prêt à exécuter vos tâches complexes. Posez-moi vos questions.",
    "Salutations. Tous mes modules (Recherche, Code, Raisonnement) sont activés. Que souhaitez-vous analyser ?"
  ],
  health_check: [
    "Je fonctionne à 100% de mes capacités ! CPU nominal, RAM optimisée. Et vous ? 😊",
    "Tout est vert de mon côté. Prêt à faire chauffer les Transformers ! 🧠"
  ]
};

function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById('themeBtn');
  body.classList.toggle('light-mode');
  btn.innerHTML = body.classList.contains('light-mode') ? '🌙 Mode Sombre' : '☀️ Mode Clair';
}

function closeTrace() {
  document.getElementById('tracePanel').style.display = 'none';
}

function formatTime() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function suggest(query) {
  document.getElementById('userInput').value = query;
  autoResize(document.getElementById('userInput'));
  sendMessage();
}

function getRandomResponse(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function typeWriteMessage(element, text, callback) {
  let i = 0;
  element.innerHTML = "";

  function type() {
    if (i < text.length) {
      if (text.substr(i, 4) === '<br>') {
        element.innerHTML += '<br>';
        i += 4;
      } else if (text.substr(i, 2) === '<a') {
        const closingIdx = text.indexOf('</a>', i);
        if (closingIdx !== -1) {
          element.innerHTML += text.substring(i, closingIdx + 4);
          i = closingIdx + 4;
        } else {
          element.innerHTML += text.charAt(i);
          i++;
        }
      } else {
        element.innerHTML += text.charAt(i);
        i++;
      }
      setTimeout(type, Math.random() * 5 + 5);
      document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
    } else {
      element.innerHTML = text;
      if (callback) callback();
    }
  }
  type();
}

function addMessage(role, content, isStreaming = false, callback = null) {
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.remove();

  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  const avatar = role === 'agent' ? '⬡' : 'U';

  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-body">
      <div class="msg-bubble" id="latest-bubble"></div>
      <div class="msg-time">${formatTime()}</div>
    </div>
  `;
  msgs.appendChild(div);

  const bubble = div.querySelector('#latest-bubble');
  bubble.removeAttribute('id');

  if (isStreaming && role === 'agent') {
    typeWriteMessage(bubble, content, callback);
  } else {
    bubble.innerHTML = content;
    msgs.scrollTop = msgs.scrollHeight;
    if (callback) callback();
  }
}

function showTyping() {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg agent';
  div.id = 'typing-indicator';
  div.innerHTML = `
    <div class="msg-avatar">⬡</div>
    <div class="msg-body">
      <div class="msg-bubble">
        <div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>
      </div>
    </div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

function showThinkingTrace(message = "Agent en cours de traitement...") {
  const body = document.getElementById('traceBody');
  const empty = document.getElementById('traceEmpty');
  if (empty) empty.remove();
  hideThinkingTrace();
  const div = document.createElement('div');
  div.className = 'thinking-trace';
  div.id = 'thinking-trace';
  div.innerHTML = `<div class="t-dot"></div><span>${message}</span>`;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function hideThinkingTrace() {
  const el = document.getElementById('thinking-trace');
  if (el) el.remove();
}

function addToolCard(toolName, input, output, duration) {
  const typeMap = {
    web_search: { cls: 'tool-web', icon: '🔍', label: 'WEB_SEARCH' },
    summarize: { cls: 'tool-summarize', icon: '📝', label: 'SUMMARIZE' },
    call_api: { cls: 'tool-api', icon: '⚡', label: 'CALL_API' },
    reason: { cls: 'tool-reason', icon: '🧠', label: 'REASON' },
    write_code: { cls: 'tool-code', icon: '💻', label: 'WRITE_CODE' }
  };
  const t = typeMap[toolName] || { cls: '', icon: '🔧', label: toolName.toUpperCase() };
  const body = document.getElementById('traceBody');
  const card = document.createElement('div');
  card.className = `tool-card ${t.cls}`;
  card.innerHTML = `
    <div class="tool-card-header" onclick="this.parentElement.classList.toggle('expanded')">
      <div class="tool-icon">${t.icon}</div>
      <span class="tool-name">${t.label}</span>
      <span class="tool-badge">SUCCESS</span>
      <span class="tool-duration">${duration}ms</span>
    </div>
    <div class="tool-card-body">
      <div class="tool-label">Arguments d'entrée</div>
      <div class="tool-value">${JSON.stringify(input, null, 2)}</div>
      <div class="tool-label">Retour Outil</div>
      <div class="tool-value">${output}</div>
    </div>
  `;
  card.classList.add('expanded');
  body.appendChild(card);
  body.scrollTop = body.scrollHeight;
}

function clearTrace() {
  document.getElementById('traceBody').innerHTML = `
    <div class="trace-empty" id="traceEmpty">
      <p>En attente d'instructions...<br>L'arbre de pensée s'affichera ici.</p>
    </div>`;
}

function resetChat() {
  document.getElementById('messages').innerHTML = `
    <div class="welcome" id="welcome">
      <div class="welcome-orb">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#00E5FF" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
      <h2>Agent IA CapG</h2>
      <p class="welcome-subtitle">Une interface d'agent avancée capable de planifier, chercher, coder et raisonner en autonomie.</p>
    </div>`;
  clearTrace();
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function sendMessage() {
  if (isThinking) return;
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';
  document.getElementById('sendBtn').disabled = true;
  isThinking = true;

  addMessage('user', text.replace(/\n/g, '<br>'));
  showTyping();

  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  let chosenTool = "reason";
  let toolInput = { problem: text };
  let toolOutput = "Analyse conceptuelle validée.";
  let finalResponse = "";

  // ── MÉTÉO → Dashboard externe ──
  if (lower.includes("meteo")) {
    chosenTool = "web_search";
    toolInput = { query: "dashboard meteo an-steve" };
    toolOutput = "Routage effectué vers : https://an-steve.github.io/Dashboard-Meteo/";
    finalResponse = "Veuillez suivre ce lien pour consulter les prévisions en temps réel :<br><br>👉 <a href='https://an-steve.github.io/Dashboard-Meteo/' target='_blank'>Cliquez ici pour accéder au Dashboard Météo</a>";
    showThinkingTrace("Appel du module météo externe...");
    await sleep(800);
    hideThinkingTrace();
    addToolCard(chosenTool, toolInput, toolOutput, 310);
    hideTyping();
    addMessage('agent', finalResponse, true, () => {
      document.getElementById('sendBtn').disabled = false;
      isThinking = false;
    });
    return;
  }

  // ── GÉOGRAPHIE → Google Maps ──
  if (lower.includes("geographie mondiale") || lower.includes("google maps") || lower.includes("carte du monde") ||
      lower.includes("geographie") || lower.includes("capitale") || lower.includes("sommet") || lower.includes("pays")) {
    chosenTool = "web_search";
    toolInput = { query: "google maps world" };
    toolOutput = "Routage vers la carte mondiale effectué.";
    finalResponse = "Voici un outil interactif pour explorer le monde :<br><br>👉 <a href='https://www.google.com/maps' target='_blank'>Ouvrir Google Maps</a>";
    showThinkingTrace("Recherche cartographique en cours...");
    await sleep(800);
    hideThinkingTrace();
    addToolCard(chosenTool, toolInput, toolOutput, 350);
    hideTyping();
    addMessage('agent', finalResponse, true, () => {
      document.getElementById('sendBtn').disabled = false;
      isThinking = false;
    });
    return;
  }

  // ── RÉPONSE PAR DÉFAUT ──
  finalResponse = "J'ai bien reçu votre demande. Mes modules de raisonnement analysent actuellement la requête : '" + text + "'.";
  showThinkingTrace("Traitement de la requête générale...");
  await sleep(1000);
  hideThinkingTrace();
  addToolCard(chosenTool, toolInput, toolOutput, 450);
  hideTyping();
  addMessage('agent', finalResponse, true, () => {
    document.getElementById('sendBtn').disabled = false;
    isThinking = false;
  });
}
