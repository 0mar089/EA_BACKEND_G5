import Notification, { NotificationType } from '../models/Notification';
import { getIO } from '../socket';
import Logging from '../library/Logging';

const createNotification = async (data: {
    recipient: string;
    sender: string;
    type: NotificationType;
    post?: string;
    comment?: string;
}) => {
    try {
        // Don't notify if sender is the recipient
        if (data.sender === data.recipient) return;

        // Save to Database
        const notification = new Notification(data);
        await notification.save();

        // Populate sender info for the client
        const populatedNotification = await Notification.findById(notification._id)
            .populate('sender', 'nombre foto')
            .populate('post', 'imageUrl caption');

        // Emit via Socket.io
        try {
            const io = getIO();
            io.to(`user_${data.recipient}`).emit('new_notification', populatedNotification);
        } catch (socketErr) {
            // Socket might not be initialized in some contexts, or user not connected
            Logging.warning(`[NotificationService] Could not emit socket: ${socketErr}`);
        }

        return populatedNotification;
    } catch (error) {
        Logging.error(`[NotificationService] Error creating notification: ${error}`);
        throw error;
    }
};

const getNotificationsForUser = async (userId: string, page: number = 1, limit: number = 20) => {
    return await Notification.paginate(
        { recipient: userId },
        {
            page,
            limit,
            sort: { createdAt: -1 },
            populate: [
                { path: 'sender', select: 'nombre foto' },
                { path: 'post', select: 'imageUrl caption' }
            ]
        }
    );
};

const markAsRead = async (notificationId: string, userId: string) => {
    return await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true },
        { new: true }
    );
};

const markAllAsRead = async (userId: string) => {
    return await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true }
    );
};

const deleteNotification = async (notificationId: string, userId: string) => {
    return await Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
};

export default {
    createNotification,
    getNotificationsForUser,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
