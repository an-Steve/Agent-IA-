let isThinking = false;

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
    toolOutput = "Routage cartographique : https://www.google.com/maps";
    finalResponse = "Pour explorer le monde et analyser la géographie mondiale :<br><br>👉 <a href='https://www.google.com/maps' target='_blank'>Cliquez ici pour ouvrir Google Maps</a>";
    showThinkingTrace("Génération du module de cartographie satellite...");
    await sleep(800);
    hideThinkingTrace();
    addToolCard(chosenTool, toolInput, toolOutput, 290);
    hideTyping();
    addMessage('agent', finalResponse, true, () => {
      document.getElementById('sendBtn').disabled = false;
      isThinking = false;
    });
    return;
  }

  // ── MATHÉMATIQUES ──
  const mathRegex = /([0-9]+[\s]*[\+\-\*\/][\s]*[0-9]+)/;
  if (mathRegex.test(text) || lower.includes("calcul") || lower.includes("combien font")) {
    showThinkingTrace("Extraction de l'expression mathématique...");
    await sleep(400);
    showThinkingTrace("Exécution du calcul via l'unité arithmétique...");
    await sleep(500);
    const mathExpression = text.replace(/[A-Za-zÀ-ÿ:\?]/g, "").trim();
    try {
      if (/^[0-9\+\-\*\/\(\)\.\s]+$/.test(mathExpression)) {
        const result = Function(`"use strict"; return (${mathExpression})`)();
        chosenTool = "reason";
        toolInput = { expression: mathExpression, operation: "arithmetic_eval" };
        toolOutput = `Calculation successful. Result: ${result}`;
        finalResponse = `🔢 **Calculateur interne activé :**<br><br>L'expression analysée est : \`${mathExpression}\`<br>Le résultat exact est : **${result}**`;
      } else throw new Error("Caractères non autorisés");
    } catch (e) {
      chosenTool = "reason";
      toolInput = { raw_input: text, status: "error" };
      toolOutput = "Math engine failed to parse expression securely.";
      finalResponse = `❌ **Erreur de calcul :** Je n'ai pas réussi à analyser votre expression. Utilisez des chiffres et opérateurs standards (+, -, *, /).`;
    }
  }

  // ── ASTRONOMIE ──
  else if (lower.includes("planete") || lower.includes("systeme solaire") || lower.includes("soleil") || lower.includes("mars") || lower.includes("jupiter")) {
    showThinkingTrace("Accès à la base astrophysique...");
    await sleep(600);
    showThinkingTrace("Calcul des distances astronomiques (UA)...");
    await sleep(400);
    chosenTool = "reason";
    toolInput = { domain: "astronomy", system: "solar_system" };
    toolOutput = "Loaded physics data for 8 major planets + Star: Sol.";
    finalResponse = `🌌 **Module Astronomie & Cosmos :**<br><br>Notre **Système solaire** est composé du Soleil et de 8 planètes :<br><br>• **Planètes telluriques :** Mercure, Vénus, la Terre, Mars.<br>• **Géantes gazeuses/glace :** Jupiter (la plus massive), Saturne (et ses anneaux), Uranus, Neptune.<br><br>*Jupiter est si grande qu'elle pourrait contenir toutes les autres planètes réunies.*`;
  }

  // ── HISTOIRE ──
  else if (lower.includes("date") || lower.includes("siecle") || lower.includes("antiquite") || lower.includes("guerre mondiale") || lower.includes("moyen age") || lower.includes("histoire") || lower.includes("napoleon") || lower.includes("revolution")) {
    showThinkingTrace("Interrogation de la frise chronologique universelle...");
    await sleep(700);
    chosenTool = "summarize";
    toolInput = { domain: "history", data_filter: "major_global_events" };
    toolOutput = "Extracted timeline from antiquity to contemporary era.";
    finalResponse = `⏳ **Module Chronologies & Grandes Dates :**<br><br>• **476 :** Chute de l'Empire romain d'Occident.<br>• **1492 :** Arrivée de Colomb en Amérique.<br>• **1789 :** Révolution française, Déclaration des Droits de l'Homme.<br>• **1914–1918 :** Première Guerre mondiale.<br>• **1939–1945 :** Seconde Guerre mondiale.<br>• **1969 :** Apollo 11, premier homme sur la Lune.`;
  }

  // ── BIOLOGIE / SVT ──
  else if (lower.includes("svt") || lower.includes("mitose") || lower.includes("adn") || lower.includes("cellule") || lower.includes("biologie")) {
    showThinkingTrace("Mapping génétique et cellulaire en cours...");
    await sleep(600);
    chosenTool = "reason";
    toolInput = { domain: "biology", topic: "cellular_division" };
    toolOutput = "DNA replication structure mapped successfully.";
    finalResponse = `🌱 **Module Biologie & SVT :**<br><br>La **mitose** produit deux cellules filles identiques à partir d'une cellule mère.<br><br>• **4 étapes :** Prophase (condensation ADN), Métaphase (alignement), Anaphase (séparation), Télophase (reconstitution des noyaux).`;
  }

  // ── PHYSIQUE / CHIMIE ──
  else if (lower.includes("physique") || lower.includes("chimie") || lower.includes("atome") || lower.includes("molecule")) {
    showThinkingTrace("Équilibrage de l'équation chimique...");
    await sleep(600);
    chosenTool = "reason";
    toolInput = { domain: "chemistry", target: "periodic_table_elements" };
    toolOutput = "Balanced equation verified.";
    finalResponse = `🧪 **Module Physique-Chimie :**<br><br>Un **atome** = noyau (protons + neutrons) + nuage d'électrons.<br><br>Exemple de réaction équilibrée — combustion du méthane :<br><pre><code>CH4 + 2 O2 → CO2 + 2 H2O</code></pre>Rien ne se perd, tout se transforme !`;
  }

  // ── TRANSFORMERS / IA ──
  else if (lower.includes("transformer") || lower.includes("attention") || lower.includes("llm") || lower.includes("open-source") || lower.includes("avancees")) {
    showThinkingTrace("Scraping des derniers papiers ArXiv...");
    await sleep(800);
    chosenTool = "web_search";
    toolInput = { queries: ["LLM open source advancements 2026"] };
    toolOutput = "[Results found: Llama 4 breakthrough, DeepSeek v4 optimization]";
    finalResponse = `🧠 **Module LLM & Transformers :**<br><br>Le **mécanisme d'attention** traite tous les mots d'une phrase simultanément via 3 vecteurs : *Query*, *Key*, *Value*.<br><br>Tendances 2026 :<br>• Fenêtres de contexte à 2M de tokens<br>• Multimodalité native (texte + image + code)<br>• Quantification MoE pour matériel grand public`;
  }

  // ── CODE ──
  else if (lower.includes("genere") || lower.includes("fonction javascript") || lower.includes("trier") || lower.includes("code")) {
    showThinkingTrace("Génération de l'arbre syntaxique abstrait (AST)...");
    await sleep(600);
    chosenTool = "write_code";
    toolInput = { language: "javascript", task: "sort_array_by_date" };
    toolOutput = "Function created. Linter check passed.";
    finalResponse = `⚡ **Code JavaScript généré :**<br><br><pre><code>function trierParDate(tableau) {
  return [...tableau].sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Exemple :
const data = [{ id: 1, date: "2026-06-15" }, { id: 2, date: "2026-02-10" }];
console.log(trierParDate(data));</code></pre>`;
  }

  // ── BUG FIX ──
  else if (lower.includes("bug") || lower.includes("map") || lower.includes("plante")) {
    showThinkingTrace("Analyse de la pile d'exécution (Stack Trace)...");
    await sleep(600);
    chosenTool = "write_code";
    toolInput = { error: "TypeError: Cannot read properties of undefined (reading 'map')" };
    toolOutput = "Root cause: Variable is null/undefined before async resolution.";
    finalResponse = `🐛 **Bug identifié :**<br><br><code>.map()</code> plante si la variable est <code>null</code> ou <code>undefined</code>.<br><br>**Solutions :**<br><pre><code>// Option 1 : Optional chaining
utilisateurs?.map(user => ...)

// Option 2 : Tableau vide par défaut
(utilisateurs || []).map(user => ...)</code></pre>`;
  }

  // ── FINANCE ──
  else if (lower.includes("finance") || lower.includes("eur") || lower.includes("usd") || lower.includes("economique")) {
    showThinkingTrace("Connexion aux flux Forex en temps réel...");
    await sleep(800);
    chosenTool = "call_api";
    toolInput = { currency_pair: "EUR/USD", feed: "live_forex" };
    toolOutput = JSON.stringify({ rate: "1.0924", trend: "+0.15%", market: "OPEN" }, null, 2);
    finalResponse = `💱 **Données de change :**<br><br>• **EUR/USD :** 1.0924 (+0.15% sur 24h)<br>• Marché ouvert. Les investisseurs attendent les déclarations des banques centrales en fin de semaine.`;
  }

  // ── E-MAIL ──
  else if (lower.includes("e-mail") || lower.includes("email") || lower.includes("redige") || lower.includes("retard") || lower.includes("livraison")) {
    showThinkingTrace("Génération du template e-mail professionnel...");
    await sleep(600);
    chosenTool = "summarize";
    toolInput = { template: "formal_business_email", tone: "professional" };
    toolOutput = "Email structure generated successfully.";
    finalResponse = `📧 **E-mail professionnel prêt :**<br><br><strong>Objet :</strong> Information concernant votre commande [Numéro]<br><br>Madame, Monsieur,<br><br>Nous vous informons qu'en raison d'un contretemps logistique, la livraison de votre commande sera retardée. Elle est désormais planifiée pour le <strong>[Date]</strong>.<br><br>Nous nous excusons pour la gêne occasionnée et restons à votre disposition.<br><br>Cordialement,<br>L'équipe Relation Client.`;
  }

  // ── PLAN DE RAPPORT ──
  else if (lower.includes("plan") || lower.includes("rapport") || lower.includes("etude")) {
    showThinkingTrace("Structuration du document académique...");
    await sleep(600);
    chosenTool = "reason";
    toolInput = { blueprint: "academic_report_structure" };
    toolOutput = "Standard academic structure created.";
    finalResponse = `📋 **Structure recommandée pour un rapport de fin d'études :**<br><br>• **Introduction :** Contexte, problématique et objectifs.<br>• **Partie 1 :** État de l'art & choix technologiques.<br>• **Partie 2 :** Réalisation technique & architecture.<br>• **Partie 3 :** Tests, résultats et métriques.<br>• **Conclusion :** Synthèse et perspectives futures.`;
  }

  // ── SALUTATIONS ──
  else if (lower.includes("bonjour") || lower.includes("salut") || lower.includes("hello")) {
    showThinkingTrace("Analyse de l'intention utilisateur...");
    await sleep(500);
    chosenTool = "reason";
    toolInput = { intent: "greeting" };
    toolOutput = "Intent matched: GREETING.";
    finalResponse = getRandomResponse(AI_BRAIN.greetings_casual);
  }

  // ── STATUS ──
  else if (lower.includes("ca va") || lower.includes("comment tu vas") || lower.includes("status")) {
    showThinkingTrace("Check-up des systèmes internes...");
    await sleep(500);
    chosenTool = "reason";
    toolInput = { state_check: "self_health" };
    toolOutput = "Core systems: OK.";
    finalResponse = getRandomResponse(AI_BRAIN.health_check);
  }

  // ── MERCI ──
  else if (lower === "merci" || lower === "thanks") {
    showThinkingTrace("Clôture de la tâche...");
    await sleep(400);
    chosenTool = "reason";
    toolInput = { session: "acknowledgement" };
    toolOutput = "User interaction positive.";
    finalResponse = `Avec plaisir ! Je reste en veille, n'hésitez pas si vous avez d'autres requêtes. ⚡`;
  }

  // ── CAS PAR DÉFAUT ──
  else {
    showThinkingTrace("Étape 1: Extraction des entités nommées...");
    await sleep(500);
    showThinkingTrace("Étape 2: Calcul des poids sémantiques (Embedding)...");
    await sleep(500);
    showThinkingTrace("Étape 3: Formulation de la réponse contextuelle...");
    await sleep(400);
    chosenTool = "reason";
    toolInput = { context_routing: "fallback", user_prompt: text };
    toolOutput = "Routing completed via internal weights.";
    finalResponse = `🤖 **Requête analysée :** "${text}"<br><br>Mes modules de raisonnement logique ont traité votre demande. Pour connecter cet agent à de vraies données en temps réel, reliez cette interface à une clé API (Claude, OpenAI, etc.) via un serveur Node.js ou Python.`;
  }

  hideThinkingTrace();
  addToolCard(chosenTool, toolInput, toolOutput, Math.round(150 + Math.random() * 300));
  hideTyping();

  addMessage('agent', finalResponse, true, () => {
    isThinking = false;
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('userInput').focus();
  });
}
