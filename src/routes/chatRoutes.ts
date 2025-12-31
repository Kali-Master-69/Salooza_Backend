import express from 'express';
import { startConversation, sendMessage, getMessages } from '../controllers/chatController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/start', startConversation);
router.post('/message', sendMessage);
router.get('/:conversationId', getMessages);

export default router;
