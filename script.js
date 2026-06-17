let isThinking = false;

const initialWelcomeHTML = document.getElementById('welcome')?.outerHTML || '';

const AI_BRAIN = {
  greetings_casual: [
    "Bonjour ! Je suis l'Agent IA CapG. Qu'est-ce qu'on code ou analyse aujourd'hui ? 🤖",
    "Hello ! Content de vous revoir. Je suis prêt. Donnez-moi une question, un code ou une idée à structurer. ⚡",
    "Salut ! Système opérationnel. Je peux expliquer, rédiger, calculer, planifier ou aider à corriger du code. ⬡"
  ],
  health_check: [
    "Tout est vert de mon côté : interface active, modules prêts, mémoire de conversation locale disponible pour cette session. 😊",
    "Je fonctionne correctement. Donnez-moi une mission et je lance le bon module."
  ]
};

const MAX_FILE_CHARS = 18000;
const SUPPORTED_FILE_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'text/css',
  'text/javascript',
  'application/json',
  'application/xml'
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeText(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById('themeBtn');
  body.classList.toggle('light-mode');
  btn.textContent = body.classList.contains('light-mode') ? '🌙 Mode Sombre' : '☀️ Mode Clair';
}

function openTrace() {
  document.getElementById('tracePanel').style.display = 'flex';
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
  const input = document.getElementById('userInput');
  input.value = query;
  autoResize(input);
  sendMessage();
}

function isReadableFile(file) {
  const readableExtension = /\.(txt|md|csv|json|html|css|js|py|xml|log)$/i.test(file.name);
  return SUPPORTED_FILE_TYPES.includes(file.type) || readableExtension || file.type === '';
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.readAsText(file, 'UTF-8');
  });
}

async function handleFileImport(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file || isThinking) return;

  if (!isReadableFile(file)) {
    addMessage('agent', "Je peux résumer les fichiers texte : TXT, MD, CSV, JSON, HTML, CSS, JS, PY, XML ou LOG.");
    return;
  }

  if (file.size > 1024 * 1024) {
    addMessage('agent', "Le fichier est trop volumineux pour cette version locale. Essaie avec un fichier de moins de 1 Mo.");
    return;
  }

  try {
    const content = await readFileAsText(file);
    const trimmed = content.trim();

    if (!trimmed) {
      addMessage('agent', `Le fichier "${file.name}" est vide, je n’ai rien à résumer.`);
      return;
    }

    const excerpt = trimmed.slice(0, MAX_FILE_CHARS);
    const truncatedNote = trimmed.length > MAX_FILE_CHARS
      ? "\n\n[Note : le fichier est long, seules les premières parties ont été envoyées au résumé.]"
      : "";

    const prompt = [
      `Résume le contenu du fichier "${file.name}" en français.`,
      "Donne :",
      "1. Le sujet principal.",
      "2. Les points importants.",
      "3. Les actions ou informations à retenir.",
      "",
      "Contenu du fichier :",
      excerpt + truncatedNote
    ].join("\n");

    await sendMessage(prompt, {
      displayText: `📎 Fichier importé : ${file.name}\nRésumé demandé automatiquement.`,
      source: 'file_import'
    });
  } catch {
    addMessage('agent', "Je n’ai pas réussi à lire ce fichier. Vérifie qu’il s’agit bien d’un fichier texte.");
  }
}

