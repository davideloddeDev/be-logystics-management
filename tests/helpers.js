const jwt = require('jsonwebtoken');
const config = require('../src/config/env');

const COMPANY_1 = 'c0000000-0000-0000-0000-000000000001';
const COMPANY_2 = 'c0000000-0000-0000-0000-000000000002';

function generateToken(payload = {}) {
  const defaultPayload = {
    userId: 'u0000000-0000-0000-0000-000000000001',
    companyId: COMPANY_1,
    role: 'owner',
    licenseType: 'pro',
    email: 'test@logystics.com'
  };
  return jwt.sign({ ...defaultPayload, ...payload }, config.jwt.secret, { expiresIn: '1h' });
}

async function request(app, method, url, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      const fullUrl = `http://127.0.0.1:${port}${url}`;

      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (body) {
        options.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      fetch(fullUrl, options)
        .then(async (res) => {
          const contentType = res.headers.get('content-type') || '';
          let data;
          if (contentType.includes('application/json')) {
            data = await res.json();
          } else {
            data = await res.text();
          }
          server.close(() => {
            resolve({
              status: res.status,
              headers: res.headers,
              body: data
            });
          });
        })
        .catch((err) => {
          server.close(() => reject(err));
        });
    });
  });
}

module.exports = {
  COMPANY_1,
  COMPANY_2,
  generateToken,
  request
};
