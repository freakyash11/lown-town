const express = require('express');
const router = express.Router();
const { 
  getDailyMatch,
  getCurrentMatch,
  pinMatch,
  unpinMatch,
  getMatchHistory,
  getMatchFeedback
} = require('../controllers/matchController');
const { protect } = require('../middlewares/auth');

// All routes are protected
router.use(protect);

router.get('/daily', getDailyMatch);
router.get('/current', getCurrentMatch);
router.get('/history', getMatchHistory);
router.get('/:id/feedback', getMatchFeedback);
router.put('/:id/pin', pinMatch);
router.put('/:id/unpin', unpinMatch);

module.exports = router; 