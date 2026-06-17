from __future__ import annotations

import html
import json
import re
import unicodedata
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


HOST = "127.0.0.1"
PORT = 8765
ROOT = Path(__file__).resolve().parent
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
OLLAMA_MODEL = "llama3.2"


SYSTEM_PROMPT = """Tu es Agent IA CapG, un assistant gratuit et local.
Reponds en francais, clairement, avec une reponse directement utile.
Structure ta reponse quand c'est pertinent, mais reste concis.
Si une information depend du temps reel, explique que tu ne peux pas la verifier sans connexion/API.
"""


def normalize(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text.lower())
    return "".join(char for char in decomposed if unicodedata.category(char) != "Mn")


def evaluate_math(text: str) -> str | None:
    candidates = re.findall(r"[\d\s+\-*/().,xX]{3,}", text)
    expression = ""
    for candidate in candidates:
        cleaned = candidate.strip()
        has_digit = re.search(r"\d", cleaned)
        has_operator = re.search(r"[+\-*/xX]", cleaned)
        if has_digit and has_operator:
            expression = cleaned
            break

    if not expression:
        return None

    expression = expression.replace(",", ".").replace("x", "*").replace("X", "*")
    if not re.fullmatch(r"[0-9+\-*/().\s]+", expression):
        return None

    try:
        result = eval(expression, {"__builtins__": {}}, {})
    except Exception:
        return None

    if not isinstance(result, (int, float)):
        return None
    return f"{expression.strip()} = {result}"


def extract_after_marker(message: str, markers: tuple[str, ...]) -> str:
    lower = normalize(message)
    for marker in markers:
        index = lower.find(marker)
        if index >= 0:
            return message[index + len(marker):].strip(" :\n\t")
    return ""


def summarize_content(message: str) -> str:
    content = extract_after_marker(
        message,
        (
            "contenu du fichier :",
            "contenu du fichier:",
            "resume",
            "resumer",
            "synthese",
            "synthétise",
            "synthese de",
        ),
    )
    if not content:
        content = message

    content = re.sub(r"\[Note :.*?\]$", "", content, flags=re.DOTALL).strip()
    sentences = [
        part.strip()
        for part in re.split(r"(?<=[.!?])\s+", content.replace("\n", " "))
        if len(part.strip()) > 25
    ]

    if not sentences:
        lines = [line.strip() for line in content.splitlines() if len(line.strip()) > 8]
        sentences = lines[:6]

    if not sentences:
        return "Le fichier ne contient pas assez de texte lisible pour produire un resume fiable."

    selected = sentences[:3]
    keywords = []
    for word in re.findall(r"\b[A-Za-zÀ-ÿ0-9_-]{5,}\b", content):
        clean = word.strip(".,;:!?()[]{}").lower()
        if clean not in keywords and len(keywords) < 8:
            keywords.append(clean)

    lines = "\n".join(f"- {sentence}" for sentence in selected)
    keyword_line = ", ".join(keywords) if keywords else "non detectes"
    return (
        "Resume du fichier :\n\n"
        f"Sujet principal : {selected[0][:180]}\n\n"
        f"Points importants :\n{lines}\n\n"
        f"Mots cles reperes : {keyword_line}\n\n"
        "A retenir : le fichier a ete lu et condense automatiquement par l'agent local."
    )


def write_email(message: str) -> str:
    lower = normalize(message)
    if "retard" in lower and "livraison" in lower:
        return (
            "Objet : Information concernant le retard de livraison\n\n"
            "Bonjour,\n\n"
            "Nous vous informons qu'un retard impacte la livraison initialement prevue. "
            "Nous mettons tout en oeuvre pour finaliser l'expedition dans les meilleurs delais "
            "et nous reviendrons vers vous avec une date actualisee.\n\n"
            "Nous vous prions de nous excuser pour ce desagrement.\n\n"
            "Cordialement,"
        )

    topic = extract_after_marker(message, ("email", "e-mail", "mail", "redige"))
    topic = topic or "votre demande"
    return (
        f"Objet : {topic[:70].capitalize()}\n\n"
        "Bonjour,\n\n"
        f"Je vous contacte concernant {topic}. "
        "Vous trouverez ci-dessous les informations importantes et les prochaines etapes a prevoir.\n\n"
        "N'hesitez pas a revenir vers moi si vous souhaitez des precisions.\n\n"
        "Cordialement,"
    )


