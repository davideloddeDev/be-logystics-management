const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../../src/app');
const config = require('../../src/config/env');
const db = require('../../src/config/db');
const { COMPANY_1, generateToken, request } = require('../helpers');

describe('API Modules Functional Integration Tests', () => {
  after(async () => {
    await db.closePool();
  });
  const token = generateToken({ companyId: COMPANY_1, role: 'owner' });
  const authHeaders = { Authorization: `Bearer ${token}` };

  it('Health Check: /health ritorna stato ok', async () => {
    const res = await request(app, 'GET', '/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.service, 'be-logystics-management');
  });

  it('Dashboard: /api/dashboard/summary calcola KPI corretti', async () => {
    const res = await request(app, 'GET', '/api/dashboard/summary', { headers: authHeaders });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.overview !== undefined);
    assert.ok(typeof res.body.data.overview.monthlyDeliveries === 'number');
    assert.ok(Array.isArray(res.body.data.recentDeliveries));
    assert.ok(Array.isArray(res.body.data.deliveriesByStatus));
  });

  it('Collaboratori: CRUD /api/collaborators crea e recupera collaboratore', async () => {
    const newCollab = {
      first_name: 'Mario',
      last_name: 'Rossi',
      email: `mario.rossi.${Date.now()}@example.com`,
      phone: '+39 333 1234567',
      role: 'autista',
      status: 'attivo',
      license_expiry_date: '2028-12-31'
    };

    // Creazione
    const createRes = await request(app, 'POST', '/api/collaborators', {
      headers: authHeaders,
      body: newCollab
    });
    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.success, true);
    const createdId = createRes.body.data.id;
    assert.ok(createdId);

    // Recupero Dettaglio
    const getRes = await request(app, 'GET', `/api/collaborators/${createdId}`, {
      headers: authHeaders
    });
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.id, createdId);
    assert.equal(getRes.body.data.first_name, 'Mario');

    // Modifica
    const updateRes = await request(app, 'PUT', `/api/collaborators/${createdId}`, {
      headers: authHeaders,
      body: { phone: '+39 333 9999999' }
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.phone, '+39 333 9999999');
  });

  it('Pagamenti: /api/payments e /summary registrano ed aggregano i pagamenti', async () => {
    const newPayment = {
      reference: 'Rifornimento Mezzo Test',
      amount: 150.50,
      type: 'mezzo',
      due_date: '2026-11-20',
      status: 'da pagare'
    };

    const postRes = await request(app, 'POST', '/api/payments', {
      headers: authHeaders,
      body: newPayment
    });
    assert.equal(postRes.status, 201);
    assert.equal(postRes.body.success, true);
    const paymentId = postRes.body.data.id;

    // Segna come pagato
    const payRes = await request(app, 'PATCH', `/api/payments/${paymentId}/pay`, {
      headers: authHeaders,
      body: { payment_method: 'carta' }
    });
    assert.equal(payRes.status, 200);
    assert.equal(payRes.body.data.status, 'pagato');

    // Verifica aggregati
    const summaryRes = await request(app, 'GET', '/api/payments/summary', {
      headers: authHeaders
    });
    assert.equal(summaryRes.status, 200);
    assert.ok(summaryRes.body.data.total_expenses !== undefined);
  });

  it('Telemetria Pro: /api/telemetry/ingest accetta coordinate e /latest le mostra', async () => {
    const ingestData = {
      vehicle_id: 'v0000000-0000-0000-0000-000000000001',
      latitude: 45.4642,
      longitude: 9.1900,
      speed: 55.4,
      engine_status: 'acceso'
    };

    const ingestRes = await request(app, 'POST', '/api/telemetry/ingest', {
      headers: authHeaders,
      body: ingestData
    });
    assert.equal(ingestRes.status, 201);
    assert.equal(ingestRes.body.success, true);

    const latestRes = await request(app, 'GET', '/api/telemetry/vehicles/latest', {
      headers: authHeaders
    });
    assert.equal(latestRes.status, 200);
    assert.ok(Array.isArray(latestRes.body.data));
  });

  it('Internal API: protetta da X-Internal-Token', async () => {
    // Senza token -> 403
    const forbiddenRes = await request(app, 'GET', `/api/internal/companies/${COMPANY_1}/stats`);
    assert.equal(forbiddenRes.status, 403);

    // Con token corretto -> 200
    const okRes = await request(app, 'GET', `/api/internal/companies/${COMPANY_1}/stats`, {
      headers: { 'X-Internal-Token': config.services.internalToken }
    });
    assert.equal(okRes.status, 200);
    assert.equal(okRes.body.success, true);
    assert.equal(okRes.body.company.id, COMPANY_1);
    assert.ok(okRes.body.stats !== undefined);
  });
});
