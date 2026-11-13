Hekolo – Backend Tasks & Technical Roadmap

1. Obiettivo del documento

Questo documento definisce l’architettura backend di riferimento per Hekolo e raccoglie le attività necessarie per sviluppare, completare o adeguare i servizi applicativi.

Il documento deve essere utilizzato come riferimento tecnico per lo sviluppo, evitando modifiche architetturali non concordate.

È necessario distinguere sempre tra:

* Stato attuale: funzionalità e componenti già presenti nel repository.
* Architettura target: struttura e funzionalità che il progetto dovrà raggiungere.
* Attività da completare: sviluppo, adeguamento o integrazione necessari.
* Da verificare: requisiti, campi o comportamenti non ancora confermati.

Non eliminare o riscrivere funzionalità esistenti senza una specifica autorizzazione.

⸻

2. Architettura generale

L’architettura target prevede tre componenti backend distinti.

2.1 Microservizio Java – Autenticazione e gestione aziendale

Responsabilità:

* Autenticazione degli utenti.
* Registrazione e gestione degli account.
* Gestione delle aziende.
* Gestione dei ruoli e dei permessi.
* Gestione delle licenze.
* Gestione delle informazioni generali aziendali.
* Emissione e validazione dei token di autenticazione.
* Gestione delle autorizzazioni per le funzionalità applicative.

Il microservizio Java rappresenta il riferimento per l’identità dell’utente e dell’azienda.

Le informazioni aziendali e quelle relative agli account non devono essere duplicate senza una precisa necessità negli altri servizi.

2.2 Backend Node.js – Gestione operativa

Tecnologie:

* Node.js
* MySQL
* API REST

Responsabilità:

* Gestione dei dati operativi dell’applicazione.
* Implementazione delle API REST.
* Gestione delle operazioni CRUD.
* Integrazione con il microservizio Java.
* Isolamento dei dati per azienda.
* Esposizione dei dati aggregati necessari alla dashboard.

Le principali risorse operative previste sono:

1. Mezzi.
2. Collaboratori.
3. Consegne.
4. Pagamenti / Entrate.

Nota: pagamenti ed entrate rappresentano la stessa area funzionale e non devono essere trattati come due moduli distinti.

2.3 Servizio Python – Funzionalità AI

Responsabilità:

* Gestione delle funzionalità di intelligenza artificiale.
* Elaborazione delle richieste AI.
* Esposizione di API dedicate.
* Integrazione con il backend Node.js quando necessario.
* Eventuale elaborazione e analisi dei dati operativi.

Il servizio Python deve rimanere separato dalla logica gestionale ordinaria.

⸻

3. Regole architetturali del backend Node.js

3.1 Organizzazione delle risorse

Ogni risorsa deve avere una struttura modulare e indipendente.

Per ogni modulo devono essere previsti almeno due file distinti:

* nome.routes.js
* nome.controller.js

Esempio:

modules/
  vehicles/
    vehicles.routes.js
    vehicles.controller.js
  collaborators/
    collaborators.routes.js
    collaborators.controller.js
  deliveries/
    deliveries.routes.js
    deliveries.controller.js
  payments/
    payments.routes.js
    payments.controller.js

Le route devono occuparsi di:

* Definizione degli endpoint.
* Associazione degli endpoint ai controller.
* Applicazione dei middleware.
* Gestione delle autorizzazioni.
* Annotazioni Swagger relative agli endpoint.

I controller devono occuparsi di:

* Ricezione delle richieste.
* Validazione dei dati in ingresso, direttamente o tramite componenti dedicati.
* Esecuzione della logica applicativa.
* Interazione con il livello di accesso ai dati.
* Restituzione delle risposte API.

La logica applicativa non deve essere concentrata all’interno dei file delle route.

3.2 Documentazione Swagger

La documentazione delle API deve essere centralizzata.

Prevedere un file:

config/swagger.js

Tutti i moduli devono contribuire alla documentazione delle rispettive API.

La documentazione deve essere consultabile attraverso un endpoint dedicato, ad esempio:

/api-docs

Ogni endpoint deve riportare:

* Metodo HTTP.
* Percorso.
* Descrizione.
* Parametri.
* Request body.
* Possibili risposte.
* Codici di errore.
* Requisiti di autenticazione.

