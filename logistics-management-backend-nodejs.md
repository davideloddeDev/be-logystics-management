# Backend principale — Node.js + MySQL

# logystics-management -- Piano di sviluppo backend

> Documento di lavoro: architettura, API e task di sviluppo.\
> Stato: prima bozza da validare. Le decisioni ancora aperte sono
> raccolte in fondo.

## 1. Obiettivo e perimetro

Realizzare il backend del gestionale Logystics Management per aziende di logistica,
mantenendo il frontend web esistente e l'app mobile Flutter per gli
autisti.

Il backend è suddiviso in tre componenti:

1.  **Microservizio Java** -- autenticazione, account e identità
    aziendale.
2.  **Backend principale Node.js + MySQL** -- dati operativi, CRUD,
    impostazioni, dashboard e telemetria.
3.  **Servizio AI Python** -- interpretazione delle domande e
    consultazione controllata dei dati aziendali.

La separazione è logica: i servizi comunicano tramite API interne
autenticate. Le responsabilità e la proprietà dei dati devono rimanere
definite, evitando che Java e Node.js modifichino indipendentemente le
stesse tabelle.

## 2. Architettura e responsabilità

### 2.1 Microservizio Java -- Authentication Service

Responsabilità:

-   Registrazione del titolare tramite email, password e codice licenza.
-   Login e verifica delle credenziali.
-   Emissione e verifica dei token di accesso.
-   Identità dell'utente, azienda e ruolo.
-   Gestione degli account aziendali e dei relativi permessi.
-   Consultazione e gestione dello stato della licenza.
-   Gestione delle richieste di interruzione del servizio e della
    scadenza.

**Proprietà dei dati:** Java è il servizio autorevole per credenziali,
identità/account e licenze. Node.js non deve leggere direttamente le
tabelle interne di autenticazione: deve utilizzare il token verificato
e, quando necessario, le API interne Java.

### 2.2 Backend Node.js -- Main API

Responsabilità:

-   CRUD dei mezzi, collaboratori, consegne e pagamenti.
-   Dati e impostazioni operative dell'azienda.
-   Endpoint dedicato per dashboard e statistiche aggregate.
-   Gestione degli accessi all'app Flutter.
-   Ricezione e consultazione dei dati di telemetria.
-   API utilizzate dal frontend web e dai servizi interni autorizzati.

**Proprietà dei dati:** Node.js è il servizio autorevole per i dati
gestionali e operativi, conservati in MySQL.

### 2.3 Servizio Python -- AI Service

Responsabilità:

-   Ricezione delle domande in linguaggio naturale.
-   Comprensione dell'intento e identificazione delle informazioni
    richieste.
-   Consultazione dei dati aziendali tramite API Node.js autorizzate.
-   Produzione di risposte comprensibili e basate sui dati disponibili.
-   Gestione degli errori, delle richieste non supportate e dei limiti
    di accesso.

Il servizio AI non deve ricevere credenziali MySQL né poter interrogare
liberamente il database. Deve utilizzare API controllate e rispettare
sempre il contesto aziendale dell'utente.

## 3. Sicurezza, autenticazione e multi-tenancy

### 3.1 Token e contesto dell'utente

Dopo il login, Java emette un token firmato. Il token (o il contesto
autenticato derivato da esso) deve permettere di identificare almeno:

-   `userId`
-   `companyId`
-   `role`
-   `licenseId`
-   scadenza del token (`exp`)
-   identificativo del token (`jti`), se previsto dalla strategia di
    revoca

Il token va trasmesso nell'header:

``` http
Authorization: Bearer <access_token>
```

Non passare il token come parametro URL o come campo del body.

### 3.2 Regole di autorizzazione

-   Ogni endpoint Node.js che legge o modifica dati aziendali deve
    applicare il filtro `companyId`.
-   Il `companyId` deve provenire dall'identità autenticata verificata,
    mai da un valore arbitrario inviato dal frontend.
-   Le operazioni devono verificare anche il ruolo e i permessi
    richiesti.
-   Solo il ruolo `owner` può gestire gli account aziendali e la
    licenza.
-   Gli account `employee` possono accedere esclusivamente alle funzioni
    autorizzate per il loro ruolo.
-   Anche le operazioni di dettaglio, modifica ed eliminazione devono
    verificare che la risorsa appartenga alla stessa azienda.
-   Le risposte non devono rivelare se una risorsa appartenente a
    un'altra azienda esiste.

### 3.3 Comunicazione tra servizi

