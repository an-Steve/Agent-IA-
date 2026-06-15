let isThinking = false;

// Base de données de réponses variées pour casser le côté "robot fixe"
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
  
  // Ajoute ou supprime la classe .light-mode sur le body
  body.classList.toggle('light-mode');
  
  // Change le texte du bouton en fonction du mode actif
  if (body.classList.contains('light-mode')) {
    btn.innerHTML = '🌙 Mode Sombre';
  } else {
    btn.innerHTML = '☀️ Mode Clair';
  }
}

// Helpers UI
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

// Sélectionne une réponse au hasard dans un tableau
function getRandomResponse(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Effet d'écriture "Stream" (Lettre par lettre) comme une vraie IA
function typeWriteMessage(element, text, callback) {
  let i = 0;
  const cleanText = text.replace(/<br>/g, '\n');
  element.innerHTML = "";
  
  function type() {
    if (i < cleanText.length) {
      const char = cleanText.charAt(i);
      if (char === '\n') {
        element.innerHTML += '<br>';
      } else {
        element.innerHTML += char;
      }
      i++;
      setTimeout(type, Math.random() * 5 + 5); 
      
      const msgs = document.getElementById('messages');
      msgs.scrollTop = msgs.scrollHeight;
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

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── LOGIQUE INTÉGRÉE DE L'AGENT IA AVANCÉ ──
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

  // ── DÉTECTION ET MOTEUR DE CALCUL ──
  const mathRegex = /([0-9]+[\s]*[\+\-\*\/][\s]*[0-9]+)/;
  const containsMath = mathRegex.test(text);

  if (containsMath || lower.includes("calcul") || lower.includes("combien font")) {
    showThinkingTrace("Extraction de l'expression mathématique...");
    await sleep(400);
    const mathExpression = text.replace(/[A-Za-zÀ-ÿ:\?]/g, "").trim();

    try {
      showThinkingTrace("Exécution du calcul via l'unité arithmétique...");
      await sleep(500);
      if (/^[0-9\+\-\*\/\(\)\.\s]+$/.test(mathExpression)) {
        const result = Function(`"use strict"; return (${mathExpression})`)();
        chosenTool = "reason";
        toolInput = { expression: mathExpression, operation: "arithmetic_eval" };
        toolOutput = `Calculation successful. Result: ${result}`;
        finalResponse = `🔢 **Calculateur interne activé :**<br><br>L'expression analysée est : \`${mathExpression}\`<br>Le résultat exact est : **${result}**`;
      } else {
        throw new Error("Caractères non autorisés");
      }
    } catch (error) {
      chosenTool = "reason";
      toolInput = { raw_input: text, status: "error" };
      toolOutput = "Math engine failed to parse expression securely.";
      finalResponse = `❌ **Erreur de calcul :** Je n'ai pas réussi à analyser votre expression mathématique. Assurez-vous d'utiliser des chiffres et des opérateurs standards (+, -, *, /).`;
    }
  }

  // ── NOUVEAU MODULE : ASTRONOMIE & SYSTEME SOLAIRE ──
  else if (lower.includes("planete") || lower.includes("systeme solaire") || lower.includes("soleil") || lower.includes("mars") || lower.includes("jupiter")) {
    showThinkingTrace("Accès à la base cartographique astrophysique...");
    await sleep(600);
    showThinkingTrace("Calcul des distances astronomiques (UA) et classification...");
    await sleep(400);

    chosenTool = "reason";
    toolInput = { domain: "astronomy", system: "solar_system", query_type: "planetary_data" };
    toolOutput = "Loaded physics data for 8 major planets + Star: Sol.";
    finalResponse = `🌌 **Module Astronomie & Cosmos ouvert :**<br><br>Notre **Système solaire** est composé d'une étoile centrale, le Soleil, et de 8 planètes réparties en deux catégories :<br><br>• **Les planètes telluriques (rocheuses) :** Mercure (la plus proche), Vénus (la plus chaude), la Terre (notre oasis bleue) et Mars (la planète rouge).<br>• **Les géantes gazeuses et de glace :** Jupiter (la plus massive, reine du système), Saturne (et ses magnifiques anneaux), Uranus et Neptune (la plus éloignée, glaciale et venteuse).<br><br>*Fait remarquable : Jupiter est tellement grande qu'elle pourrait contenir toutes les autres planètes du système solaire réunies.*`;
  }

  // ── NOUVEAU MODULE : ENCYCLOPÉDIE HISTORIQUE (DATES CLÉS) ──
  else if (lower.includes("date") || lower.includes("siecle") || lower.includes("antiquite") || lower.includes("guerre mondiale") || lower.includes("moyen age")) {
    showThinkingTrace("Interrogation de la frise chronologique universelle...");
    await sleep(700);

    chosenTool = "summarize";
    toolInput = { domain: "history", data_filter: "major_global_events" };
    toolOutput = "Extracted timeline from antiquity to contemporary era.";
    finalResponse = `⏳ **Module Chronologies & Grandes Dates de l'Histoire :**<br><br>Voici des repères historiques fondamentaux stockés dans ma mémoire de stockage :<br><br>• **476 :** Chute de l'Empire romain d'Occident (Fin de l'Antiquité, début du Moyen-Âge).<br>• **1492 :** Arrivée de Christophe Colomb en Amérique (Fin du Moyen-Âge, début de l'Époque moderne).<br>• **1789 :** Révolution française et Déclaration des Droits de l'Homme.<br>• **1914 – 1918 :** Première Guerre mondiale.<br>• **1939 – 1945 :** Seconde Guerre mondiale.<br>• **1969 :** Mission Apollo 11, Neil Armstrong est le premier homme à marcher sur la Lune.`;
  }

  // ── NOUVEAU MODULE : GEOGRAPHIE MONDIALE & CAPITALES ──
  else if (lower.includes("capitale") || lower.includes("population") || lower.includes("continent") || lower.includes("fleuve") || lower.includes("montagne")) {
    showThinkingTrace("Interrogation de la base de données géopolitique...");
    await sleep(500);

    chosenTool = "web_search";
    toolInput = { domain: "geography", query: "global_demographics_and_capitals" };
    toolOutput = "Retrieved topological and political maps database.";
    finalResponse = `🗺️ **Module Géographie Mondiale activé :**<br><br>Je dispose de données géopolitiques mondiales complètes. Voici quelques exemples clés :<br><br>• **Capitales d'Europe :** France (Paris), Italie (Rome), Allemagne (Berlin), Royaume-Uni (Londres).<br>• **Capitales du Monde :** Japon (Tokyo), États-Unis (Washington D.C.), Canada (Ottawa), Brésil (Brasília).<br>• **Records terrestres :** Le fleuve le plus long est l'Amazone, le sommet le plus haut est l'Everest (8848m) et la structure géologique la plus profonde est la fosse des Mariannes (~11 000m).`;
  }

  // ── BRANCHES ACADÉMIQUES EXISTANTES : SVT, HISTOIRE PAR MOTS CLÉS, PHYSIQUE ──
  else if (lower.includes("svt") || lower.includes("mitose") || lower.includes("adn") || lower.includes("cellule")) {
    showThinkingTrace("Mapping génétique et cellulaire en cours...");
    await sleep(600);
    chosenTool = "reason";
    toolInput = { domain: "biology", topic: "cellular_division" };
    toolOutput = "DNA replication structure mapped successfully.";
    finalResponse = `🌱 **Module Biologie & SVT activé :**<br><br>La **mitose** est le processus de division cellulaire qui permet d'obtenir deux cellules filles identiques à partir d'une cellule mère.<br><br>• **4 étapes clés :** Prophase (condensation de l'ADN), Métaphase (alignement sur la plaque équatoriale), Anaphase (séparation des chromatides) et Télophase (reconstitution des noyaux).`;
  }
  else if (lower.includes("histoire") || lower.includes("guerre") || lower.includes("napoleon") || lower.includes("revolution")) {
    showThinkingTrace("Accès aux archives historiques de l'agent...");
    await sleep(600);
    chosenTool = "summarize";
    toolInput = { domain: "history", target_era: "modern_era_europe" };
    toolOutput = "Chronological timeline validated against core knowledge database.";
    finalResponse = `⏳ **Module Historique activé :**<br><br>En France, la **Révolution française (1789)** marque la fin de la monarchie absolue de droit divin et de la société d'ordres.<br><br>• **Dates clés :** 14 juillet 1789 (Prise de la Bastille), 26 août 1789 (Déclaration des droits de l'homme et du citoyen) et septembre 1792 (Proclamation de la Première République).`;
  }
  else if (lower.includes("geographie") || lower.includes("geo ") || lower.includes("plaques") || lower.includes("tectonique") || lower.includes("climat")) {
    showThinkingTrace("Chargement du module cartographique et géologique GIS...");
    await sleep(600);
    chosenTool = "web_search";
    toolInput = { query: "tectonic plates geographic boundary adjustments" };
    toolOutput = "[Data extracted: 12 main lithospheric plates dynamic models loaded]";
    finalResponse = `🌍 **Module Géographie & Sciences de la Terre :**<br><br>La **tectonique des plaques** explique que la lithosphère terrestre est découpée en plaques rigides bougeant sur l'asthénosphère.<br><br>• **Trois types de frontières :** Les zones de divergence (les plaques s'écartent), les zones de convergence (collision ou subduction) et les failles transformantes (coulissage).`;
  }
  else if (lower.includes("physique") || lower.includes("chimie") || lower.includes("atome") || lower.includes("molecule") || lower.includes("reaction")) {
    showThinkingTrace("Équilibrage de l'équation chimique stoechiométrique...");
    await sleep(600);
    chosenTool = "reason";
    toolInput = { domain: "chemistry", target: "periodic_table_elements" };
    toolOutput = "Balanced equation found: Mole proportions verified.";
    finalResponse = `🧪 **Module Physique-Chimie activé :**<br><br>Un **atome** est constitué d'un noyau central (protons chargés positivement et neutrons neutres) entouré d'un nuage d'électrons chargés négativement.<br><br>• **Exemple de réaction chimique :** La combustion du méthane s'écrit de manière équilibrée :<br>\`CH4 + 2 O2 → CO2 + 2 H2O\`. Rien ne se perd, tout se transforme !`;
  }

  // ── BRANCHES STANDARD DE DIALOGUE ET OUTILS EXISTANTS ──
  else if (lower === 'salut' || lower === 'hello') {
    showThinkingTrace("Analyse de l'intention utilisateur...");
    await sleep(500);
    chosenTool = "reason";
    toolInput = { intent: "greeting", style: "casual" };
    toolOutput = "Intent matched: CASUAL_GREETING. Randomizing response.";
    finalResponse = getRandomResponse(AI_BRAIN.greetings_casual);
  } 
  else if (lower === 'bonjour') {
    showThinkingTrace("Initialisation du protocole de salutation...");
    await sleep(500);
    chosenTool = "reason";
    toolInput = { intent: "greeting", style: "formal" };
    toolOutput = "Intent matched: FORMAL_GREETING. Status: Ready.";
    finalResponse = getRandomResponse(AI_BRAIN.greetings_formal);
  }
  else if (lower.includes('ca va') || lower.includes('comment tu vas')) {
    showThinkingTrace("Check-up des systèmes internes...");
    await sleep(500);
    chosenTool = "reason";
    toolInput = { state_check: "self_health" };
    toolOutput = "Core systems: OK. Temperature: stable.";
    finalResponse = getRandomResponse(AI_BRAIN.health_check);
  }
  else if (lower === 'merci' || lower === 'thanks') {
    showThinkingTrace("Clôture de la tâche...");
    await sleep(400);
    chosenTool = "reason";
    toolInput = { session: "acknowledgement" };
    toolOutput = "User interaction positive.";
    finalResponse = `Avec plaisir ! Je reste en veille, n'hésitez pas si vous avez d'autres requêtes. ⚡`;
  }
  else if (lower.includes("meteo") || lower.includes("paris") || lower.includes("york")) {
    showThinkingTrace("Appel des serveurs météo distants...");
    await sleep(800);
    chosenTool = "call_api";
    toolInput = { services: ["weather_paris", "weather_newyork"] };
    toolOutput = JSON.stringify({ paris: "18°C, Éclaircies", new_york: "22°C, Nuageux" }, null, 2);
    finalResponse = `🌤️ **Météo en temps réel récupérée :**<br><br>• **Paris :** 18°C, belles éclaircies, vent à 12 km/h.<br>• **New York :** 22°C, passages nuageux, humidité 55%.`;
  } 
  else if (lower.includes("avancees") || lower.includes("llm") || lower.includes("open-source")) {
    showThinkingTrace("Scraping des derniers papiers ArXiv et dépôts GitHub...");
    await sleep(800);
    chosenTool = "web_search";
    toolInput = { queries: ["LLM open source advancements 2026"] };
    toolOutput = "[Search results found: Llama 4 breakthrough, DeepSeek v4 optimization]";
    finalResponse = `🌍 **Résultats de la veille technologique sur les LLM Open-Source :**<br><br>1. **Contextes Étendus :** Les nouvelles architectures adoptent nativement des fenêtres à 2M de tokens.<br>2. **Multimodalité Native :** L'intégration des images et du code égale désormais le propriétaire.`;
  }
  else if (lower.includes("genere") || lower.includes("fonction javascript") || lower.includes("trier")) {
    showThinkingTrace("Génération de l'arbre syntaxique abstrait (AST)...");
    await sleep(600);
    chosenTool = "write_code";
    toolInput = { language: "javascript", task: "sort_array_by_date" };
    toolOutput = "Function created. Linter check passed.";
    finalResponse = `⚡ **Voici le code JavaScript optimisé demandé :**<br><br><pre><code>function trierParDate(tableau) {\n  return [...tableau].sort((a, b) => new Date(a.date) - new Date(b.date));\n}</code></pre>`;
  }
  else if (lower.includes("bug") || lower.includes("map") || lower.includes("plante")) {
    showThinkingTrace("Analyse de la pile d'exécution (Stack Trace)...");
    await sleep(600);
    chosenTool = "write_code";
    toolInput = { error: "TypeError: Cannot read properties of undefined (reading 'map')" };
    toolOutput = "Root cause found: Variable is null/undefined before async resolution.";
    finalResponse = `🐛 **Analyse du bug effectuée :**<br><br>La méthode <code>.map()</code> plante si la variable est vide.<br><br>**La solution sécurisée (Optional Chaining) :**<br><br><pre><code>utilisateurs?.map(user => ...)</code></pre>`;
  }
  
  // ── CAS PAR DÉFAUT
  else {
    showThinkingTrace("Étape 1: Extraction des entités nommées...");
    await sleep(500);
    showThinkingTrace("Étape 2: Calcul des poids sémantiques (Embedding)...");
    await sleep(500);
    showThinkingTrace("Étape 3: Formulation de la réponse contextuelle...");
    await sleep(400);

    chosenTool = "reason";
    toolInput = { context_routing: "fallback_agent_thought", user_prompt: text };
    toolOutput = "Routing completed. Prompt answered via internal weights.";
    finalResponse = `🤖 **Requête analysée par mes réseaux neuronaux :** "${text}"<br><br>N'étant pas relié à une base de données en direct pour cette requête spécifique, j'ai activé mon module de raisonnement logique. Pour libérer mon plein potentiel sur ce type de question, connectez mon interface à votre serveur d'API (Node.js/Python).`;
  }

  // Fin du traitement -> Affichage
  hideThinkingTrace();
  addToolCard(chosenTool, toolInput, toolOutput, Math.round(150 + Math.random() * 300));
  hideTyping();
  
  addMessage('agent', finalResponse, true, () => {
    isThinking = false;
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('userInput').focus();
  });
}let isThinking = false;

// Helpers UI
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

function addMessage(role, content) {
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.remove();

  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  const avatar = role === 'agent' ? '⬡' : 'U';

  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-body">
      <div class="msg-bubble">${content}</div>
      <div class="msg-time">${formatTime()}</div>
    </div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
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

function showThinkingTrace() {
  const body = document.getElementById('traceBody');
  const empty = document.getElementById('traceEmpty');
  if (empty) empty.remove();
  const div = document.createElement('div');
  div.className = 'thinking-trace';
  div.id = 'thinking-trace';
  div.innerHTML = `<div class="t-dot"></div><span>Agent en cours de traitement...</span>`;
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

// ── LOGIQUE INTÉGRÉE DE L'AGENT IA AVANCÉ ──
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
  showThinkingTrace();

  // Moteur d'analyse local
  setTimeout(async () => {
    let chosenTool = "reason";
    let toolInput = { problem: text };
    let toolOutput = "Analyse conceptuelle validée.";
    let finalResponse = "";

    const lower = text.toLowerCase();

    // 1. Branche Météo Multi-villes
    if (lower.includes("météo") || lower.includes("paris") || lower.includes("york")) {
      chosenTool = "call_api";
      toolInput = { services: ["weather_paris", "weather_newyork"] };
      toolOutput = JSON.stringify({ paris: "18°C, Éclaircies", new_york: "22°C, Nuageux", status: "200_OK" }, null, 2);
      finalResponse = `🌤️ **Météo en temps réel récupérée :**<br><br>• **Paris :** 18°C, belles éclaircies, vent à 12 km/h.<br>• **New York :** 22°C, passages nuageux, humidité 55%.<br><br>L'agent a parallélisé l'appel API pour obtenir les deux métriques instantanément.`;
    } 
    // 2. Branche Veille IA Open source
    else if (lower.includes("avancées") || lower.includes("llm") || lower.includes("open-source")) {
      chosenTool = "web_search";
      toolInput = { queries: ["LLM open source advancements 2026", "Llama architecture update"] };
      toolOutput = "[Search results found: 1. Llama 4 multi-modal context breakthrough, 2. DeepSeek v4 optimization protocols]";
      finalResponse = `🌍 **Résultats de la veille technologique sur les LLM Open-Source :**<br><br>1. **Contextes Étendus :** Les nouveaux architectures adoptent nativement des fenêtres de contextes à 2 millions de tokens sans perte d'attention.<br>2. **Multimodalité Native :** L'intégration du traitement d'images et de code en temps réel sur les modèles ouverts égale désormais les solutions propriétaires.<br>3. **Efficacité énergétique :** Les optimisations par quantification (MoE) permettent de faire tourner des modèles massifs sur du matériel grand public.`;
    }
    // 3. Branche Code (Générateur)
    else if (lower.includes("génère") || lower.includes("fonction javascript") || lower.includes("trier")) {
      chosenTool = "write_code";
      toolInput = { language: "javascript", task: "sort_array_by_date" };
      toolOutput = "Function created and unit tests verified locally (Pass).";
      finalResponse = `⚡ **Voici le code JavaScript optimisé demandé :**<br><br>
<pre><code>function trierParDate(tableau) {
  return [...tableau].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
}

// Exemple d'utilisation :
const donnees = [
  { id: 1, date: "2026-06-15" },
  { id: 2, date: "2026-02-10" }
];
console.log(trierParDate(donnees));</code></pre><br>
*Note de l'agent : J'ai utilisé le spread operator <code>[...tableau]</code> pour éviter de muter (modifier) votre tableau d'origine, respectant les principes de la programmation pure.*`;
    }
    // 4. Branche Correction de Bug
    else if (lower.includes("bug") || lower.includes("map") || lower.includes("plante")) {
      chosenTool = "write_code";
      toolInput = { code_analysis: "map_on_undefined_or_null" };
      toolOutput = "Bug identified: Array mutation safety failure. Solution: Optional chaining embedded.";
      finalResponse = `🐛 **Analyse du bug effectuée avec succès :**<br><br>La méthode <code>.map()</code> plante en JavaScript si la variable est <code>undefined</code> ou <code>null</code> (par exemple avant le chargement des données API).<br><br>**La solution sécurisée :** Utilisez le chaînage optionnel (Optional Chaining) ou une valeur de repli :<br><br><pre><code>// Option 1 : Chaînage optionnel (renvoie undefined proprement si vide)
utilisateurs?.map(user => ...)

// Option 2 : Sécurité avec tableau vide par défaut
(utilisateurs || []).map(user => ...)</code></pre>`;
    }
    // 5. Branche Finance / EUR USD
    else if (lower.includes("finance") || lower.includes("eur/usd") || lower.includes("économiques")) {
      chosenTool = "call_api";
      toolInput = { currency_pair: "EUR/USD", feed: "live_forex" };
      toolOutput = JSON.stringify({ rate: "1.0924", trend: "+0.15%", market: "OPEN" }, null, 2);
      finalResponse = `💱 **Données de change & Marchés financiers :**<br><br>• **Paire EUR/USD :** Le cours est à **1.0924** (Hausse de +0.15% sur les dernières 24h).<br>• **Actu Éco :** Les volumes d'échange sont stables. Les investisseurs attendent les déclarations des banques centrales concernant les taux directeurs en fin de semaine.`;
    }
    // 6. Branche E-mail Retard
    else if (lower.includes("e-mail") || lower.includes("retard") || lower.includes("livraison")) {
      chosenTool = "summarize";
      toolInput = { template: "formal_business_email", tone: "professional" };
      toolOutput = "Email structure generated successfully.";
      finalResponse = `📧 **Proposition d'e-mail professionnel prêt à l'envoi :**<br><br>
**Objet :** Information concernant la livraison de votre commande [Numéro]<br><br>
Madame, Monsieur,<br><br>
Nous tenons à vous informer qu'en raison d'un contretemps logistique indépendant de notre volonté, la livraison de votre commande subira un léger retard.<br><br>
Celle-ci est désormais planifiée pour le **[Date]**. Nous mettons tout en œuvre pour écourter ce délai et vous présentons nos excuses pour la gêne occasionnée.<br><br>
Restant à votre entière disposition,<br>
L'équipe Relation Client.`;
    }
    // 7. Branche Transformers / Concept
    else if (lower.includes("transformer") || lower.includes("deep learning") || lower.includes("attention")) {
      chosenTool = "reason";
      toolInput = { domain: "deep_learning", core: "self_attention_mechanism" };
      toolOutput = "Architecture breakdown mapped into 3 sequential steps.";
      finalResponse = `🧠 **Concepts clés de l'architecture Transformer :**<br><br>Le Transformer repose principalement sur le mécanisme de **Self-Attention (Auto-attention)**. Contrairement aux anciens réseaux (RNN), il traite tous les mots d'une phrase en même temps :<br><br>• **Calcul des scores :** Pour chaque mot, le modèle calcule une relation d'importance avec tous les autres mots de la phrase via 3 vecteurs : *Query* (Requête), *Key* (Clé) et *Value* (Valeur).<br>• **Parallélisation totale :** N'ayant pas besoin de traiter le texte séquentiellement mot par mot, l'entraînement sur carte graphique est ultra-rapide.<br>• **Contextualisation :** C'est ce qui permet au mot "avocat" de changer de sens selon s'il est à côté du mot "tribunal" ou "salade".`;
    }
    // 8. Branche Plan de rapport
    else if (lower.includes("plan") || lower.includes("rapport") || lower.includes("études")) {
      chosenTool = "reason";
      toolInput = { blueprint: "academic_report_structure" };
      toolOutput = "Standard academic structure created.";
      finalResponse = `📋 **Structure recommandée pour votre rapport de fin d'études :**<br><br>• **Introduction Générale :** Contexte du projet, problématique métier et objectifs assignés.<br>• **Partie 1 : État de l'art &amp; Analyse :** Étude de l'existant, choix des technologies retenues et cahier des charges.<br>• **Partie 2 : Réalisation technique :** Architecture globale de la solution, étapes clés du développement et difficultés résolues.<br>• **Partie 3 : Tests &amp; Résultats :** Bilans des tests, métriques obtenues et axes d'amélioration.<br>• **Conclusion :** Synthèse du projet et perspectives d'ouverture futures.`;
    }
    // 9. Réponse par défaut (IA Générique contextuelle)
    else {
      chosenTool = "reason";
      toolInput = { free_text: text };
      toolOutput = "General text routing completed.";
      finalResponse = `🤖 **Requête traitée par l'agent :** "${text}"<br><br>Votre site web réagit de manière dynamique ! Pour rendre cet agent totalement autonome face à de réels imprévus complexes, il vous suffira de relier cette interface web à une clé API valide dans un environnement serveur (Node.js/Python).`;
    }

    // Gestion de la trace et affichage
    hideThinkingTrace();
    addToolCard(chosenTool, toolInput, toolOutput, Math.round(300 + Math.random() * 400));
    
    hideTyping();
    addMessage('agent', finalResponse);

    isThinking = false;
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('userInput').focus();
  }, 1200);
}
