const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middlewares/error.middleware');

// Import routes
const vehiclesRoutes = require('./routes/vehicles.routes');
const collaboratorsRoutes = require('./routes/collaborators.routes');
const deliveriesRoutes = require('./routes/deliveries.routes');
const paymentsRoutes = require('./routes/payments.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const settingsRoutes = require('./routes/settings.routes');
const telemetryRoutes = require('./routes/telemetry.routes');
const internalRoutes = require('./routes/internal.routes');

const app = express();

// Global Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'be-logystics-management'
  });
});

// Mount Module Routes
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/collaborators', collaboratorsRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/internal', internalRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint non trovato: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
