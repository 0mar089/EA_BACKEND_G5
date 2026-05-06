import { Router } from 'express';
import { getContacts, getHistory } from '../controllers/chat';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

/** GET /chat/contacts */
router.get('/contacts', getContacts);

/** GET /chat/conversation/:userId */
router.get('/conversation/:userId', getHistory);

export default router;
