# 🚀 Antigravity Mobile

**Antigravity Mobile** è un IDE di sviluppo assistito da AI fruibile interamente via chat da smartphone o browser, modellato sull'esperienza di **Google Antigravity**.

Ti permette di collegarti a qualsiasi tuo repository GitHub e programmare ovunque ti trovi usando **Google Gemini** (Gemini 2.5 Flash / Pro).

---

## ✨ Funzionalità Principali

* **Agente AI Autonomo (Loop Agentico)**:
  * Ispezione della struttura del progetto (`list_directory`)
  * Lettura e comprensione dei file sorgente (`view_file`)
  * Ricerca nel codice (`search_code`)
  * Modifica e creazione file con commit Git automatici (`edit_file`)
  * Creazione branch e Pull Request (`create_branch`, `create_pull_request`)
* **Visualizzazione Diff in stile Antigravity**:
  * Anteprima riga per riga di cosa è stato aggiunto (+ verde) ed eliminato (- rosso).
* **Ottimizzato per Smartphone (PWA)**:
  * Installabile come app nativa sulla home screen del telefono (iOS & Android).
  * Supporto all'input vocale (Web Speech API) per dettare prompt e comandi a voce.
* **Sicurezza & Autenticazione**:
  * Compatibile con Google OAuth (NextAuth) per restringere l'accesso solo alla tua email.
  * Accesso a GitHub tramite Personal Access Token sicuro (PAT).

---

## 🛠️ Come Avviare in Locale

1. **Installa le dipendenze**:
   ```bash
   npm install
   ```

2. **Copia il file di configurazione**:
   ```bash
   cp .env.example .env.local
   ```
   Inserisci la tua chiave API di Gemini (`GEMINI_API_KEY`) e il tuo token GitHub (`GITHUB_TOKEN`), oppure inseriscili direttamente nell'interfaccia web tramite il pulsante ⚙️ **Impostazioni**.

3. **Avvia il server di sviluppo**:
   ```bash
   npm run dev
   ```
   Apri [http://localhost:3000](http://localhost:3000) nel browser.

---

## ☁️ Come Pubblicare su Vercel (Gratis 24/7)

1. Crea un nuovo repository su GitHub e carica questo progetto:
   ```bash
   git add .
   git commit -m "feat: initial commit of Antigravity Mobile"
   git push origin main
   ```
2. Vai su [Vercel](https://vercel.com/) e clicca **Add New > Project**.
3. Importa il repository appena creato.
4. Nella sezione **Environment Variables**, aggiungi:
   * `GEMINI_API_KEY`: La tua chiave da [Google AI Studio](https://aistudio.google.com/app/apikey)
   * `GITHUB_TOKEN`: Il tuo token da [GitHub Tokens](https://github.com/settings/tokens) con permesso `repo`
5. Clicca su **Deploy**.
6. In meno di un minuto avrai un link pubblico HTTPS (es. `https://antigravity-mobile.vercel.app`).

---

## 📱 Come Installarlo su Smartphone

1. Apri il link di Vercel dal browser del tuo smartphone:
   * **Su iPhone (Safari)**: Tocca il pulsante Condividi (icona quadrata con la freccia verso l'alto) e seleziona **"Aggiungi alla schermata Home"**.
   * **Su Android (Chrome)**: Tocca il menu a tre puntini in alto a destra e seleziona **"Installa app"** o **"Aggiungi a schermata Home"**.
2. Verrà creata l'icona **Antigravity** sul tuo telefono: toccandola si aprirà a schermo intero come un'app nativa.