Non devono essere introdotte documentazioni duplicate o configurazioni Swagger indipendenti per ogni modulo.

⸻

4. Moduli operativi e CRUD

Per ciascuna delle seguenti risorse devono essere previste le operazioni CRUD complete, compatibilmente con le regole applicative.

4.1 Mezzi

Operazioni previste:

* Creazione di un mezzo.
* Lettura dell’elenco dei mezzi.
* Lettura del dettaglio di un mezzo.
* Modifica di un mezzo.
* Eliminazione o disattivazione di un mezzo.

Prevedere filtri, paginazione e ordinamento quando necessari.

4.2 Collaboratori

Operazioni previste:

* Creazione di un collaboratore.
* Lettura dell’elenco dei collaboratori.
* Lettura del dettaglio di un collaboratore.
* Modifica dei dati.
* Eliminazione o disattivazione.

Verificare eventuali collegamenti con utenti, ruoli e account gestiti dal microservizio Java.

4.3 Consegne

Operazioni previste:

* Creazione di una consegna.
* Lettura dell’elenco delle consegne.
* Lettura del dettaglio.
* Modifica.
* Eliminazione o annullamento, secondo le regole applicative.

Prevedere la gestione degli stati e degli eventuali collegamenti con mezzi e collaboratori.

4.4 Pagamenti / Entrate

Questo modulo gestisce i pagamenti e le entrate aziendali.

Operazioni previste:

* Registrazione di un pagamento o di un’entrata.
* Lettura dell’elenco.
* Lettura del dettaglio.
* Modifica.
* Eliminazione o storicizzazione, secondo le regole applicative.

Verificare gli eventuali collegamenti con le consegne e gli altri elementi gestionali.

Importante: non creare un modulo Entrate separato dal modulo Pagamenti.

4.5 Campi e strutture dati

I campi esatti delle tabelle e dei form devono essere recuperati dalle strutture già presenti nel progetto e verificati rispetto ai requisiti applicativi.

Non inventare campi, tipi, vincoli o relazioni.

Se le informazioni non sono disponibili, indicare chiaramente il requisito come DA CONFERMARE.

⸻

5. Dashboard

La dashboard deve disporre di API dedicate.

Non è richiesto che il frontend recuperi separatamente tutte le risorse operative per costruire autonomamente ogni card e grafico.

Prevedere un endpoint dedicato, ad esempio:

GET /api/dashboard

L’endpoint dovrà restituire i dati aggregati necessari alla visualizzazione della dashboard.

La risposta dovrà essere strutturata in modo da supportare:

* Cards riepilogative.
* Indicatori e statistiche.
* Grafici.
* Dati relativi alle consegne.
* Dati relativi ai mezzi.
* Dati relativi ai collaboratori.
* Dati relativi a pagamenti ed entrate.

I valori, le metriche e i filtri esatti dovranno essere verificati sulla base della dashboard frontend e dei requisiti già definiti.

L’aggregazione dei dati deve essere gestita dal backend, quando tecnicamente opportuno.

Il frontend dovrà poter ottenere i dati necessari tramite l’endpoint dedicato, senza dover ricostruire autonomamente tutte le statistiche attraverso numerose chiamate.

⸻

6. Impostazioni applicative

La sezione Impostazioni deve essere organizzata in aree funzionali distinte.

Ogni area dovrà disporre di endpoint dedicati, evitando di concentrare tutte le operazioni in un’unica API generica.

6.1 Impostazioni generali

Gestione delle informazioni generali dell’azienda.

Le informazioni anagrafiche aziendali devono fare riferimento al microservizio Java, che ne mantiene la responsabilità.

Verificare quali informazioni devono essere lette o aggiornate attraverso il backend Node.js e quali devono essere gestite direttamente dal servizio Java.

6.2 Notifiche

Gestione delle notifiche applicative:

* Notifiche email.
* Notifiche SMS.

Prevedere la gestione delle configurazioni e delle preferenze, secondo i requisiti applicativi.

6.3 Backup

Gestione delle funzionalità di backup:

* Configurazione.
* Pianificazione, se prevista.
* Stato delle operazioni.
* Storico dei backup.

Verificare quali funzionalità siano già presenti e quali debbano essere sviluppate.

