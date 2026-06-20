import admin from 'firebase-admin';
import Logging from '../library/Logging';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

let firebaseApp: admin.app.App | null = null;

if (!projectId || !clientEmail || !privateKey) {
    Logging.warning(
        '[Firebase Config] Firebase environment variables are missing (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Push notifications will not be sent.'
    );
} else {
    try {
        // Clean the private key (convert escaped \n to actual newlines)
        const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: formattedPrivateKey
            })
        });
        Logging.info('[Firebase Config] Firebase Admin initialized successfully.');
    } catch (error) {
        Logging.error(`[Firebase Config] Error initializing Firebase Admin: ${error}`);
    }
}

export { firebaseApp, admin };
