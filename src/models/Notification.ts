import mongoose, { Document, Schema, Types } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export enum NotificationType {
    LIKE = 'like',
    LIKE_COMMENT = 'like_comment',
    COMMENT = 'comment',
    FOLLOW = 'follow',
    FOLLOW_REQUEST = 'follow_request',
    FOLLOW_ACCEPTED = 'follow_accepted'
}

export interface INotification {
    recipient: Types.ObjectId; // User receiving the notification
    sender: Types.ObjectId;    // User who triggered the action
    type: NotificationType;
    post?: Types.ObjectId;     // Optional: if it's related to a post (like/comment)
    comment?: Types.ObjectId;  // Optional: if it's related to a specific comment
    isRead: boolean;
    createdAt: Date;
}

export interface INotificationModel extends INotification, Document { }

const NotificationSchema: Schema<INotificationModel> = new Schema(
    {
        recipient: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
            index: true
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true
        },
        type: {
            type: String,
            enum: Object.values(NotificationType),
            required: true
        },
        post: {
            type: Schema.Types.ObjectId,
            ref: 'Post'
        },
        comment: {
            type: Schema.Types.ObjectId,
            ref: 'Comment'
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        versionKey: false,
        collection: 'notifications'
    }
);

NotificationSchema.plugin(mongoosePaginate);

const Notification = mongoose.model<INotificationModel, mongoose.PaginateModel<INotificationModel>>('Notification', NotificationSchema);

export default Notification;
