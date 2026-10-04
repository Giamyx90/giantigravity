# 🚀 Giantigravity

**Giantigravity** è un IDE di sviluppo assistito da AI fruibile interamente via chat da smartphone o browser, modellato sull'esperienza di sviluppo agentico di Google.

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
  * Layout ottimizzato con `100dvh` e supporto per safe-area su iOS/Android.
  * Installabile come app nativa sulla home screen del telefono.
  * Supporto all'input vocale (Web Speech API) per dettare prompt e comandi a voce.
* **Sicurezza & Privacy 100% Client-Side**:
  * Nessuna chiave hardcoded sul server.
  * Ciascun utente configura e salva le proprie chiavi solo nel browser del proprio dispositivo.

---

## 🛠️ Come Avviare in Locale

1. **Installa le dipendenze**:
   ```bash
   npm install
   ```

2. **Avvia il server di sviluppo**:
   ```bash
   npm run dev
   ```
   Apri [http://localhost:3000](http://localhost:3000) nel browser (o `http://<IP-LOCALE>:3000` dallo smartphone).

---

## ☁️ Come Pubblicare su Vercel (Gratis 24/7)

1. Collega il repository GitHub `giantigravity` al tuo account Vercel:
   * Vai su [Vercel](https://vercel.com/) e fai **Add New > Project**.
   * Importa `giantigravity`.
   * Clicca su **Deploy** (non serve impostare variabili d'ambiente fisse, ogni utente userà le proprie chiavi dall'interfaccia).
2. In meno di un minuto avrai il tuo URL pubblico HTTPS.

---

## 📱 Come Installarlo su Smartphone

1. Apri il link dal browser del tuo smartphone:
   * **Su iPhone (Safari)**: Tocca il pulsante Condividi e seleziona **"Aggiungi alla schermata Home"**.
   * **Su Android (Chrome)**: Tocca i 3 puntini e seleziona **"Installa app"** o **"Aggiungi a schermata Home"**.
2. Verrà creata l'icona **Giantigravity** sul tuo telefono: toccandola si aprirà a schermo intero come un'app nativa.
