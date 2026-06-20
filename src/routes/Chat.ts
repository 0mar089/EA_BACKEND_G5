import { Router } from 'express';
import { getContacts, getHistory, getUnreadMessagesCount, getMessage, getConversationContext, createGroupChat } from '../controllers/chat';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

/** GET /chat/context/:userAId/:userBId */
router.get('/context/:userAId/:userBId', getConversationContext);

/** GET /chat/message/:messageId */
router.get('/message/:messageId', getMessage);

/** GET /chat/contacts */
router.get('/contacts', getContacts);

/** GET /chat/unread-count */
router.get('/unread-count', getUnreadMessagesCount);

/** GET /chat/conversation/:userId */
router.get('/conversation/:userId', getHistory);

/** POST /chat/groups */
router.post('/groups', createGroupChat);

export default router;
