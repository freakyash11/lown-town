const express = require('express');
const router = express.Router();
const { 
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
  checkVideoCallStatus
} = require('../controllers/messageController');
const { protect } = require('../middlewares/auth');

// All routes are protected
router.use(protect);

router.get('/unread', getUnreadCount);
router.get('/video-status/:userId', checkVideoCallStatus);
router.get('/:userId', getMessages);
router.post('/', sendMessage);
router.put('/read/:userId', markMessagesAsRead);

module.exports = router; 