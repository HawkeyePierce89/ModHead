import express, { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3333;

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// API endpoint that returns received headers
app.get('/api/test', (req: Request, res: Response) => {
  const headers = req.headers;

  console.log('=== Received Request ===');
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('======================');

  res.json({
    success: true,
    headers: headers,
    customHeaders: {
      'x-custom-header': headers['x-custom-header'] || null,
      'x-test-header': headers['x-test-header'] || null,
      'x-modified-header': headers['x-modified-header'] || null,
      'x-auth': headers['x-auth'] || null,
      'x-combined': headers['x-combined'] || null,
      'x-undefined': headers['x-undefined'] || null,
      'x-empty': headers['x-empty'] || null,
    }
  });
});

// Serve static test page
app.get('/test-page.html', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../fixtures/test-page.html'));
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`Test page: http://localhost:${PORT}/test-page.html`);
  console.log(`API endpoint: http://localhost:${PORT}/api/test`);
});

// Handle shutdown gracefully
process.on('SIGTERM', (_signal) => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', (_signal) => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default server;
