const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin SDK
let firebaseAdmin;

// Check if running in a production environment with service account
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Use service account from environment variable (JSON string)
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  // For development, initialize without credentials (uses Google Application Default Credentials)
  firebaseAdmin = admin.initializeApp({
    projectId: 'litamor-8ce39'
  });
}

const adminAuth = admin.auth();
const adminFirestore = admin.firestore();

module.exports = { admin, adminAuth, adminFirestore }; 