def explain_topic(message: str) -> str:
    lower = normalize(message)

    if "mitose" in lower:
        return (
            "La mitose est le processus par lequel une cellule se divise pour former deux cellules filles identiques.\n\n"
            "1. Prophase : les chromosomes deviennent visibles.\n"
            "2. Metaphase : les chromosomes s'alignent au centre.\n"
            "3. Anaphase : les chromatides se separent.\n"
            "4. Telophase : deux noyaux se reforment.\n"
            "5. Cytocinese : la cellule se coupe en deux.\n\n"
            "Elle sert a la croissance, au renouvellement des tissus et a la reparation."
        )

    if "transformer" in lower or "attention" in lower or "llm" in lower:
        return (
            "Un Transformer est une architecture d'IA concue pour traiter du texte sous forme de tokens.\n\n"
            "L'idee centrale est l'attention : le modele compare chaque mot avec les autres mots du contexte pour "
            "decider lesquels sont les plus utiles.\n\n"
            "Dans un LLM, cette architecture permet de predire le prochain token et de produire une reponse coherente."
        )

    if "systeme solaire" in lower or "jupiter" in lower or "planete" in lower:
        return (
            "Le systeme solaire contient huit planetes : Mercure, Venus, Terre, Mars, Jupiter, Saturne, Uranus et Neptune.\n\n"
            "Jupiter est la plus grande planete. C'est une geante gazeuse, connue pour sa Grande Tache rouge, "
            "son champ magnetique puissant et ses lunes principales : Io, Europe, Ganymede et Callisto."
        )

    topic = extract_after_marker(message, ("explique", "explique-moi", "c'est quoi", "qu'est-ce que"))
    topic = topic or message
    return (
        f"Voici une explication simple de : {topic}\n\n"
        "1. Idee principale : on commence par identifier le concept central.\n"
        "2. Fonctionnement : on decompose le sujet en petites parties.\n"
        "3. Exemple : on relie le concept a une situation concrete.\n"
        "4. A retenir : garde la definition courte, puis ajoute les details si necessaire."
    )


def generate_code_help(message: str) -> str:
    lower = normalize(message)

    if "map()" in lower or "map(" in lower or "utilisateur" in lower:
        return (
            "Le bug vient souvent du fait que la variable vaut null ou undefined avant map().\n\n"
            "Solution JavaScript :\n\n"
            "const names = (users ?? []).map(user => user.name);\n\n"
            "Pourquoi ca marche : si users n'existe pas, on utilise un tableau vide, donc map() ne plante pas."
        )

    if "trier" in lower and "date" in lower:
        return (
            "Voici une fonction JavaScript pour trier un tableau d'objets par date :\n\n"
            "function sortByDate(items, key = 'date') {\n"
            "  return [...items].sort((a, b) => new Date(a[key]) - new Date(b[key]));\n"
            "}\n\n"
            "Elle copie le tableau avec [...items] pour eviter de modifier le tableau original."
        )

    return (
        "Pour t'aider correctement avec le code, envoie-moi :\n\n"
        "1. Le morceau de code concerne.\n"
        "2. L'erreur affichee dans la console.\n"
        "3. Le comportement attendu.\n\n"
        "Je pourrai ensuite proposer une correction precise."
    )


def build_plan(message: str) -> str:
    lower = normalize(message)

    if "rapport" in lower:
        return (
            "Plan detaille pour un rapport de projet :\n\n"
            "1. Introduction : contexte, problematique, objectifs.\n"
            "2. Analyse de l'existant : besoins, contraintes, limites.\n"
            "3. Methodologie : outils, organisation, choix techniques.\n"
            "4. Realisation : etapes, captures, difficultes, solutions.\n"
            "5. Resultats : ce qui fonctionne, tests, validation.\n"
            "6. Conclusion : bilan, competences acquises, perspectives."
        )

    if "python" in lower:
        return (
            "Plan d'apprentissage Python gratuit :\n\n"
            "1. Bases : variables, conditions, boucles, fonctions.\n"
            "2. Structures : listes, dictionnaires, fichiers, JSON.\n"
            "3. Projets courts : calculatrice, gestionnaire de notes, mini API.\n"
            "4. Web local : connecter Python a HTML avec un serveur.\n"
            "5. IA locale : utiliser Ollama ou un agent regles comme celui-ci.\n"
            "6. Projet final : chatbot local avec historique et outils."
        )

    return (
        "Voici un plan simple :\n\n"
        "1. Objectif : definir exactement le resultat attendu.\n"
        "2. Donnees : lister ce qu'il faut connaitre ou collecter.\n"
        "3. Etapes : decouper le travail en petites actions.\n"
        "4. Verification : tester que chaque etape marche.\n"
        "5. Amelioration : corriger, simplifier, puis finaliser."
    )


