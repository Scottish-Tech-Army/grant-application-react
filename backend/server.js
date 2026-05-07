const express = require('express');
const cors = require('cors');
const { initialize } = require('./db/setup');
const { authenticateToken } = require('./middleware/auth');

const authRouter          = require('./routes/auth');
const fieldGroupsRouter   = require('./routes/fieldGroups');
const commonFieldsRouter  = require('./routes/commonFields');
const applicationsRouter  = require('./routes/applications');

const app = express();
const PORT = 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '2mb' }));

// Public routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/auth', authRouter);

// Protected routes — require valid JWT
app.use('/api/field-groups',  authenticateToken, fieldGroupsRouter);
app.use('/api/common-fields', authenticateToken, commonFieldsRouter);
app.use('/api/applications',  authenticateToken, applicationsRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Initialise DB then start server
initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n  FundSight API  →  http://localhost:${PORT}`);
      console.log(`  Health check   →  http://localhost:${PORT}/api/health\n`);
    });
  })
  .catch((err) => {
    console.error('[Fatal] Failed to initialise database:', err);
    process.exit(1);
  });
