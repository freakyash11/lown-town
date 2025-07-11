# Lone Town - Intelligent Matchmaking System

Lone Town is a mindful dating approach that fights swipe fatigue by providing just one carefully chosen match per day based on deep emotional, psychological, and behavioral compatibility.

## Project Overview

This project implements a sophisticated matchmaking system with the following features:

- **Deep Compatibility Algorithm**: Analyzes emotional intelligence, psychological traits, behavioral patterns, and relationship values
- **Exclusive Match Management**: Ensures users can only be matched with one person at a time
- **Complex State Engine**: Manages user states (matched, pinned, frozen, available) with automatic transitions
- **Intelligent Timer Systems**: Handles 24-hour freeze periods and 2-hour new match delays
- **Conversation Milestone Tracking**: Monitors message count (100 messages in 48 hours) for video call unlocks
- **Real-time Messaging**: WebSocket-based chat with message counting and timestamp tracking

## Tech Stack

- **Backend**: Node.js with Express.js and Socket.io
- **Database**: MongoDB
- **Frontend**: React.js

## How to Run the Project

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (local or cloud instance)

### Backend Setup

1. Navigate to the backend directory:

```
cd lone-town/backend
```

2. Install dependencies:

```
npm install
```

3. Create a `.env` file in the backend directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lone-town
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
```

4. Start the development server:

```
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:

```
cd lone-town/frontend
```

2. Install dependencies:

```
npm install
```

3. Create a `.env` file in the frontend directory with the following variables:

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

4. Start the development server:

```
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## Project Structure

### Backend

```
backend/
  ├── config/          # Configuration files
  ├── controllers/     # Request handlers
  ├── middlewares/     # Express middlewares
  ├── models/          # Mongoose models
  ├── routes/          # API routes
  ├── services/        # Business logic
  └── server.js        # Entry point
```

### Frontend

```
frontend/
  ├── public/          # Static files
  ├── src/
  │   ├── assets/      # Images, fonts, etc.
  │   ├── components/  # Reusable components
  │   ├── context/     # React context providers
  │   ├── pages/       # Page components
  │   ├── services/    # API services
  │   └── utils/       # Utility functions
  └── package.json
```

## Deep Compatibility Algorithm Documentation

The Lone Town compatibility algorithm calculates match suitability based on multiple dimensions of compatibility, using a combination of similarity and complementary matching approaches.

### Compatibility Factors

The algorithm analyzes six key dimensions:

1. **Personality Traits (25%)**: Based on the Big Five personality model

   - Openness (similarity matching)
   - Conscientiousness (similarity matching)
   - Extraversion (complementary matching)
   - Agreeableness (similarity matching)
   - Neuroticism (complementary matching)

2. **Emotional Intelligence (20%)**:

   - Self-awareness (similarity matching)
   - Empathy (similarity matching)
   - Social skills (similarity matching)
   - Emotional regulation (similarity matching)

3. **Relationship Values (25%)**:

   - Commitment (similarity matching)
   - Loyalty (similarity matching)
   - Honesty (similarity matching)
   - Communication (similarity matching)
   - Independence (similarity matching)
   - Affection (similarity matching)

4. **Life Goals (15%)**:

   - Career (similarity matching)
   - Family (similarity matching)
   - Personal growth (similarity matching)
   - Adventure (complementary matching)
   - Stability (complementary matching)

5. **Communication Style (10%)**:

   - Directness (complementary matching)
   - Conflict resolution (similarity matching)
   - Expressiveness (complementary matching)
   - Listening (similarity matching)

6. **Interests (5%)**:
   - Shared interests (similarity matching using Jaccard similarity coefficient)

### Matching Approaches

The algorithm uses two matching approaches:

- **Similarity Matching**: "Birds of a feather flock together" - Higher compatibility scores for similar trait values
- **Complementary Matching**: "Opposites attract" - Higher compatibility scores for opposite trait values

### Scoring Mechanism

1. Each trait is scored on a scale of 0-1 based on the appropriate matching approach
2. Trait scores are averaged within each dimension
3. Dimension scores are weighted and combined for a final compatibility score (0-100)
4. The highest-scoring potential match becomes the daily match

### Match Selection Process

1. Filter potential matches based on gender preferences and availability
2. Calculate compatibility scores for all potential matches
3. Select the highest-scoring match
4. Create a match record with detailed compatibility information
5. Update both users' states to "matched"

## Real-time Messaging System

The WebSocket-based messaging system provides:

- Instant message delivery
- Message read status tracking
- Typing indicators
- Conversation milestone tracking
- Automatic video call unlocking at 100 messages within 48 hours

## User State Management System

The system manages four user states with automatic transitions:

1. **Available**: User can receive a new match
2. **Matched**: User has received a match but hasn't pinned it yet
3. **Pinned**: User has committed to the current match
4. **Frozen**: User is in a 24-hour reflection period after unpinning a match

State transitions are triggered by:

- Receiving a new match (Available → Matched)
- Pinning a match (Matched → Pinned)
- Unpinning a match (Pinned → Frozen for unpinner, Pinned → Available after 2 hours for the other person)
- Completing the freeze period (Frozen → Available)

## API Documentation

### Authentication Routes

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/onboarding` - Complete onboarding questionnaire

### Match Routes

- `GET /api/matches/daily` - Get daily match
- `GET /api/matches/current` - Get current match details
- `PUT /api/matches/:id/pin` - Pin a match
- `PUT /api/matches/:id/unpin` - Unpin a match
- `GET /api/matches/history` - Get match history
- `GET /api/matches/:id/feedback` - Get match feedback

### Message Routes

- `GET /api/messages/:userId` - Get messages with a specific user
- `POST /api/messages` - Send a message
- `PUT /api/messages/read/:userId` - Mark messages as read
- `GET /api/messages/unread` - Get unread message count
- `GET /api/messages/video-status/:userId` - Check if video call is unlocked

## Future Enhancements

- Machine learning improvements to the matching algorithm
- Advanced analytics dashboard for match success rates
- Voice messaging capabilities
#   l o n e - t o w n  
 #   l o w n - t o w n  
 