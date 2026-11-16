const app = require('./app');
const config = require('./config/env');

const server = app.listen(config.port, () => {
  console.log(`[Logystics Backend] Servizio avviato con successo su porta ${config.port}`);
  console.log(`[Swagger Docs] Documentazione disponibile su http://localhost:${config.port}/api-docs`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[Logystics Backend] Ricevuto segnale SIGTERM, arresto ordinato...');
  server.close(() => {
    console.log('[Logystics Backend] Server terminato.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Logystics Backend] Ricevuto segnale SIGINT, arresto ordinato...');
  server.close(() => {
    console.log('[Logystics Backend] Server terminato.');
    process.exit(0);
  });
});
