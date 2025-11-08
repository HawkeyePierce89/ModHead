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

// OAuth/Token simulation endpoints for auto-refresh tests

// Simple token endpoint - returns access_token directly
app.get('/auth/token-simple', (_req: Request, res: Response) => {
  console.log('=== Token Simple Request ===');
  res.json({
    access_token: 'simple_token_' + Date.now(),
    expires_in: 3600
  });
});

// Nested token endpoint - returns token in nested structure
app.get('/auth/token-nested', (_req: Request, res: Response) => {
  console.log('=== Token Nested Request ===');
  res.json({
    data: {
      token: 'nested_token_' + Date.now(),
      user_id: '12345'
    }
  });
});

// Bearer token endpoint - returns token_type and access_token
app.get('/auth/token-bearer', (_req: Request, res: Response) => {
  console.log('=== Token Bearer Request ===');
  res.json({
    token_type: 'Bearer',
    access_token: 'bearer_token_' + Date.now(),
    expires_in: 7200
  });
});

// POST token endpoint - accepts credentials and returns token
app.post('/auth/token-post', express.json(), (req: Request, res: Response) => {
  console.log('=== Token POST Request ===');
  console.log('Body:', req.body);

  const { username, password } = req.body;

  if (username && password) {
    res.json({
      token_type: 'Bearer',
      access_token: 'post_token_' + Date.now(),
      refresh_token: 'refresh_' + Date.now(),
      expires_in: 3600
    });
  } else {
    res.status(400).json({ error: 'Missing credentials' });
  }
});

// URL-encoded token endpoint
app.post('/auth/token-urlencoded', express.urlencoded({ extended: true }), (req: Request, res: Response) => {
  console.log('=== Token URL-encoded Request ===');
  console.log('Body:', req.body);

  res.json({
    access_token: 'urlencoded_token_' + Date.now(),
    token_type: 'Bearer'
  });
});

// Error endpoint - returns 401
app.get('/auth/token-error', (_req: Request, res: Response) => {
  console.log('=== Token Error Request ===');
  res.status(401).json({
    error: 'unauthorized',
    error_description: 'Invalid credentials'
  });
});

// Token endpoint with header validation
app.get('/auth/token-with-headers', (req: Request, res: Response) => {
  console.log('=== Token With Headers Request ===');
  console.log('Headers:', req.headers);

  const apiKey = req.headers['x-api-key'];

  if (apiKey) {
    res.json({
      access_token: 'header_validated_token_' + Date.now(),
      api_key_received: apiKey
    });
  } else {
    res.status(403).json({ error: 'Missing API key' });
  }
});

// Complex nested response for multiple field extraction
app.get('/auth/token-complex', (_req: Request, res: Response) => {
  console.log('=== Token Complex Request ===');
  res.json({
    data: {
      access_token: 'complex_token_' + Date.now(),
      expires_in: 3600,
      refresh_token: 'refresh_complex_' + Date.now()
    },
    meta: {
      issued_at: Date.now(),
      scope: 'read write'
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