6.4 Log di sistema

Gestione e consultazione dei log applicativi.

Prevedere, ove necessario:

* Consultazione.
* Filtri.
* Paginazione.
* Informazioni sugli eventi.
* Tracciamento delle operazioni rilevanti.

6.5 Modalità manutenzione

Prevedere la gestione della modalità manutenzione dell’applicazione.

Verificare:

* Attivazione.
* Disattivazione.
* Eventuali messaggi informativi.
* Comportamento delle API durante la manutenzione.

6.6 Autenticazione a due fattori

Prevedere la gestione dell’autenticazione a due fattori (2FA).

Verificare:

* Attivazione.
* Disattivazione.
* Configurazione.
* Verifica del secondo fattore.
* Eventuali procedure di recupero.

Le funzionalità devono essere coerenti con il sistema di autenticazione gestito dal microservizio Java.

6.7 Licenza

La gestione delle licenze deve fare riferimento al microservizio Java.

Prevedere le API necessarie per recuperare le informazioni sulla licenza e renderle disponibili all’applicazione.

Non duplicare la logica di gestione delle licenze nel backend Node.js.

6.8 Gestione accessi all’app mobile

Prevedere una sezione dedicata alla gestione degli accessi all’applicazione mobile.

Verificare:

* Dispositivi autorizzati.
* Stato degli accessi.
* Eventuale revoca degli accessi.
* Associazione tra utenti e dispositivi.

I dettagli devono essere confermati sulla base dei requisiti effettivi.

6.9 Telemetria

Prevedere la gestione della telemetria applicativa.

Verificare:

* Dati raccolti.
* Configurazione.
* Stato del servizio.
* Consultazione delle informazioni.
* Eventuali impostazioni di attivazione e disattivazione.

⸻

7. Sicurezza e isolamento multi-azienda

L’applicazione deve supportare più aziende.

Tutte le operazioni sui dati aziendali devono essere isolate.

Regole obbligatorie:

1. Ogni richiesta autenticata deve essere associata a un’azienda.
2. Il companyId deve essere ricavato dal token o dal contesto di autenticazione verificato.
3. Non bisogna fidarsi di un companyId arbitrario passato dal frontend nel body o nei parametri.
4. Le query al database devono essere filtrate in base all’azienda autorizzata.
5. Un’azienda non deve poter leggere, modificare o eliminare dati appartenenti a un’altra azienda.
6. I middleware devono verificare autenticazione e autorizzazioni.
7. Le operazioni sensibili devono essere tracciabili.

Il backend Node.js deve validare il contesto di autenticazione ricevuto dal microservizio Java secondo un meccanismo sicuro e concordato.

Prevedere test specifici per verificare l’isolamento tra aziende.

⸻

8. Integrazione tra i servizi

Definire in modo chiaro le responsabilità e le comunicazioni tra:

* Microservizio Java.
* Backend Node.js.
* Servizio Python.

Evitare duplicazioni di responsabilità.

In particolare:

* Java gestisce identità, account, aziende, ruoli e licenze.
* Node.js gestisce i dati operativi e le relative API.
* Python gestisce le funzionalità AI.

Documentare le modalità di autenticazione e comunicazione tra i servizi.

⸻

9. Testing e qualità

Prevedere test per:

* Autenticazione.
* Autorizzazioni.
* Isolamento multi-azienda.
* CRUD dei mezzi.
* CRUD dei collaboratori.
* CRUD delle consegne.
* CRUD dei pagamenti / entrate.
* Dashboard.
* Impostazioni.
* Integrazione tra servizi.
* Gestione degli errori.
* Validazione dei dati.

Prevedere test automatici per gli endpoint principali e per i casi di accesso non autorizzato.

⸻

10. Collection Postman

ATTIVITÀ FUTURA – NON GENERARE ADESSO.

Al termine dello sviluppo delle API, creare una collection Postman in formato JSON che includa tutti gli endpoint del backend.

La collection dovrà contenere:

* Tutte le API disponibili.
* Organizzazione per moduli.
* Metodi HTTP.
* URL.
* Parametri.
* Request body di esempio.
* Header necessari.
* Gestione del token di autenticazione.
* Esempi delle risposte.
* Eventuali variabili di ambiente.

