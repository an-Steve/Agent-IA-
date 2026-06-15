# ⬡ Agent IA CapG 

**CapG** est une interface d'agent IA avancée et connectée en temps réel. Grâce à une architecture asynchrone, cet agent est capable de planifier des tâches, de simuler des arbres de pensée complexes et d'interroger de véritables API mondiales ouvertes (sans clé d'authentification payante) pour fournir des données météorologiques et financières instantanées.

>  **Conçu et développé par :** ANTON NELCON Steve
<img width="1422" height="906" alt="image" src="https://github.com/user-attachments/assets/5d863c2d-1187-432e-85d8-bfc08baa275e" />

**Lien du site :** https://an-steve.github.io/Agent-IA-/


---

##  Fonctionnalités Clés

* **Appels API Réels & Gratuits :** Connexion en direct aux serveurs d'**Open-Meteo** (géolocalisation par coordonnées GPS + météo mondiale) et d'**ER-API** (taux de change de la bourse en temps réel).
* **Console de Traçabilité HTTP (Panneau Droit) :** Visualisation transparente de l'arbre de pensée de l'agent. Chaque action affiche la requête JSON émise et la réponse brute retournée par les serveurs distants.
* **Suggestions Dynamiques :** Raccourcis en un clic triés par catégories pour tester immédiatement la réactivité de l'agent (Dakar, Tokyo, Paris, taux monétaires, génération de code).
* **Interface Futuriste & Responsive :** Design sombre inspiré des terminaux de développement avec un indicateur de pensée dynamique et une colorisation syntaxique pour le code.

---

##  Outils Intégrés à l'Agent

L'agent analyse l'intention de l'utilisateur et route la demande vers l'un de ses 4 modules spécialisés :

| Émoji | Nom de l'Outil | Rôle Technique |
| :--- | :--- | :--- |
| `🔍` | **WEB_RECHERCHE** | Identifie les intentions complexes et prépare les arguments de requêtage. |
| `⚡` | **APPEL_API_DISTANTE** | Effectue les requêtes HTTP `fetch()` vers les API mondiales ouvertes. |
| `🧠` | **RAISONNEMENT_IA** | Gère la logique de repli et structure les réponses textuelles de l'agent. |
| `💻` | **LOGICIEL_CODE** | Génère des structures et templates de code JavaScript proprement formatés. |

---

##  Structure du Projet

Le projet est ultra-léger et s'articule autour de 3 fichiers principaux (technologies web natives) :

```text
├── index.html   # Structure HTML5, grille des suggestions et squelette des panneaux
├── style.css    # Design système (couleurs CSS variables, animations de chargement)
└── script.js    # Logique de l'agent, algorithmes d'extraction de texte et appels fetch()