-   HTTPS per comunicazioni esterne e interne ove applicabile.
-   Token firmati e verifica di firma, issuer, audience e scadenza.
-   Per le API interne, autenticazione tra servizi (ad esempio
    credenziali di servizio o token con audience dedicata).
-   Segreti e chiavi fuori dal codice sorgente.
-   Log senza password, token completi o dati personali non necessari.
## 3. Sicurezza, autenticazione e multi-tenancy

### 3.1 Token e contesto dell'utente

Dopo il login, Java emette un token firmato. Il token (o il contesto
autenticato derivato da esso) deve permettere di identificare almeno:

-   `userId`
-   `companyId`
-   `role`
-   `licenseId`
-   scadenza del token (`exp`)
-   identificativo del token (`jti`), se previsto dalla strategia di
    revoca

Il token va trasmesso nell'header:

``` http
Authorization: Bearer <access_token>
```

Non passare il token come parametro URL o come campo del body.

### 3.2 Regole di autorizzazione

-   Ogni endpoint Node.js che legge o modifica dati aziendali deve
    applicare il filtro `companyId`.
-   Il `companyId` deve provenire dall'identità autenticata verificata,
    mai da un valore arbitrario inviato dal frontend.
-   Le operazioni devono verificare anche il ruolo e i permessi
    richiesti.
-   Solo il ruolo `owner` può gestire gli account aziendali e la
    licenza.
-   Gli account `employee` possono accedere esclusivamente alle funzioni
    autorizzate per il loro ruolo.
-   Anche le operazioni di dettaglio, modifica ed eliminazione devono
    verificare che la risorsa appartenga alla stessa azienda.
-   Le risposte non devono rivelare se una risorsa appartenente a
    un'altra azienda esiste.

### 3.3 Comunicazione tra servizi

-   HTTPS per comunicazioni esterne e interne ove applicabile.
-   Token firmati e verifica di firma, issuer, audience e scadenza.
-   Per le API interne, autenticazione tra servizi (ad esempio
    credenziali di servizio o token con audience dedicata).
-   Segreti e chiavi fuori dal codice sorgente.
-   Log senza password, token completi o dati personali non necessari.
### Convenzione di struttura Node.js: Route, Controller e Swagger

Per ogni risorsa/API Node.js si adottano **due file JavaScript distinti**:

- **Route (`*.routes.js`)**: dichiara i percorsi HTTP, associa ogni endpoint alla funzione del controller, applica i middleware (autenticazione, autorizzazione e validazione) e contiene la documentazione Swagger/OpenAPI degli endpoint.
- **Controller (`*.controller.js`)**: contiene le funzioni richiamate dalle route. Ogni funzione gestisce la richiesta e la risposta HTTP, delegando la logica di business e l'accesso ai dati ai service/repository. La logica non va duplicata nei file route.

Esempio di organizzazione:

```text
src/
  routes/
    vehicles.routes.js
    collaborators.routes.js
    deliveries.routes.js
    payments.routes.js
    dashboard.routes.js
    settings.routes.js
    telemetry.routes.js
  controllers/
    vehicles.controller.js
    collaborators.controller.js
    deliveries.controller.js
    payments.controller.js
    dashboard.controller.js
    settings.controller.js
    telemetry.controller.js
  services/
  repositories/
  middlewares/
  config/
    swagger.js
  app.js
```

Esempio concettuale:

```javascript
// routes/vehicles.routes.js
router.get("/", vehiclesController.getAllVehicles);
router.get("/:id", vehiclesController.getVehicleById);
router.post("/", vehiclesController.createVehicle);
router.put("/:id", vehiclesController.updateVehicle);
router.delete("/:id", vehiclesController.deleteVehicle);
```

Le definizioni Swagger/OpenAPI associate alle route devono descrivere almeno:
- metodo HTTP e percorso;
- riepilogo e descrizione dell'endpoint;
- parametri `path`, `query` e header;
- schema del body, quando presente;
- schema delle risposte e codici HTTP;
- autenticazione Bearer;
- possibili errori (`400`, `401`, `403`, `404`, `409`, `500`, secondo il caso).

La configurazione comune di Swagger (titolo, versione API, server, schema di sicurezza Bearer e generazione della specifica OpenAPI) va centralizzata in `config/swagger.js` e registrata nell'applicazione. La documentazione dei singoli endpoint resta vicino alle rispettive route, così viene aggiornata insieme alle API. La UI della documentazione può essere esposta, ad esempio, su `/api-docs`.

