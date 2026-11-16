# Backend principale — Node.js + MySQL

# logystics-management -- Piano di sviluppo backend Node.js

> Documento di specifica, architettura, API e task di sviluppo del Backend principale Node.js + MySQL.

---

## 1. Obiettivo e perimetro del servizio Node.js

Il backend principale in **Node.js + MySQL** è il core gestionale ed operativo dell'ecosistema Logystics Management. Serve sia il frontend web che l'app mobile Flutter (autisti) e fornisce endpoint controllati per i servizi collegati.

### Responsabilità esclusive del backend Node.js:
- **Gestione dati operativi (CRUD)**: Mezzi, collaboratori, consegne, pagamenti.
- **Dati aziendali e impostazioni**: Profilo aziendale, preferenze notifiche, log di sistema.
- **Dashboard & Analitiche**: Calcolo e aggregazione statistiche operative e finanziarie in tempo reale.
- **Gestione accessi app mobile**: Abilitazione e revoca accesso mobile per autisti.
- **Telemetria Pro**: Ingestione dati telemetrici, ultimo stato noto dei mezzi e storico tracciamento.
- **Documentazione interattiva API**: Esposizione OpenAPI / Swagger su `/api-docs`.
- **Garanzia Multi-tenancy**: Isolamento assoluto dei dati per `companyId`.

*Nota di perimetro:* L'autenticazione delle credenziali utente e la gestione contrattuale delle licenze risiedono nel microservizio dedicato. Node.js riceve il JWT validato e applica le autorizzazioni di dominio.

---

## 2. Sicurezza, autenticazione e multi-tenancy

### 2.1 Verifica del token e contesto tenant
Tutte le richieste verso le API gestionali devono includere l'header di autorizzazione:
```http
Authorization: Bearer <access_token>
```

Il middleware di autenticazione (`authenticate`) estrae e valida il token, popolando l'oggetto di contesto `req.user`:
- `userId`: identificativo univoco dell'utente
- `companyId`: identificativo univoco dell'azienda (tenant)
- `role`: ruolo (`owner`, `employee`, `driver`, ecc.)
- `licenseId`: identificativo della licenza attiva
- `licenseType`: tipo di licenza (es. `standard`, `pro`)

### 2.2 Regole rigide di autorizzazione e isolamento
1. **Filtro `companyId` obbligatorio**: Nessuna query SQL di lettura, scrittura, modifica o cancellazione può operare senza la clausola esplicita `WHERE company_id = ?`.
2. **Origine sicura del `companyId`**: Il valore di `companyId` proviene unicamente dal token verificato (`req.user.companyId`), mai dai parametri URL, query string o body della richiesta.
3. **Controllo dei ruoli (`authorize`)**:
   - `owner`: accesso completo, gestione impostazioni aziendali, abilitazione accessi mobile.
   - `employee`: accesso limitato alle operazioni consentite dal proprio profilo.
4. **Protezione contro l'enumerazione**: Se una risorsa richiesta appartiene a un'altra azienda o non esiste, la risposta restituita deve essere sempre `404 Not Found`.

---

## 3. Struttura del progetto e convenzioni di codice

Il codice segue l'architettura a livelli (Routes -> Controllers -> Services -> Repositories):

```text
src/
  config/
    env.js               # Caricamento variabili d'ambiente
    db.js                # Pool MySQL2 e gestione transazioni
    swagger.js           # Configurazione OpenAPI / Swagger
  middlewares/
    auth.middleware.js   # Verifica JWT e iniezione req.user
    role.middleware.js   # Controllo ruoli (owner, employee)
    validate.middleware.js # Validazione express-validator
    error.middleware.js  # Gestore globale degli errori HTTP
  routes/
    vehicles.routes.js
    collaborators.routes.js
    deliveries.routes.js
    payments.routes.js
    dashboard.routes.js
    settings.routes.js
    telemetry.routes.js
    internal.routes.js
  controllers/
    vehicles.controller.js
    collaborators.controller.js
    deliveries.controller.js
    payments.controller.js
    dashboard.controller.js
    settings.controller.js
    telemetry.controller.js
    internal.controller.js
  services/
    vehicles.service.js
    collaborators.service.js
    deliveries.service.js
    payments.service.js
    dashboard.service.js
    settings.service.js
    telemetry.service.js
  repositories/
    vehicles.repository.js
    collaborators.repository.js
    deliveries.repository.js
    payments.repository.js
    dashboard.repository.js
    settings.repository.js
    telemetry.repository.js
  database/
    schema.sql           # DDL creazione tabelle, vincoli e indici
    migrate.js           # Script di migrazione automatica
    seed.js              # Script di popolamento dati mock/test
  app.js                 # Setup Express, middleware globali e mount rotte
  server.js              # Avvio server HTTP
```

