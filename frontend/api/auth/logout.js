const { setCorsHeaders, handlePreflight, verifyAuthToken } = require('../utils/firebase');

module.exports = async (req, res) => {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle OPTIONS request (preflight)
  if (handlePreflight(req, res)) {
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify Firebase ID token
    await verifyAuthToken(req);
    
    // Firebase doesn't have a server-side logout mechanism
    // The client should remove the token from storage
    
    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 