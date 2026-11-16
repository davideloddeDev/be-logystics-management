const mysql = require('mysql2/promise');
const config = require('../config/env');

const COMPANY_ID_1 = 'c0000000-0000-0000-0000-000000000001';
const COMPANY_ID_2 = 'c0000000-0000-0000-0000-000000000002';

async function seed() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database
  });

  console.log('[Seed] Popolamento dati di test...');

  // 1. Aziende
  await connection.query(`
    INSERT INTO companies (id, business_name, vat_number, address, email, phone)
    VALUES 
      (?, 'Logistica Express Milano S.r.l.', 'IT12345678901', 'Via Montenapoleone 1, Milano (MI)', 'info@logisticaexpress.it', '+39 02 1234567'),
      (?, 'Roma Fast Freight S.p.A.', 'IT98765432109', 'Via Condotti 10, Roma (RM)', 'contact@fastfreight.it', '+39 06 7654321')
    ON DUPLICATE KEY UPDATE business_name=VALUES(business_name);
  `, [COMPANY_ID_1, COMPANY_ID_2]);

  // 2. Impostazioni aziendali
  await connection.query(`
    INSERT INTO company_settings (company_id, email_notifications, sms_notifications, notification_events, maintenance_mode, two_factor_required)
    VALUES
      (?, true, false, '["delivery_completed", "delivery_delayed", "maintenance_due"]', false, true),
      (?, true, true, '["delivery_completed"]', false, false)
    ON DUPLICATE KEY UPDATE email_notifications=VALUES(email_notifications);
  `, [COMPANY_ID_1, COMPANY_ID_2]);

  // 3. Mezzi
  const VEHICLE_1 = 'v0000000-0000-0000-0000-000000000001';
  const VEHICLE_2 = 'v0000000-0000-0000-0000-000000000002';
  const VEHICLE_3 = 'v0000000-0000-0000-0000-000000000003';
  await connection.query(`
    INSERT INTO vehicles (id, company_id, plate, model, type, status, mileage, last_maintenance_date, insurance_company, insurance_policy_number, insurance_expiry_date)
    VALUES
      (?, ?, 'AB123CD', 'Iveco Daily 35S16', 'furgone', 'attivo', 45200, '2026-08-15', 'Generali Assicurazioni', 'GEN-99281', '2027-04-30'),
      (?, ?, 'EF456GH', 'Fiat Ducato Maxi', 'furgone', 'attivo', 82100, '2026-06-10', 'Allianz', 'ALZ-33211', '2026-12-31'),
      (?, ?, 'IJ789KL', 'Mercedes Actros 1845', 'camion', 'in manutenzione', 194000, '2026-10-01', 'UnipolSai', 'UNI-11094', '2027-01-15')
    ON DUPLICATE KEY UPDATE mileage=VALUES(mileage);
  `, [VEHICLE_1, COMPANY_ID_1, VEHICLE_2, COMPANY_ID_1, VEHICLE_3, COMPANY_ID_1]);

  // 4. Collaboratori
  const COLLAB_1 = 'u0000000-0000-0000-0000-000000000001';
  const COLLAB_2 = 'u0000000-0000-0000-0000-000000000002';
  const COLLAB_3 = 'u0000000-0000-0000-0000-000000000003';
  await connection.query(`
    INSERT INTO collaborators (id, company_id, first_name, last_name, role, phone, email, status, hiring_date, license_expiry_date)
    VALUES
      (?, ?, 'Mario', 'Rossi', 'autista', '+39 340 1122334', 'mario.rossi@logisticaexpress.it', 'attivo', '2023-01-10', '2028-05-20'),
      (?, ?, 'Luigi', 'Verdi', 'autista', '+39 349 9988776', 'luigi.verdi@logisticaexpress.it', 'attivo', '2024-03-01', '2027-11-10'),
      (?, ?, 'Anna', 'Bianchi', 'responsabile logistica', '+39 333 4455667', 'anna.bianchi@logisticaexpress.it', 'attivo', '2022-09-15', '2030-01-01')
    ON DUPLICATE KEY UPDATE status=VALUES(status);
  `, [COLLAB_1, COMPANY_ID_1, COLLAB_2, COMPANY_ID_1, COLLAB_3, COMPANY_ID_1]);

  // 5. Accesso mobile autisti
  await connection.query(`
    INSERT INTO driver_mobile_access (id, company_id, collaborator_id, is_enabled, last_login_at)
    VALUES
      ('m0000000-0000-0000-0000-000000000001', ?, ?, true, '2026-11-15 08:30:00'),
      ('m0000000-0000-0000-0000-000000000002', ?, ?, false, NULL)
    ON DUPLICATE KEY UPDATE is_enabled=VALUES(is_enabled);
  `, [COMPANY_ID_1, COLLAB_1, COMPANY_ID_1, COLLAB_2]);

  // 6. Consegne
  const DELIV_1 = 'd0000000-0000-0000-0000-000000000001';
  const DELIV_2 = 'd0000000-0000-0000-0000-000000000002';
  const DELIV_3 = 'd0000000-0000-0000-0000-000000000003';
  await connection.query(`
    INSERT INTO deliveries (id, company_id, code, customer, delivery_address, vehicle_id, driver_id, status, delivery_datetime, amount)
    VALUES
      (?, ?, 'DEL-2026-001', 'Acme S.p.A.', 'Corso Buenos Aires 45, Milano', ?, ?, 'consegnata', '2026-11-14 11:30:00', 350.00),
      (?, ?, 'DEL-2026-002', 'Barilla G. e R. Fratelli', 'Via Mantova 166, Parma', ?, ?, 'in transito', '2026-11-16 15:00:00', 780.50),
      (?, ?, 'DEL-2026-003', 'Ferrero Commerciale', 'Piazzale Pietro Ferrero 1, Alba', ?, ?, 'in attesa', '2026-11-17 09:30:00', 1250.00)
    ON DUPLICATE KEY UPDATE status=VALUES(status);
  `, [DELIV_1, COMPANY_ID_1, VEHICLE_1, COLLAB_1, DELIV_2, COMPANY_ID_1, VEHICLE_2, COLLAB_1, DELIV_3, COMPANY_ID_1, VEHICLE_1, COLLAB_2]);

  // 7. Storico stati consegne
  await connection.query(`
    INSERT INTO delivery_status_history (id, delivery_id, company_id, previous_status, new_status, changed_by_user_id, notes)
    VALUES
      ('h0000000-0000-0000-0000-000000000001', ?, ?, NULL, 'in attesa', 'owner-01', 'Creazione consegna'),
      ('h0000000-0000-0000-0000-000000000002', ?, ?, 'in attesa', 'in transito', 'owner-01', 'Partito dal magazzino centrale'),
      ('h0000000-0000-0000-0000-000000000003', ?, ?, 'in transito', 'consegnata', ?, 'Consegnato e firmato da Rossi');
  `, [DELIV_1, COMPANY_ID_1, DELIV_1, COMPANY_ID_1, DELIV_1, COMPANY_ID_1, COLLAB_1]);

  // 8. Pagamenti
  await connection.query(`
    INSERT INTO payments (id, company_id, type, reference, description, amount, status, payment_method, due_date, paid_at)
    VALUES
      ('p0000000-0000-0000-0000-000000000001', ?, 'stipendio', 'STIP-2026-10-MR', 'Stipendio Mario Rossi - Ottobre 2026', 1850.00, 'pagato', 'bonifico', '2026-11-05', '2026-11-05 10:00:00'),
      ('p0000000-0000-0000-0000-000000000002', ?, 'mezzo', 'RATE-IVECO-2026-11', 'Rata Leasing Iveco Daily AB123CD', 480.00, 'da pagare', NULL, '2026-11-25', NULL),
      ('p0000000-0000-0000-0000-000000000003', ?, 'attrezzatura', 'MANUT-TRANSPALLET', 'Manutenzione straordinaria transpallet elettrici', 320.00, 'pagato', 'carta', '2026-11-10', '2026-11-10 14:15:00'),
      ('p0000000-0000-0000-0000-000000000004', ?, 'entrata', 'FATT-2026-881', 'Incasso fattura Acme S.p.A. per trasporti ottobre', 4200.00, 'pagato', 'bonifico', '2026-11-12', '2026-11-12 09:30:00')
    ON DUPLICATE KEY UPDATE amount=VALUES(amount);
  `, [COMPANY_ID_1, COMPANY_ID_1, COMPANY_ID_1, COMPANY_ID_1]);

  // 9. Telemetria
  await connection.query(`
    INSERT INTO telemetry_latest (vehicle_id, company_id, latitude, longitude, address, speed, engine_status, available_load_kg, total_load_kg, tare_kg, compartment_temperature, estimated_autonomy_km, device_timestamp, received_at)
    VALUES
      (?, ?, 45.4642700, 9.1895100, 'Piazza del Duomo, Milano', 42.50, 'acceso', 850.00, 1500.00, 2000.00, 4.2, 430, NOW(), NOW()),
      (?, ?, 45.0703120, 7.6868565, 'Corso Francia, Torino', 0.00, 'spento', 1200.00, 1200.00, 2300.00, 6.0, 310, NOW() - INTERVAL 10 MINUTE, NOW())
    ON DUPLICATE KEY UPDATE speed=VALUES(speed), device_timestamp=VALUES(device_timestamp);
  `, [VEHICLE_1, COMPANY_ID_1, VEHICLE_2, COMPANY_ID_1]);

  await connection.query(`
    INSERT INTO telemetry_history (vehicle_id, company_id, latitude, longitude, address, speed, engine_status, compartment_temperature, device_timestamp)
    VALUES
      (?, ?, 45.4620000, 9.1850000, 'Via Torino, Milano', 38.00, 'acceso', 4.1, NOW() - INTERVAL 5 MINUTE),
      (?, ?, 45.4642700, 9.1895100, 'Piazza del Duomo, Milano', 42.50, 'acceso', 4.2, NOW())
  `, [VEHICLE_1, COMPANY_ID_1, VEHICLE_1, COMPANY_ID_1]);

  // 10. System logs
  await connection.query(`
    INSERT INTO system_logs (id, company_id, user_id, action, resource, details, ip_address)
    VALUES
      ('l0000000-0000-0000-0000-000000000001', ?, 'owner-01', 'CREATE', 'deliveries', '{"code":"DEL-2026-001","customer":"Acme S.p.A."}', '127.0.0.1'),
      ('l0000000-0000-0000-0000-000000000002', ?, 'owner-01', 'STATUS_CHANGE', 'deliveries', '{"delivery_id":"d0000000-0000-0000-0000-000000000001","new_status":"consegnata"}', '127.0.0.1')
  `, [COMPANY_ID_1, COMPANY_ID_1]);

  console.log('[Seed] Dati inseriti con successo!');
  await connection.end();
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('[Seed] Seeding completato.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Errore:', err);
      process.exit(1);
    });
}

module.exports = seed;