Prevedere una variabile per l’URL base del backend e una per il token di autenticazione.

La collection dovrà permettere di testare le API in modo ordinato e ripetibile.

Non generare il file JSON in questa fase: registrare solamente l’attività nella roadmap.

⸻

11. Analisi del repository e stato di avanzamento

Prima di proporre modifiche, analizzare il repository esistente.

Per ogni modulo e funzionalità identificare uno dei seguenti stati:

* IMPLEMENTATO: presente e funzionante, sulla base delle evidenze disponibili.
* PARZIALMENTE IMPLEMENTATO: presente ma incompleto.
* DA SVILUPPARE: non presente.
* DA ADEGUARE: presente ma non coerente con l’architettura target.
* DA VERIFICARE: non è possibile stabilirne lo stato con certezza.

Per ogni elemento indicare:

* Percorsi dei file interessati.
* Funzionalità già presenti.
* Differenze rispetto all’architettura target.
* Attività necessarie.
* Eventuali dipendenze da altri servizi.

Non considerare automaticamente i moduli esistenti come sostitutivi dei moduli definiti in questo documento.

Non eliminare funzionalità solo perché non compaiono nell’architettura target: evidenziare prima eventuali incompatibilità e dipendenze.

⸻

12. Roadmap e priorità

Organizzare le attività secondo il seguente ordine indicativo.

PRIORITÀ 1 – Analisi e fondamenta

* Analisi completa del repository.
* Verifica dell’architettura attuale.
* Definizione della struttura dei moduli.
* Verifica delle configurazioni MySQL.
* Definizione delle modalità di integrazione con Java.
* Definizione dell’autenticazione e del contesto aziendale.
* Configurazione Swagger centralizzata.

PRIORITÀ 2 – Moduli operativi

* CRUD mezzi.
* CRUD collaboratori.
* CRUD consegne.
* CRUD pagamenti / entrate.
* Validazioni.
* Gestione degli errori.
* Paginazione e filtri, dove necessari.

PRIORITÀ 3 – Dashboard e impostazioni

* API dedicata dashboard.
* Impostazioni generali.
* Notifiche email e SMS.
* Backup.
* Log di sistema.
* Modalità manutenzione.
* Autenticazione a due fattori.
* Licenze.
* Accessi app mobile.
* Telemetria.

PRIORITÀ 4 – Sicurezza e integrazioni

* Verifica isolamento multi-azienda.
* Verifica dei permessi.
* Integrazione Java.
* Integrazione Python.
* Test di sicurezza.

PRIORITÀ 5 – Testing e documentazione

* Test automatici.
* Verifica Swagger.
* Verifica degli endpoint.
* Documentazione tecnica.
* Preparazione della futura collection Postman.

⸻

13. Criteri generali di accettazione

Il backend potrà essere considerato conforme all’architettura target quando:

* Le responsabilità dei tre servizi saranno chiaramente separate.
* Le API Node.js saranno organizzate per moduli.
* Ogni modulo avrà route e controller distinti.
* Swagger documenterà gli endpoint.
* I CRUD previsti saranno disponibili e testati.
* La dashboard disporrà di una GET dedicata con dati aggregati.
* Le impostazioni saranno organizzate per aree funzionali.
* L’isolamento multi-azienda sarà verificato.
* Le integrazioni tra Java, Node.js e Python saranno documentate.
* I test principali saranno superati.
* La futura collection Postman sarà inserita nella roadmap.

⸻

14. Regole per lo sviluppo con Codex

Durante l’analisi e la pianificazione:

1. Non modificare i sorgenti del progetto.
2. Non eliminare file o funzionalità esistenti.
3. Non modificare configurazioni o database.
4. Non inventare requisiti o campi mancanti.
5. Non cambiare l’architettura definita in questo documento.
6. Evidenziare eventuali problemi o incompatibilità prima di proporre modifiche.
7. Distinguere sempre lo stato attuale dalla situazione desiderata.
8. Segnalare chiaramente le informazioni da confermare.
9. Mantenere aggiornato questo documento durante le successive fasi di sviluppo, previa richiesta.

In questa fase l’obiettivo è esclusivamente documentare e pianificare il backend. Non avviare lo sviluppo e non modificare il codice.