Task:
- [ ] Creare le cartelle `routes`, `controllers`, `services`, `repositories`, `middlewares` e `config`.
- [ ] Creare per ogni risorsa il file route e il relativo file controller.
- [ ] Mantenere nei file route solo definizione degli endpoint, middleware, collegamento ai controller e documentazione Swagger.
- [ ] Mantenere nei controller le funzioni degli endpoint, delegando la logica riutilizzabile ai service.
- [ ] Centralizzare la configurazione Swagger/OpenAPI e pubblicare la documentazione su un percorso dedicato (ad esempio `/api-docs`).
- [ ] Documentare ogni endpoint con parametri, body, risposte, codici di errore e autenticazione.
- [ ] Verificare che Swagger non esponga endpoint interni o informazioni sensibili.

## 5. Backend Node.js -- API gestionali

Tutte le rotte gestionali richiedono identità autenticata e
autorizzazione. Ogni record deve essere associato a un'azienda
(`companyId`) e tutte le query devono rispettare tale perimetro.

Convenzione CRUD proposta: - `POST /resource` -- creazione -
`GET /resource` -- elenco con paginazione, filtri e ordinamento -
`GET /resource/{id}` -- dettaglio - `PUT /resource/{id}` o
`PATCH /resource/{id}` -- modifica - `DELETE /resource/{id}` --
eliminazione o archiviazione secondo le regole di dominio

### 5.1 Mezzi -- `/vehicles`

Campi raccolti dal frontend: - targa - modello - tipologia: furgone,
mezzo leggero, camion, moto - stato: attivo, in manutenzione, fuori
servizio - chilometri percorsi - data ultima manutenzione - compagnia
assicurativa - numero polizza - scadenza assicurazione

Task: - \[ \] CRUD mezzi. - \[ \] Validazione targa e campi
obbligatori. - \[ \] Filtri per stato, tipologia e assicurazione in
scadenza/scaduta. - \[ \] Gestione delle date e dei chilometri. - \[ \]
Definire se conservare lo storico di manutenzioni e assicurazioni in
tabelle dedicate.

### 5.2 Collaboratori -- `/collaborators`

Campi raccolti: - nome - cognome - ruolo: autista, magazziniere,
responsabile logistica, amministrazione - telefono - email - stato:
attivo, malattia, cessato - data assunzione - scadenza patente

Task: - \[ \] CRUD collaboratori. - \[ \] Validazione email e dati
obbligatori. - \[ \] Filtri per ruolo e stato. - \[ \] Gestione scadenze
patente. - \[ \] Definire se i dati del collaboratore e le credenziali
dell'account applicativo sono entità separate (raccomandato).

### 5.3 Consegne -- `/deliveries`

Campi raccolti: - codice consegna - cliente - indirizzo di consegna -
mezzo (riferimento al mezzo/targa) - autista (riferimento al
collaboratore) - stato: in attesa, in transito, consegnata, annullata -
data e ora - importo, se applicabile

Task: - \[ \] CRUD consegne. - \[ \] Generazione o validazione del
codice consegna univoco nell'ambito previsto. - \[ \] Collegamento a
cliente, mezzo e autista. - \[ \] Filtri per stato, periodo, cliente,
mezzo e autista. - \[ \] Definire lo storico dei cambi di stato e gli
eventi di consegna. - \[ \] Definire se l'importo della consegna è un
dato informativo o genera una registrazione nei pagamenti, evitando
duplicazioni contabili.

### 5.4 Pagamenti -- `/payments`

La sezione descritta nel frontend comprende voci relative a stipendi,
mezzi e attrezzature; entrate e pagamenti sono stati indicati come
un'unica sezione nel riepilogo delle rotte. La modellazione contabile va
confermata prima di implementare il database.

Campi raccolti: - tipo: stipendio, mezzo, attrezzatura - riferimento -
descrizione - importo - stato: da pagare, pagato - data

Task: - \[ \] CRUD delle voci di pagamento. - \[ \] Filtri per tipo,
stato e periodo. - \[ \] Calcolo totale voci, importi pagati, da pagare
e residuo. - \[ \] Definire se entrate e uscite devono essere
rappresentate da un'unica entità finanziaria con campo `direction`
oppure da registrazioni distinte. - \[ \] Definire metodi di pagamento e
riferimenti a consegne/clienti, se necessari. - \[ \] Usare importi
decimali con valuta esplicita; evitare tipi floating point per valori
monetari.

## 6. Dashboard -- `/dashboard`

