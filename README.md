# 🚚 Logystics Management — Backend

Benvenuto! Questo progetto è il **"motore" (backend)** dell'applicazione **Logystics Management**. 

Immagina questo sistema come la centrale operativa di un'azienda di trasporti: custodisce tutte le informazioni importanti in una cassaforte digitale e risponde alle richieste del sito web e dell'app usata dagli autisti.

---

## 💡 A cosa serve questo sistema?

Questo software si occupa di gestire tutto ciò che serve a un'azienda di logistica giorno dopo giorno:

- 🚛 **Parco Mezzi**: tiene traccia dei furgoni e camion, quanti chilometri hanno percorso e quando scadono assicurazione e revisione.
- 👥 **Collaboratori e Autisti**: registra chi lavora in azienda, i ruoli e la scadenza delle patenti.
- 📦 **Consegne**: organizza i viaggi, assegna ogni pacco al furgone e all'autista giusto e aggiorna lo stato della consegna (in attesa, in viaggio, consegnato).
- 💰 **Spese e Pagamenti**: tiene i conti di carburante, stipendi, manutenzioni e ricavi.
- 📊 **Pannello di Controllo (Dashboard)**: mostra riepiloghi grafici e numeri facili da leggere sull'andamento dell'attività.
- 📍 **Mappa e Posizione (Telemetria)**: rileva la posizione GPS in tempo reale dei furgoni su strada.
- 🔒 **Massima Riservatezza (Multi-Azienda)**: ogni azienda vede solo ed esclusivamente i propri dati; nessuno può sbirciare quelli degli altri.

---

## 🚀 Come farlo partire sul proprio computer (in modo semplice)

Non serve essere un programmatore esperto per avviarlo: basta seguire questi passaggi.

### 1. Requisiti necessari
- Avere installato **Node.js** (il programma che fa girare il codice).
- Avere a disposizione un database **MySQL** (dove vengono salvati fisicamente i dati).

### 2. Configurare i collegamenti
Nella cartella principale troverai un file chiamato `.env.example` (o `.env`). Lì dentro sono scritti il nome utente e la password per accedere al database.

### 3. Installare e preparare
Apri il terminale nella cartella del progetto ed esegui:
```bash
npm install        # Scarica gli strumenti necessari
npm run db:migrate # Crea le tabelle nel database
npm run db:seed    # Inserisce dei dati di esempio pronti all'uso
```

### 4. Avviare il sistema
```bash
npm start
```
Il sistema si accenderà all'indirizzo `http://localhost:3000`.

---

## 📖 Come vedere e provare le funzioni disponibili

Una volta avviato il programma, puoi aprire il tuo browser internet e andare su:
👉 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

Troverai una pagina interattiva con l'elenco di tutte le operazioni possibili e spiegazioni chiare su come provarle.

Inoltre, nella cartella principale è presente il file **`postman_collection.json`**, che può essere caricato dentro il programma **Postman** per fare test con un semplice click.

---

## 🧪 Controllo qualità (Test automatici)

Per essere certi che tutto funzioni alla perfezione e che i dati siano protetti, ci sono dei test automatici. 
Puoi eseguirli sul computer digitando:
```bash
npm test
```
Il computer farà delle prove simulate in pochi secondi e ti dirà se è tutto verde (funzionante).
