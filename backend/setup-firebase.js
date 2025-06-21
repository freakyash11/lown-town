const { db } = require('./config/firebase');
const { collection, doc, setDoc, getDocs } = require('firebase/firestore');

// Function to set up Firebase collections and indexes
const setupFirebase = async () => {
  try {
    console.log('Setting up Firebase collections and indexes...');
    
    // Check if users collection exists
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    if (usersSnapshot.empty) {
      console.log('Creating sample user...');
      
      // Create a sample admin user
      await setDoc(doc(usersRef, 'admin'), {
        email: 'admin@lonetown.com',
        name: 'Admin',
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Sample user created successfully');
    } else {
      console.log(`Users collection already exists with ${usersSnapshot.size} documents`);
    }
    
    // Check if matches collection exists
    const matchesRef = collection(db, 'matches');
    const matchesSnapshot = await getDocs(matchesRef);
    
    console.log(`Matches collection has ${matchesSnapshot.size} documents`);
    
    // Check if messages collection exists
    const messagesRef = collection(db, 'messages');
    const messagesSnapshot = await getDocs(messagesRef);
    
    console.log(`Messages collection has ${messagesSnapshot.size} documents`);
    
    console.log('Firebase setup completed successfully');
    
  } catch (error) {
    console.error('Error setting up Firebase:', error);
  }
};

// Run the setup
setupFirebase().then(() => {
  console.log('Setup script completed');
  process.exit(0);
}).catch(err => {
  console.error('Setup script failed:', err);
  process.exit(1);
}); 