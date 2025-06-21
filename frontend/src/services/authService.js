// Re-export functions from other service files
import { getCurrentUserToken } from './firebaseAuth';
import { matchService } from './api';

// Re-export the functions needed by Match.js
export { getCurrentUserToken };
export const getCurrentMatch = matchService.getCurrentMatch;
export const getDailyMatch = matchService.getDailyMatch;

// Export default as well
export default {
  getCurrentUserToken,
  getCurrentMatch,
  getDailyMatch
}; 