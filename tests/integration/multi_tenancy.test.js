const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../../src/app');
const db = require('../../src/config/db');
const { COMPANY_1, COMPANY_2, generateToken, request } = require('../helpers');

describe('Multi-Tenancy & Authorization Integration Tests', () => {
  after(async () => {
    await db.closePool();
  });
  it('dovrebbe respingere richieste senza header Authorization (401)', async () => {
    const res = await request(app, 'GET', '/api/vehicles');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('dovrebbe respingere token con firma non valida (401)', async () => {
    const res = await request(app, 'GET', '/api/vehicles', {
      headers: { Authorization: 'Bearer invalid.token.here' }
    });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('dovrebbe isolare le risorse Mezzi tra tenant diversi (Company 1 vs Company 2)', async () => {
    const token1 = generateToken({ companyId: COMPANY_1 });
    const token2 = generateToken({ companyId: COMPANY_2 });

    const res1 = await request(app, 'GET', '/api/vehicles', {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(res1.status, 200);
    assert.equal(res1.body.success, true);
    assert.ok(Array.isArray(res1.body.data));
    assert.ok(res1.body.data.length > 0);

    const vehicleFromCompany1 = res1.body.data[0];

    // Company 2 cerca di accedere allo stesso ID
    const res2 = await request(app, 'GET', `/api/vehicles/${vehicleFromCompany1.id}`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    // Deve ritornare 404 per evitare enumerazione dati
    assert.equal(res2.status, 404);
  });

  it('dovrebbe isolare le risorse Consegne tra tenant diversi', async () => {
    const token1 = generateToken({ companyId: COMPANY_1 });
    const token2 = generateToken({ companyId: COMPANY_2 });

    const res1 = await request(app, 'GET', '/api/deliveries', {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(res1.status, 200);
    assert.equal(res1.body.success, true);

    if (res1.body.data.length > 0) {
      const deliveryId = res1.body.data[0].id;
      const res2 = await request(app, 'GET', `/api/deliveries/${deliveryId}`, {
        headers: { Authorization: `Bearer ${token2}` }
      });
      assert.equal(res2.status, 404);
    }
  });

  it('dovrebbe applicare il controllo di ruolo (solo owner per rotte protette)', async () => {
    const employeeToken = generateToken({ companyId: COMPANY_1, role: 'driver' });
    const res = await request(app, 'POST', '/api/settings/mobile-access/dummy-id/toggle', {
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: { enabled: true }
    });
    // Solo owner può abilitare/disabilitare accesso mobile
    assert.equal(res.status, 403);
  });
});
