const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

const router = express.Router();

// Conversations
router.post('/conversations', authenticateToken, chatController.createConversation);
router.get('/conversations', authenticateToken, chatController.listConversations);
router.post('/conversations/project/:projectId', authenticateToken, chatController.createProjectGroupConversation);

// Messages
router.get('/conversations/:id/messages', authenticateToken, chatController.getMessages);
router.post('/messages', authenticateToken, chatController.uploadMiddleware, chatController.sendMessage);
router.post('/conversations/:id/read', authenticateToken, chatController.markRead);

module.exports = router;