function getRandomResponse(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function typeWriteMessage(element, html, callback) {
  let i = 0;
  element.innerHTML = '';

  function type() {
    if (i < html.length) {
      const nextBreak = html.substring(i, i + 4) === '<br>';
      const nextTag = html.charAt(i) === '<';

      if (nextBreak) {
        element.innerHTML += '<br>';
        i += 4;
      } else if (nextTag) {
        const closingIdx = html.indexOf('>', i);
        if (closingIdx !== -1) {
          element.innerHTML += html.substring(i, closingIdx + 1);
          i = closingIdx + 1;
        } else {
          element.innerHTML += escapeHTML(html.charAt(i));
          i++;
        }
      } else {
        element.innerHTML += html.charAt(i);
        i++;
      }

      setTimeout(type, Math.random() * 5 + 5);
      scrollMessages();
    } else {
      element.innerHTML = html;
      if (callback) callback();
    }
  }

  type();
}

function scrollMessages() {
  const messages = document.getElementById('messages');
  messages.scrollTop = messages.scrollHeight;
}

function addMessage(role, content, isStreaming = false, callback = null, trustedHTML = false) {
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.remove();

  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  const avatar = role === 'agent' ? '⬡' : 'U';
  const html = trustedHTML ? content : escapeHTML(content).replace(/\n/g, '<br>');

  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-body">
      <div class="msg-bubble"></div>
      <div class="msg-time">${formatTime()}</div>
    </div>
  `;
  msgs.appendChild(div);

  const bubble = div.querySelector('.msg-bubble');
  if (isStreaming && role === 'agent') {
    typeWriteMessage(bubble, html, callback);
  } else {
    bubble.innerHTML = html;
    scrollMessages();
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
  scrollMessages();
}

function hideTyping() {
  document.getElementById('typing-indicator')?.remove();
}

function showThinkingTrace(message = 'Agent en cours de traitement...') {
  const body = document.getElementById('traceBody');
  document.getElementById('traceEmpty')?.remove();
  hideThinkingTrace();

  const div = document.createElement('div');
  div.className = 'thinking-trace';
  div.id = 'thinking-trace';
  div.innerHTML = `<div class="t-dot"></div><span>${escapeHTML(message)}</span>`;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function hideThinkingTrace() {
  document.getElementById('thinking-trace')?.remove();
}

function addToolCard(toolName, input, output, duration) {
  const typeMap = {
    web_search: { cls: 'tool-web', icon: '🔍', label: 'WEB_SEARCH' },
    summarize: { cls: 'tool-summarize', icon: '📝', label: 'SUMMARIZE' },
    call_api: { cls: 'tool-api', icon: '⚡', label: 'CALL_API' },
    reason: { cls: 'tool-reason', icon: '🧠', label: 'REASON' },
    write_code: { cls: 'tool-code', icon: '💻', label: 'WRITE_CODE' },
    python_agent: { cls: 'tool-python', icon: '🐍', label: 'PYTHON_AGENT' }
  };
  const t = typeMap[toolName] || { cls: '', icon: '🔧', label: toolName.toUpperCase() };
  const body = document.getElementById('traceBody');
  document.getElementById('traceEmpty')?.remove();

  const card = document.createElement('div');
  card.className = `tool-card ${t.cls} expanded`;
  card.innerHTML = `
    <div class="tool-card-header" onclick="this.parentElement.classList.toggle('expanded')">
      <div class="tool-icon">${t.icon}</div>
      <span class="tool-name">${t.label}</span>
      <span class="tool-badge">SUCCESS</span>
      <span class="tool-duration">${duration}ms</span>
    </div>
    <div class="tool-card-body">
      <div class="tool-label">Arguments d'entrée</div>
      <div class="tool-value">${escapeHTML(JSON.stringify(input, null, 2))}</div>
      <div class="tool-label">Retour outil</div>
      <div class="tool-value">${escapeHTML(output)}</div>
    </div>
  `;
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
  document.getElementById('messages').innerHTML = initialWelcomeHTML;
  document.getElementById('userInput').value = '';
  document.getElementById('sendBtn').disabled = false;
  isThinking = false;
  clearTrace();
}

function evaluateMath(text) {
  const match = text.match(/[0-9][0-9\s+\-*/().,xX]+[0-9)]/);
  if (!match) return null;

  const expression = match[0].replace(/,/g, '.').replace(/[xX]/g, '*');
  if (!/^[0-9+\-*/().\s]+$/.test(expression)) return null;

  try {
    const result = Function(`"use strict"; return (${expression})`)();
    if (!Number.isFinite(result)) return null;
    return { expression: expression.trim(), result };
  } catch {
    return null;
  }
}

function summarizeText(text) {
  const source = text.split(':').slice(1).join(':').trim() || text;
  const sentences = source
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(sentence => sentence.length > 25)
    .slice(0, 3);

  if (sentences.length === 0) {
    return "Collez le texte après votre demande, par exemple :<br><br><code>Résume : votre texte ici...</code>";
  }

  return `Voici une synthèse exploitable :<ul>${sentences.map(sentence => `<li>${escapeHTML(sentence)}</li>`).join('')}</ul>`;
}

function buildResponse(text) {
  const lower = normalizeText(text);
  const math = evaluateMath(text);

  if (/^(bonjour|salut|hello|bonsoir|coucou)\b/.test(lower)) {
    return {
      tool: 'reason',
      input: { intent: 'salutation' },
      output: 'Réponse conversationnelle générée.',
      trace: 'Détection d’une salutation...',
      html: escapeHTML(getRandomResponse(AI_BRAIN.greetings_casual))
    };
  }

  if (lower.includes('comment ca va') || lower.includes('tu vas bien') || lower.includes('fonctionne')) {
    return {
      tool: 'reason',
      input: { intent: 'health_check' },
      output: 'État local vérifié.',
      trace: 'Vérification de l’état de l’agent...',
      html: escapeHTML(getRandomResponse(AI_BRAIN.health_check))
    };
  }

  if (math || lower.includes('calcul')) {
    const answer = math
      ? `Le calcul donne :<br><br><code>${escapeHTML(math.expression)} = ${escapeHTML(math.result)}</code>`
      : "Je peux calculer une expression simple. Exemple : <code>Combien font (150 + 250) * 4 / 2 ?</code>";
    return {
      tool: 'call_api',
      input: { expression: math?.expression || text },
      output: math ? String(math.result) : 'Expression non reconnue.',
      trace: 'Évaluation mathématique locale...',
      html: answer
    };
  }

  if (lower.includes('meteo')) {
    return {
      tool: 'web_search',
      input: { query: 'dashboard météo an-steve' },
      output: 'Routage vers le dashboard météo externe.',
      trace: 'Préparation du module météo...',
      html: "Pour la météo en temps réel, ouvrez le dashboard dédié :<br><br>👉 <a href='https://an-steve.github.io/Dashboard-Meteo/' target='_blank' rel='noopener'>Dashboard Météo</a>"
    };
  }

  if (lower.includes('geographie') || lower.includes('capitale') || lower.includes('sommet') || lower.includes('pays')) {
    return {
      tool: 'web_search',
      input: { topic: 'géographie mondiale' },
      output: 'Réponse géographique locale + lien carte.',
      trace: 'Analyse de la question géographique...',
      html: "Réponse rapide : la capitale du Japon est <strong>Tokyo</strong>, et le plus haut sommet du monde est <strong>l’Everest</strong>, à environ 8 849 m.<br><br>Pour explorer une carte : 👉 <a href='https://www.google.com/maps' target='_blank' rel='noopener'>Ouvrir Google Maps</a>"
    };
  }

  if (lower.includes('planete') || lower.includes('jupiter') || lower.includes('systeme solaire')) {
    return {
      tool: 'summarize',
      input: { topic: 'système solaire' },
      output: 'Fiche encyclopédique générée.',
      trace: 'Construction d’une réponse scientifique...',
      html: "Le système solaire contient huit planètes : Mercure, Vénus, Terre, Mars, Jupiter, Saturne, Uranus et Neptune.<br><br><strong>Jupiter</strong> est la plus massive : c’est une géante gazeuse, connue pour sa Grande Tache rouge, son champ magnétique puissant et ses nombreuses lunes, dont Io, Europe, Ganymède et Callisto."
    };
  }

  if (lower.includes('antiquite') || lower.includes('histoire') || lower.includes('frise')) {
    return {
      tool: 'summarize',
      input: { topic: 'frise historique' },
      output: 'Repères historiques structurés.',
      trace: 'Organisation chronologique...',
      html: "Repères majeurs :<ul><li><strong>Antiquité</strong> : Égypte ancienne, Grèce classique, Empire romain.</li><li><strong>Moyen Âge</strong> : royaumes européens, monde islamique médiéval, féodalité.</li><li><strong>Époque moderne</strong> : Renaissance, grandes découvertes, monarchies et révolutions.</li><li><strong>Époque contemporaine</strong> : industrialisation, guerres mondiales, numérique et mondialisation.</li></ul>"
    };
  }

  if (lower.includes('mitose') || lower.includes('svt') || lower.includes('cellulaire')) {
    return {
      tool: 'reason',
      input: { topic: 'mitose cellulaire' },
      output: 'Explication SVT générée.',
      trace: 'Simplification pédagogique...',
      html: "La mitose est la division d’une cellule mère en deux cellules filles identiques. Elle sert à la croissance, au renouvellement des tissus et à la réparation.<br><br>Étapes clés : prophase, métaphase, anaphase, télophase, puis cytocinèse."
    };
  }

  if (lower.includes('javascript') || lower.includes('code') || lower.includes('fonction') || lower.includes('bug') || lower.includes('map()')) {
    const bugMode = lower.includes('bug') || lower.includes('map()');
    return {
      tool: 'write_code',
      input: { language: 'javascript', request: text },
      output: bugMode ? 'Correction défensive proposée.' : 'Exemple JavaScript généré.',
      trace: 'Activation du module code...',
      html: bugMode
        ? "Si <code>users</code> peut être absent, protégez l’appel à <code>map()</code> :<br><br><pre><code>const names = (users ?? []).map(user => user.name);</code></pre>Avec ça, le code retourne un tableau vide au lieu de planter."
        : "Voici une fonction JavaScript pour trier par date :<br><br><pre><code>function sortByDate(items, key = 'date') {\n  return [...items].sort((a, b) => new Date(a[key]) - new Date(b[key]));\n}</code></pre>"
    };
  }

  if (lower.includes('transformer') || lower.includes('attention') || lower.includes('llm')) {
    return {
      tool: 'reason',
      input: { topic: 'transformers' },
      output: 'Concept IA expliqué.',
      trace: 'Décomposition d’un concept IA...',
      html: "Un Transformer traite une séquence en comparant les mots entre eux grâce à l’<strong>attention</strong>. Chaque mot reçoit un poids selon les autres mots utiles au contexte.<br><br>Dans un LLM, cette mécanique permet de prédire le prochain token en s’appuyant sur les relations apprises pendant l’entraînement."
    };
  }

  if (lower.includes('email') || lower.includes('e-mail') || lower.includes('mail')) {
    return {
      tool: 'write_code',
      input: { format: 'email professionnel' },
      output: 'Courriel rédigé.',
      trace: 'Rédaction professionnelle...',
      html: "Objet : Information concernant le délai de livraison<br><br>Bonjour,<br><br>Nous vous informons qu’un retard impacte la livraison initialement prévue. Nous mettons tout en œuvre pour finaliser l’expédition dans les meilleurs délais et reviendrons vers vous avec une date actualisée.<br><br>Nous vous prions de nous excuser pour ce désagrément.<br><br>Cordialement,"
    };
  }

  if (lower.includes('rapport') || lower.includes('plan detaille')) {
    return {
      tool: 'summarize',
      input: { format: 'plan de rapport' },
      output: 'Plan structuré généré.',
      trace: 'Structuration d’un plan...',
      html: "Plan conseillé :<ul><li>Introduction : contexte, problématique, objectifs.</li><li>Analyse de l’existant : besoins, contraintes, limites.</li><li>Méthodologie : outils, choix techniques, organisation.</li><li>Réalisation : étapes, résultats, difficultés.</li><li>Bilan : apports, limites, perspectives.</li></ul>"
    };
  }

  if (lower.includes('resume') || lower.includes('synthese') || lower.includes('fichier')) {
    return {
      tool: 'summarize',
      input: { textLength: text.length },
      output: 'Synthèse préparée.',
      trace: 'Extraction des points clés...',
      html: summarizeText(text)
    };
  }

  if (lower.includes('actualite') || lower.includes('finance') || lower.includes('eur/usd') || lower.includes('economique')) {
    return {
      tool: 'web_search',
      input: { query: text },
      output: 'Demande temps réel détectée.',
      trace: 'Détection d’une demande d’actualité...',
      html: "Cette demande dépend de données en temps réel. Sans API connectée dans cette page, je préfère ne pas inventer de chiffres.<br><br>Sources utiles : 👉 <a href='https://news.google.com/' target='_blank' rel='noopener'>Google Actualités</a> · <a href='https://www.ecb.europa.eu/stats/eurofxref/' target='_blank' rel='noopener'>Taux de change BCE</a>"
    };
  }

  return {
    tool: 'reason',
    input: { problem: text },
    output: 'Réponse générale structurée.',
    trace: 'Traitement de la requête générale...',
    html: `J’ai bien reçu : <strong>${escapeHTML(text)}</strong><br><br>Je peux vous aider à transformer ça en plan, explication, code, résumé ou message rédigé. Ajoutez simplement le format souhaité, par exemple : <code>explique en 5 étapes</code>, <code>corrige ce code</code> ou <code>résume en 3 puces</code>.`
  };
}

async function askPythonAgent(text) {
  if (window.location.protocol === 'file:') return null;

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text })
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (!data || !data.html) return null;

  return {
    tool: data.tool || 'python_agent',
    input: data.input || { message: text },
    output: data.output || 'Réponse générée par Python.',
    trace: data.trace || 'Appel du backend Python...',
    html: data.html
  };
}

async function sendMessage(forcedText = null, options = {}) {
  if (isThinking) return;

  const input = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const importBtn = document.getElementById('importBtn');
  const text = (forcedText ?? input.value).trim();
  if (!text) return;

  if (forcedText === null) {
    input.value = '';
    input.style.height = 'auto';
  }
  sendBtn.disabled = true;
  if (importBtn) importBtn.disabled = true;
  isThinking = true;

  addMessage('user', options.displayText || text);
  showTyping();

  try {
    let result = null;

    try {
      result = await askPythonAgent(text);
    } catch {
      result = null;
    }

    if (!result) {
      result = buildResponse(text);
      result.output += ' Backend Python indisponible, fallback JavaScript utilisé.';
    }

    showThinkingTrace(result.trace);
    await sleep(650);
    hideThinkingTrace();
    addToolCard(result.tool, result.input, result.output, 250 + Math.floor(Math.random() * 400));
    hideTyping();
    addMessage('agent', result.html, true, () => {
      sendBtn.disabled = false;
      if (importBtn) importBtn.disabled = false;
      isThinking = false;
    }, true);
  } catch (error) {
    hideThinkingTrace();
    hideTyping();
    addToolCard('reason', { error: String(error) }, 'Erreur interceptée et affichée proprement.', 120);
    addMessage('agent', "Une erreur est survenue, mais l’interface reste utilisable. Réessayez avec une demande plus courte.", false, () => {
      sendBtn.disabled = false;
      if (importBtn) importBtn.disabled = false;
      isThinking = false;
    });
  }
}
