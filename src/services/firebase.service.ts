import { admin, firebaseApp } from '../config/firebase.config';
import Logging from '../library/Logging';

export interface PushNotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Sends a push notification using Firebase Cloud Messaging.
 *
 * @param token The destination registration token of the user device.
 * @param title The title of the notification.
 * @param body The body text of the notification.
 * @param data Optional payload containing extra custom data (must be key-value string pairs).
 */
export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<string | null> => {
  if (!firebaseApp) {
    Logging.warning('[Firebase Service] Firebase app is not initialized. Skipping notification.');
    return null;
  }

  try {
    // Stringify any non-string values in data payload, as FCM data keys/values must be strings
    const stringifiedData: Record<string, string> = {};
    if (data) {
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          stringifiedData[key] = String(val);
        }
      });
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: Object.keys(stringifiedData).length > 0 ? stringifiedData : undefined,
      token,
    };

    const response = await admin.messaging().send(message);
    Logging.info(`[Firebase Service] Notification sent successfully: ${response}`);
    return response;
  } catch (error) {
    Logging.error(`[Firebase Service] Error sending push notification: ${error}`);
    throw error;
  }
};