### Regole per file Route e Controller:
- **`*.routes.js`**: Dichiara gli endpoint HTTP, associa i middleware (auth, ruoli, validatori), punta al metodo del controller e contiene i commenti JSDoc `@swagger` per la documentazione OpenAPI. Nessuna logica di business o SQL deve risiedere nelle route.
- **`*.controller.js`**: Gestisce `req` e `res`, estrae parametri, invoca il Service appropriato e mappa le risposte con codici di stato HTTP corretti (`200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `500`).

---

## 4. API gestionali ed operative

Tutti gli endpoint applicano automaticamente il filtro per `companyId`.

### 4.1 Mezzi (`/api/vehicles`)
- `GET /api/vehicles`: elenco mezzi con paginazione e filtri (`status`, `type`, `insurance_expiring`).
- `GET /api/vehicles/:id`: dettaglio mezzo.
- `POST /api/vehicles`: creazione mezzo con validazione targa e campi obbligatori.
- `PUT /api/vehicles/:id`: aggiornamento dati, chilometraggio e date assicurazione/manutenzione.
- `DELETE /api/vehicles/:id`: eliminazione o disattivazione mezzo.

### 4.2 Collaboratori (`/api/collaborators`)
- `GET /api/collaborators`: elenco con filtri per ruolo (`driver`, `warehouse`, `logistics_manager`, `admin`) e stato (`active`, `sick_leave`, `terminated`).
- `GET /api/collaborators/:id`: scheda collaboratore.
- `POST /api/collaborators`: registrazione collaboratore con scadenze patente e recapiti.
- `PUT /api/collaborators/:id`: modifica dati e recapiti.
- `DELETE /api/collaborators/:id`: disattivazione collaboratore.

### 4.3 Consegne (`/api/deliveries`)
- `GET /api/deliveries`: elenco consegne con filtri (`status`, `driver_id`, `vehicle_id`, `customer`, intervallo date).
- `GET /api/deliveries/:id`: dettaglio consegna completo di cronologia cambi stato.
- `POST /api/deliveries`: creazione nuova consegna con codice univoco, assegnazione mezzo e autista.
- `PUT /api/deliveries/:id`: aggiornamento consegna.
- `PATCH /api/deliveries/:id/status`: avanzamento stato (`pending` -> `in_transit` -> `delivered` / `cancelled`) con tracciamento automatico nello storico `delivery_status_history`.
- `DELETE /api/deliveries/:id`: cancellazione consegna (se consentita dallo stato).

### 4.4 Pagamenti (`/api/payments`)
- `GET /api/payments`: elenco voci con filtri per tipologia (`salary`, `vehicle`, `equipment`), stato (`pending`, `paid`) e periodo.
- `GET /api/payments/summary`: totali finanziari aggregati (totale dovuto, pagato, residuo).
- `GET /api/payments/:id`: dettaglio voce di pagamento.
- `POST /api/payments`: registrazione nuova voce (importi con precisione `DECIMAL(10,2)`).
- `PUT /api/payments/:id`: aggiornamento voce.
- `PATCH /api/payments/:id/pay`: marcatura della voce come pagata con data e metodo di pagamento.
- `DELETE /api/payments/:id`: eliminazione voce.

### 4.5 Dashboard aggregata (`/api/dashboard`)
Un unico endpoint ottimizzato per il frontend web con query aggregate ad alte prestazioni:
- `GET /api/dashboard/summary`:
  - Contatori mensili: consegne effettuate, mezzi attivi, collaboratori in servizio, fatturato/entrate.
  - Serie temporale entrate e consegne dell'ultima settimana.
  - Ultime 5 consegne recenti.
  - Ripartizione consegne per stato.
  - Mezzi più utilizzati (per km o consegne).
  - Distribuzione pagamenti/incassi per metodo.

### 4.6 Impostazioni aziendali (`/api/settings`)
- `GET /api/settings/profile`: consultazione dati anagrafici azienda (ragione sociale, P.IVA, indirizzo, email, telefono).
- `PUT /api/settings/profile`: aggiornamento dati anagrafici aziendali.
- `GET /api/settings/notifications` & `PUT /api/settings/notifications`: preferenze notifiche email/SMS ed eventi abilitati.
- `GET /api/settings/mobile-access`: lista collaboratori abilitati all'uso dell'app mobile autisti.
- `POST /api/settings/mobile-access/:collaboratorId/toggle`: abilitazione o revoca immediata accesso all'app Flutter.
- `GET /api/settings/system-logs`: consultazione log delle operazioni di sistema aziendali.

### 4.7 Telemetria Pro (`/api/telemetry`)
Riservata ad aziende con licenza idonea:
- `POST /api/telemetry/ingest`: ingestione coordinate GPS, velocità, stato motore, carico vano, temperatura vano, tara e livello carburante/batteria.
- `GET /api/telemetry/vehicles/latest`: vista in tempo reale dell'ultima posizione e telemetria nota per tutti i mezzi della flotta, con indicatore di stato online/offline (stale data).
- `GET /api/telemetry/vehicles/:vehicleId/history`: tracciato storico delle coordinate e parametri per intervallo temporale.

### 4.8 API Interne per Servizi Collegati (`/api/internal`)
Endpoint protetti da token di servizio condiviso (`X-Internal-Token`) per consentire consultazioni controllate di contesto:
- `GET /api/internal/companies/:companyId/stats`: statistiche operative di riepilogo.
- `GET /api/internal/companies/:companyId/query`: endpoint di consultazione semantica controllata per il servizio AI.

---

## 5. Modello del Database MySQL

Tutte le tabelle utilizzano `InnoDB`, codifica `utf8mb4_unicode_ci` e vincolo di foreign key su `company_id`. Gli importi monetari sono rigorosamente definiti come `DECIMAL(10,2)`.

### Tabelle gestite da Node.js:
1. `companies`: dati anagrafici del profilo aziendale gestito da Node.js.
2. `vehicles`: anagrafica parco mezzi, chilometri, dati assicurativi e manutenzione.
3. `collaborators`: dipendenti e collaboratori aziendali, ruoli, scadenze patenti.
4. `deliveries`: consegne con riferimenti relazionali a mezzi e autisti.
5. `delivery_status_history`: tracciamento di ogni transizione di stato della consegna (audit trail).
6. `payments`: voci di costo e finanziarie aziendali (`DECIMAL(10,2)`).
7. `company_settings`: preferenze di notifica, backup e configurazioni operative.
8. `driver_mobile_access`: tabella delle abilitazioni per l'app mobile Flutter.
9. `telemetry_latest`: ultimo stato telemetrico noto per ogni mezzo (chiave primaria `vehicle_id`).
10. `telemetry_history`: serie storica dei rilievi telemetrici e posizioni GPS.
11. `system_logs`: registro eventi operativi e audit trail per azienda.

---

## 6. Documentazione OpenAPI / Swagger

- La documentazione interattiva è accessibile all'endpoint `/api-docs`.
- Configurazione centralizzata in `src/config/swagger.js`.
- Supporto allo schema di sicurezza HTTP `bearerAuth`.
- Ogni route espone il contratto OpenAPI con parametri, schema del body, risposte di successo ed errori (`400`, `401`, `403`, `404`, `500`).

---

## 7. Task di sviluppo del Backend Node.js

- [x] **Setup & Configurazione**: Inizializzazione progetto, configurazione Express, Helmet, Cors, logger e gestione variabili d'ambiente.
- [x] **Database & Migrazioni**: Connessione MySQL tramite pool, script DDL `schema.sql`, migratore e seeder con dati realistici.
- [x] **Middleware di Base**:
  - [x] Middleware di autenticazione e validazione JWT (`authenticate`).
  - [x] Middleware di autorizzazione ruoli (`authorize`).
  - [x] Middleware per validazione input con `express-validator`.
  - [x] Middleware globale di gestione errori e formattazione standard.
- [x] **Documentazione Swagger**: Configurazione `swagger-ui-express` e `swagger-jsdoc` montata su `/api-docs`.
- [x] **Implementazione Modulo Mezzi (`/api/vehicles`)**: Route, Controller, Service e Repository.
- [x] **Implementazione Modulo Collaboratori (`/api/collaborators`)**: Route, Controller, Service e Repository.
- [x] **Implementazione Modulo Consegne (`/api/deliveries`)**: Route, Controller, Service, Repository e storico stati.
- [x] **Implementazione Modulo Pagamenti (`/api/payments`)**: Route, Controller, Service, Repository e aggregati.
- [x] **Implementazione Modulo Dashboard (`/api/dashboard`)**: Query aggregate ad alte prestazioni per KPI, grafici e riepiloghi.
- [x] **Implementazione Modulo Impostazioni (`/api/settings`)**: Profilo, notifiche, log e gestione accessi app mobile.
- [x] **Implementazione Modulo Telemetria Pro (`/api/telemetry`)**: Ingestione, stato real-time e storico posizioni.
- [x] **Implementazione Endpoint Interni (`/api/internal`)**: API per consultazioni controllate da servizi partner.
- [ ] **Test Automatici**: Test unitari e di integrazione per isolamento multi-tenant e logiche di business.
- [ ] **Collezione Postman**: File JSON esportato con variabili d'ambiente, token e richieste di test per tutti gli endpoint.
