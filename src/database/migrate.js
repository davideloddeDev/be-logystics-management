const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config/env');

async function migrate() {
  console.log(`[Migrate] Connessione a MySQL (${config.db.host}:${config.db.port})...`);
  
  // Connessione temporanea per assicurarsi che il database esista
  const initConn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password
  });

  await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  console.log(`[Migrate] Database '${config.db.database}' pronto o già esistente.`);
  await initConn.end();

  // Connessione al database effettivo
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true
  });

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('[Migrate] Applicazione schema DDL...');
  await connection.query(schemaSql);
  console.log('[Migrate] Tabelle create con successo!');

  await connection.end();
}

if (require.main === module) {
  migrate()
    .then(() => {
      console.log('[Migrate] Migrazione completata.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migrate] Errore durante la migrazione:', err);
      process.exit(1);
    });
}

module.exports = migrate;
