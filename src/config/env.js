require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'logystics_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecret_jwt_key_for_logystics_management_2026!',
    issuer: process.env.JWT_ISSUER || 'logystics-auth-service',
    audience: process.env.JWT_AUDIENCE || 'logystics-main-api'
  },
  services: {
    javaAuthUrl: process.env.JAVA_AUTH_SERVICE_URL || 'http://localhost:8080/api',
    pythonAiUrl: process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000/api',
    internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'internal_secret_token_12345'
  }
};

