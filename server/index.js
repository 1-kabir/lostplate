const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const matchRouter = require('./routes/match');
const claimsRouter = require('./routes/claims');
const geocodeRouter = require('./routes/geocode');
const impactRouter = require('./routes/impact');
const notifyRouter = require('./routes/notify');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS and request logging
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Bind routes
app.use('/api/match', matchRouter);
app.use('/api/claims', claimsRouter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/impact', impactRouter);
app.use('/api/notify', notifyRouter);

// Railway Health Check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Lost Plate API Engine',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Start Server listener
app.listen(PORT, () => {
  console.log(`🚀 Lost Plate server listening on port ${PORT}`);
});