def local_agent(message: str) -> tuple[str, str]:
    lower = normalize(message)
    math_result = evaluate_math(message)

    if math_result:
        return (
            f"J'ai calcule l'expression localement :\n\n{math_result}",
            "python_math",
        )

    if any(word in lower for word in ["bonjour", "salut", "hello", "bonsoir"]):
        return (
            "Bonjour ! Le backend Python est actif. Je peux repondre gratuitement en local, "
            "et utiliser Ollama automatiquement si tu l'as lance sur ton PC.",
            "python_greeting",
        )

    if any(word in lower for word in ["email", "e-mail", "mail", "redige", "rédige"]):
        return write_email(message), "python_write"

    if any(word in lower for word in ["resume", "resumer", "synthese", "synthétise"]):
        return summarize_content(message), "python_summary"

    if any(word in lower for word in ["plan", "rapport", "apprentissage", "programme"]):
        return build_plan(message), "python_plan"

    if any(word in lower for word in ["code", "javascript", "bug", "fonction"]):
        return generate_code_help(message), "python_code_review"

    if any(word in lower for word in ["explique", "c'est quoi", "qu'est-ce", "mitose", "transformer", "attention", "jupiter", "planete"]):
        return explain_topic(message), "python_explain"

    if any(word in lower for word in ["capitale", "japon", "sommet", "everest", "geographie"]):
        return (
            "Reponse rapide : la capitale du Japon est Tokyo. Le plus haut sommet du monde est l'Everest, "
            "a environ 8 849 metres d'altitude.\n\n"
            "Pour une carte interactive, utilise Google Maps ou OpenStreetMap.",
            "python_geography",
        )

    if any(word in lower for word in ["meteo", "actualite", "eur/usd", "finance", "taux"]):
        return (
            "Cette demande depend de donnees en temps reel. Sans API connectee, je ne dois pas inventer de chiffres.\n\n"
            "Solution : branche une API gratuite comme Open-Meteo pour la meteo, ou une source officielle pour les taux. "
            "Je peux aussi t'aider a ajouter ce module.",
            "python_realtime",
        )

    return (
        f"Voici une reponse structurée a ta demande : {message}\n\n"
        "1. Je reformule : tu veux une aide claire et directement exploitable.\n"
        "2. Proposition : precise le format souhaite si tu veux mieux cibler la reponse "
        "(explication, code, plan, email, resume, calcul).\n"
        "3. Prochaine action : envoie les details ou le texte/code concerne, et je te donne une reponse plus precise.",
        "python_reason",
    )


def ask_ollama(message: str) -> str | None:
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": f"{SYSTEM_PROMPT}\nUtilisateur: {message}\nAssistant:",
        "stream": False,
        "options": {
            "temperature": 0.4,
            "num_predict": 500,
        },
    }

    request = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (OSError, urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return None

    answer = str(data.get("response", "")).strip()
    return answer or None


def text_to_html(text: str) -> str:
    escaped = html.escape(text)
    escaped = re.sub(r"^(\d+)\. ", r"<strong>\1.</strong> ", escaped, flags=re.MULTILINE)
    return escaped.replace("\n", "<br>")


class AgentHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/chat":
            self.send_error(404, "Endpoint introuvable")
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(length).decode("utf-8")

        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError:
            self.send_json({"error": "JSON invalide"}, status=400)
            return

        message = str(payload.get("message", "")).strip()
        if not message:
            self.send_json({"error": "Message vide"}, status=400)
            return

        ollama_answer = ask_ollama(message)
        if ollama_answer:
            answer = ollama_answer
            engine = f"ollama:{OLLAMA_MODEL}"
            intent = "python_ollama"
        else:
            answer, intent = local_agent(message)
            engine = "python_local_gratuit"

        self.send_json(
            {
                "tool": "python_agent",
                "trace": "Appel du backend Python gratuit...",
                "input": {
                    "message": message,
                    "engine": engine,
                },
                "output": f"Reponse generee par {engine}",
                "html": text_to_html(answer),
                "intent": intent,
            }
        )

    def send_json(self, payload: dict, status: int = 200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    server = ThreadingHTTPServer((HOST, PORT), AgentHandler)
    print(f"Agent IA CapG lance sur http://{HOST}:{PORT}/")
    print("Mode gratuit : Python local. Ollama sera utilise automatiquement si disponible.")
    server.serve_forever()


if __name__ == "__main__":
    main()
