const cors = require('cors');

// CORS middleware with specific options for critical routes
const corsWithOptions = cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000', 
    'http://localhost:3001',
    'https://lown-town.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
});

// Preflight CORS handler for OPTIONS requests
const handlePreflight = (req, res, next) => {
  // Handle OPTIONS method
  if (req.method === 'OPTIONS') {
    // Set the specific origin instead of wildcard to allow credentials
    const origin = req.headers.origin;
    if (origin === 'https://lown-town.vercel.app' || 
        origin === 'http://localhost:3000' || 
        origin === 'http://localhost:3001') {
      res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
    return res.status(204).end();
  }
  next();
};

module.exports = { corsWithOptions, handlePreflight }; 