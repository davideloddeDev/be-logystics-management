const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');
const config = require('./env');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Logystics Management — Backend API (Node.js)',
    version: '1.0.0',
    description: 'API gestionali, operative, dashboard e telemetria per il gestionale Logystics Management. Multi-tenant su base companyId.'
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Server di Sviluppo Locale'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Inserisci il token JWT rilasciato dal servizio di autenticazione'
      },
      internalServiceToken: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Internal-Token',
        description: 'Token segreto per comunicazioni sicure tra microservizi interni'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Descrizione dell\'errore' },
          details: { type: 'array', items: { type: 'object' } }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: [path.join(__dirname, '../routes/*.routes.js')]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
