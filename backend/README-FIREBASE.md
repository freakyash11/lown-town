# Firebase Setup for Lone Town

This guide will help you set up Firebase for the Lone Town application.

## Prerequisites

1. A Google account
2. Node.js and npm installed

## Steps to Set Up Firebase

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "Lone Town")
4. Follow the setup wizard (you can disable Google Analytics if you prefer)
5. Click "Create project"

### 2. Set Up Firestore Database

1. In the Firebase Console, go to your project
2. In the left sidebar, click "Firestore Database"
3. Click "Create database"
4. Choose "Start in test mode" (we'll update security rules later)
5. Choose a location for your database (pick one close to your users)
6. Click "Enable"

### 3. Get Firebase Configuration

1. In the Firebase Console, go to your project
2. Click the gear icon next to "Project Overview" and select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>) to add a web app
5. Register your app with a nickname (e.g., "Lone Town Web")
6. Click "Register app"
7. Copy the Firebase configuration object (it looks like this):

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID",
};
```

### 4. Update Environment Variables

1. Create a `.env` file in the backend directory if it doesn't exist
2. Add your Firebase configuration:

```
# Firebase Configuration
FIREBASE_API_KEY=YOUR_API_KEY
FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
FIREBASE_APP_ID=YOUR_APP_ID
FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 5. Initialize Firebase Collections

1. Run the setup script:

```bash
node setup-firebase.js
```

This script will create the necessary collections and indexes in your Firestore database.

### 6. Update Security Rules

1. In the Firebase Console, go to your project
2. In the left sidebar, click "Firestore Database"
3. Click the "Rules" tab
4. Update the rules to secure your database:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow create: if request.auth != null;
      allow update: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow delete: if request.auth != null && isAdmin();
    }

    // Matches collection
    match /matches/{matchId} {
      allow read: if request.auth != null && isUserInMatch(matchId);
      allow create: if request.auth != null;
      allow update: if request.auth != null && isUserInMatch(matchId);
      allow delete: if false; // No direct deletion allowed
    }

    // Messages collection
    match /messages/{messageId} {
      allow read: if request.auth != null && isUserInMessage(messageId);
      allow create: if request.auth != null && request.resource.data.sender == request.auth.uid;
      allow update: if request.auth != null && (
        resource.data.sender == request.auth.uid ||
        resource.data.recipient == request.auth.uid
      );
      allow delete: if false; // No direct deletion allowed
    }

    // Helper functions
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    function isUserInMatch(matchId) {
      let match = get(/databases/$(database)/documents/matches/$(matchId)).data;
      return match.user1 == request.auth.uid || match.user2 == request.auth.uid;
    }

    function isUserInMessage(messageId) {
      let message = get(/databases/$(database)/documents/messages/$(messageId)).data;
      return message.sender == request.auth.uid || message.recipient == request.auth.uid;
    }
  }
}
```

### 7. Start the Server

1. Run the server:

```bash
npm start
```

## Troubleshooting

- If you encounter CORS issues, make sure your Firebase project has the correct domain listed in the Authentication > Sign-in method > Authorized domains section.
- If you see permission errors, check your security rules and make sure you're authenticated properly.
- For any other issues, check the Firebase documentation or contact support.