Il frontend deve poter chiamare un endpoint dedicato per ottenere i dati
già aggregati, senza dover comporre autonomamente numerose chiamate
CRUD.

Possibile risposta organizzata in sezioni: - riepilogo mensile:
consegne, mezzi attivi, collaboratori, entrate - grafico entrate della
settimana - consegne recenti - distribuzione consegne per stato - mezzi
più utilizzati - distribuzione degli incassi per metodo di pagamento

Task: - \[ \] Definire un contratto JSON unico per la dashboard. - \[ \]
Implementare aggregazioni SQL lato Node.js/MySQL. - \[ \] Applicare
sempre il filtro aziendale. - \[ \] Definire timezone, valuta,
intervalli temporali e gestione dei periodi vuoti. - \[ \] Aggiungere
indici e ottimizzare le query più frequenti. - \[ \] Valutare cache solo
dopo aver misurato le prestazioni.

## 7. Impostazioni aziendali -- `/settings`

### 7.1 Profilo aziendale

Campi: - nome azienda - indirizzo - email - telefono - partita IVA

Task: - \[ \] GET e PUT del profilo aziendale. - \[ \] Definire il
servizio proprietario dei dati aziendali: proposta iniziale, Node.js per
i dati di profilo e Java per identità/licenza. - \[ \] Validare partita
IVA, email e recapiti secondo le regole applicabili.

### 7.2 Notifiche

-   [ ] Configurazione notifiche email.
-   [ ] Configurazione notifiche SMS.
-   [ ] Preferenze e tipi di evento notificabili.
-   [ ] Gestione sicura delle credenziali dei provider.
-   [ ] Log degli invii e gestione dei fallimenti.

### 7.3 Backup e log di sistema

-   [ ] Definire strategia, frequenza, retention e ripristino dei
    backup.
-   [ ] Registrare eventi applicativi e operazioni amministrative.
-   [ ] Proteggere i log da accessi non autorizzati e non registrare
    segreti.
-   [ ] Definire consultazione dei log e permessi.

### 7.4 Modalità manutenzione e autenticazione a due fattori

-   [ ] Definire chi può attivare/disattivare la modalità manutenzione.
-   [ ] Definire messaggi e comportamento del frontend durante la
    manutenzione.
-   [ ] Definire se il 2FA è obbligatorio o facoltativo e per quali
    ruoli.
-   [ ] Scegliere metodo 2FA e procedure di recupero.

### 7.5 Licenza e accessi app mobile

-   [ ] Mostrare nome/tipo licenza, account utilizzati, account
    disponibili e scadenza (dati forniti da Java).
-   [ ] Esporre lo stato della richiesta di interruzione del servizio.
-   [ ] Elencare gli autisti abilitabili all'app Flutter.
-   [ ] Consentire al titolare o a un ruolo autorizzato di
    abilitare/disabilitare l'accesso mobile.
-   [ ] Verificare lo stato di abilitazione anche al login e durante
    l'uso dell'app mobile.

## 8. Telemetria Pro

Funzionalità riservata alle aziende con licenza Pro.

Dati descritti: - mezzo selezionato - latitudine e longitudine GPS -
indirizzo ricavato dalle coordinate (reverse geocoding) - carico
disponibile - carico totale - tara - stato motore: acceso/spento -
velocità - temperatura del vano - autonomia stimata - data e ora
dell'ultimo aggiornamento

Task: - \[ \] Verificare licenza e abilitazione Telemetria Pro. - \[ \]
Definire fonte dei dati e protocollo di acquisizione dai
dispositivi/applicazioni automotive. - \[ \] Definire endpoint di
ingestione dei dati telemetrici. - \[ \] Memorizzare timestamp del
dispositivo e timestamp di ricezione. - \[ \] Validare coordinate, unità
di misura e valori ricevuti. - \[ \] Esporre ultimo dato noto per
ciascun mezzo. - \[ \] Esporre indicatore di aggiornamento
obsoleto/offline in base a una soglia configurabile. - \[ \] Integrare
reverse geocoding con provider da scegliere, gestendo limiti e
indisponibilità. - \[ \] Definire retention e storico dei punti GPS. -
\[ \] Proteggere i dati di localizzazione con autorizzazioni, audit e
policy di conservazione. - \[ \] Definire frequenza di aggiornamento e
comportamento in assenza di connessione.

Nota: i dati telemetrici non sono necessariamente in tempo reale. L'API
deve restituire chiaramente l'istante dell'ultimo aggiornamento e non
presentare un dato vecchio come posizione corrente.

