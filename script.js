let isThinking = false;

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