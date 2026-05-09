import Notification, { NotificationType } from '../models/Notification';
import { getIO } from '../socket';
import Logging from '../library/Logging';

export interface Notification {
    _id: string;
    recipient: string;
    sender: {
        _id: string;
        nombre: string;
        avatarUrl?: string;
        foto?: string;
    };
    type: "like" | "comment" | "follow" | "follow_request" | "follow_accepted";
    post?: {
        _id: string;
        imageUrl: string;
        caption?: string;
    };
    isRead: boolean;
    createdAt: string;
}

const createNotification = async (data: {
    recipient: string;
    sender: string;
    type: NotificationType;
    post?: string;
    comment?: string;
}) => {
    try {
        // Don't notify if sender is the recipient
        if (data.sender.toString() === data.recipient.toString()) {
            Logging.info(`[NotificationService] Skipping notification: sender is recipient (${data.sender})`);
            return;
        }

        // Save to Database
        const notification = new Notification(data);
        await notification.save();

        // Populate sender info for the client
        const populatedNotification = await Notification.findById(notification._id)
            .populate('sender', 'nombre avatarUrl')
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
                { path: 'sender', select: 'nombre avatarUrl' },
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

const deleteNotificationsByPost = async (postId: string) => {
    return await Notification.deleteMany({ post: postId });
};

const deleteNotificationByCriteria = async (criteria: { sender: string; recipient: string; type: NotificationType; post?: string; comment?: string }) => {
    return await Notification.findOneAndDelete(criteria);
};

export default {
    createNotification,
    getNotifications: getNotificationsForUser,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteNotificationsByPost,
    deleteNotificationByCriteria
};
