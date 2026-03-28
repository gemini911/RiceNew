require('dotenv').config();
const express = require('express');
const path = require('path');
const apiApp = require('./api/data.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// Enable CORS for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin === 'http://localhost:3000') {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Additional logging for debugging
app.use('/api/data', (req, res, next) => {
  console.log(`API Data Route Hit: ${req.method} ${req.url}`);
  next();
});

// Mount the API routes (this should be after static files but before the catch-all route)
app.use('/api/data', apiApp);

// For all GET requests EXCEPT API routes, send back index.html so that PathRouter can handle routing
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});