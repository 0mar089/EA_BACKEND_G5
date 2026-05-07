import express from 'express';
import controller from '../controllers/notification';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, controller.getMyNotifications);
router.patch('/read-all', authenticateToken, controller.markAllAsRead);
router.patch('/:id/read', authenticateToken, controller.markAsRead);
router.delete('/:id', authenticateToken, controller.deleteNotification);

export = router;
