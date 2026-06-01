import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { prisma } from '../utils/prisma.ts';

// ─── FIREBASE ADMIN INSTANT INITIALIZATION ──────────────────────────
// സെർവീസ് ലോഡ് ചെയ്യുമ്പോൾ തന്നെ ആപ്പ് ഇൻഷ്യലൈസ്ഡ് ആണെന്ന് ഇത് ഉറപ്പുവരുത്തും
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('🔥 Firebase Admin SDK successfully initialized inside NotificationService.');
    } else {
      console.error('❌ Firebase Init Error: service-account.json missing at project root.');
    }
  } catch (initError) {
    console.error('❌ Critical error during Firebase Admin bootstrap:', initError);
  }
}

export class NotificationService {
  /**
   * യൂസർ ഐഡി വെച്ച് ഡാറ്റാബേസിലുള്ള എല്ലാ FCM ടോക്കണുകളിലേക്കും പുഷ് നോട്ടിഫിക്കേഷൻ അയക്കുന്നു
   */
  static async sendToUser(userId: string, title: string, body: string, deepLinkUrl?: string) {
    try {
        console.log(`[FCM] Preparing to send notification to User ID: ${userId} with title: "${title}"`);
      // 1. ഡാറ്റാബേസിൽ നിന്ന് ടോക്കണുകൾ എടുക്കുന്നു
      const userTokens = await prisma.notificationToken.findMany({
        where: { userId: userId },
        select: { token: true }
      });

      if (!userTokens || userTokens.length === 0) {
        console.log(`[FCM] No registered device tokens found for User ID: ${userId}`);
        return null;
      }

      const registrationTokens = userTokens.map(t => t.token);

      // 2. മെസ്സേജ് ബോഡി സെറ്റ് ചെയ്യുന്നു
      const message: admin.messaging.MulticastMessage = {
        tokens: registrationTokens,
        notification: {
          title: title,
          body: body,
        },
        webpush: {
          fcmOptions: {
            link: deepLinkUrl || undefined,
          },
        },
      };

      // 3. ഡിഫോൾട്ട് ആപ്പ് വഴി മെസ്സേജ് അയക്കുന്നു
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`[FCM] Successfully dispatched ${response.successCount} messages for User: ${userId}`);

      // 4. എക്സ്പെയർ ആയ ടോക്കണുകൾ ഉണ്ടെങ്കിൽ അവ ക്ലീൻ ചെയ്യുന്നു
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            if (
              resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code === 'messaging/registration-token-not-registered'
            ) {
              failedTokens.push(registrationTokens[idx]);
            }
          }
        });

        if (failedTokens.length > 0) {
          await prisma.notificationToken.deleteMany({
            where: { token: { in: failedTokens } },
          });
          console.log(`[FCM] Cleaned up ${failedTokens.length} outdated/invalid tokens from DB.`);
        }
      }

      return response;
    } catch (error) {
      console.error('Error inside NotificationService.sendToUser:', error);
      throw error;
    }
  }
}