## 10. Database MySQL -- principi iniziali

-   [ ] Definire schema e migrazioni versionate.
-   [ ] Usare chiavi primarie e vincoli referenziali.
-   [ ] Associare ogni dato aziendale a `company_id`.
-   [ ] Creare indici per `company_id`, date, stati e chiavi di
    relazione usate nei filtri.
-   [ ] Usare transazioni per operazioni multi-tabella.
-   [ ] Usare `DECIMAL` per importi monetari.
-   [ ] Definire timezone di memorizzazione e conversione.
-   [ ] Definire soft delete/archiviazione per le entità per cui serve
    uno storico.
-   [ ] Separare le tabelle di autenticazione/licenza (proprietà Java)
    da quelle gestionali (proprietà Node.js), se i servizi condividono
    la stessa istanza MySQL.
-   [ ] Non consentire a entrambi i servizi di scrivere sulle stesse
    tabelle.

Possibili entità gestionali iniziali: - `companies` (profilo aziendale,
se di proprietà Node.js) - `vehicles` - `collaborators` - `customers`
(se necessario per normalizzare i clienti delle consegne) -
`deliveries` - `delivery_status_history` - `payments` o
`financial_transactions` (da decidere) - `notification_settings` -
`system_logs` - `mobile_access` - `telemetry_latest` -
`telemetry_history`

Le entità `users` e `licenses` appartengono al dominio Java, secondo la
separazione proposta.

## 11. Qualità, test e rilascio

-   [ ] Definire convenzioni API, versionamento e formato uniforme degli
    errori.
-   [ ] Documentare le API con OpenAPI/Swagger.
-   [ ] Implementare test unitari per servizi e validazioni.
-   [ ] Implementare test di integrazione per database e comunicazione
    tra servizi.
-   [ ] Testare esplicitamente l'isolamento tra due aziende differenti.
-   [ ] Testare permessi owner/employee e accesso mobile.
-   [ ] Testare scadenza, disdetta e revoca della licenza.
-   [ ] Implementare migrazioni e seed per ambienti di sviluppo.
-   [ ] Configurare ambienti separati (development, staging,
    production).
-   [ ] Configurare gestione dei segreti, backup e monitoraggio.
-   [ ] Preparare deploy e rollback dei tre servizi.

## Verifiche trasversali

- [ ] Documentare le API con OpenAPI/Swagger.
- [ ] Implementare test unitari, integrazione ed end-to-end.
- [ ] Verificare isolamento multi-tenant e autorizzazioni.
- [ ] Configurare ambienti, segreti, backup, monitoraggio, deploy e rollback.

## 13. Decisioni da confermare

-   [ ] **Identità aziendale:** definire se `companyId` viene creato dal
    servizio Java e come Node.js ottiene/verifica il contesto.
-   [ ] **Database:** decidere se Java e Node.js useranno la stessa
    istanza MySQL con schemi/utenze separati oppure database separati.
-   [ ] **Ruoli:** confermare permessi degli account dipendenti oltre al
    ruolo owner.
-   [ ] **Sessioni:** scegliere durata access token, refresh token,
    logout e revoca.
-   [ ] **Licenza:** definire stati, rinnovi, grace period, disdetta e
    revoca immediata.
-   [ ] **Dati aziendali:** confermare che il profilo aziendale sia
    gestito da Node.js e che Java esponga solo identità/licenza.
-   [ ] **Pagamenti:** chiarire se la sezione include entrate e uscite
    oppure solo le voci di pagamento descritte; definire la struttura
    contabile.
-   [ ] **Consegne:** chiarire se cliente e importo sono obbligatori e
    come si collegano alle entrate.
-   [ ] **Collaboratori/account:** confermare la relazione tra scheda
    collaboratore e account di accesso.
-   [ ] **Telemetria:** scegliere dispositivi/provider, protocollo,
    frequenza, unità e reverse-geocoding.
-   [ ] **AI:** scegliere provider/modello, limiti, policy privacy e
    insieme iniziale di domande supportate.
-   [ ] **Notifiche e backup:** scegliere provider e policy operative.

------------------------------------------------------------------------

**Principio guida:** il frontend non decide mai a quale azienda
appartengono i dati. L'identità autenticata determina il tenant; ogni
servizio applica autorizzazione e isolamento prima di restituire o
modificare informazioni.

## Attività finale

- [ ] Preparare un file JSON di configurazione per Postman, con variabili d'ambiente e dati di test, per verificare tutti gli endpoint del backend.
