import { EventEmitter } from 'events';
import { sendOtpEmail, sendBookingConfirmationEmail, sendBookingCancellationEmail, sendRefundEmail } from './emailService';

class AppEventEmitter extends EventEmitter {}
const appEvents = new AppEventEmitter();


appEvents.on('user.registered', async ({ email, otp }) => {
  try {
    await sendOtpEmail(email, otp);
    console.log(`✅ [Email] OTP sent to ${email}`);
  } catch (error: unknown) {
    const err = error as Error & { code?: string; responseCode?: number; response?: string };
    console.error(`❌ [Email] Failed to send OTP to ${email}`);
    console.error(`   Message  : ${err.message}`);
    console.error(`   Code     : ${err.code ?? 'N/A'}`);
    console.error(`   SMTP Res : ${err.response ?? 'N/A'}`);
  }
});

appEvents.on('booking.created', async (bookingData) => {
  try {
    await sendBookingConfirmationEmail(bookingData);
    console.log(`✅ [Email] Booking confirmation sent to ${bookingData.userEmail}`);
  } catch (error: unknown) {
    const err = error as Error & { code?: string; response?: string };
    console.error(`❌ [Email] Failed to send booking confirmation to ${bookingData.userEmail}`);
    console.error(`   Message  : ${err.message}`);
    console.error(`   Code     : ${err.code ?? 'N/A'}`);
    console.error(`   SMTP Res : ${err.response ?? 'N/A'}`);
  }
});

appEvents.on('booking.cancelled', async (bookingData) => {
  try {
    await sendBookingCancellationEmail(bookingData);
    console.log(`✅ [Email] Booking cancellation sent to ${bookingData.userEmail}`);
  } catch (error: unknown) {
    const err = error as Error & { code?: string; response?: string };
    console.error(`❌ [Email] Failed to send booking cancellation to ${bookingData.userEmail}`);
    console.error(`   Message  : ${err.message}`);
    console.error(`   Code     : ${err.code ?? 'N/A'}`);
    console.error(`   SMTP Res : ${err.response ?? 'N/A'}`);
  }
});

appEvents.on('booking.refunded', async (data) => {
  try {
    await sendRefundEmail(data);
    console.log(`✅ [Email] Refund notification sent to ${data.userEmail}`);
  } catch (error: unknown) {
    const err = error as Error & { code?: string; response?: string };
    console.error(`❌ [Email] Failed to send refund notification to ${data.userEmail}`);
    console.error(`   Message  : ${err.message}`);
    console.error(`   Code     : ${err.code ?? 'N/A'}`);
    console.error(`   SMTP Res : ${err.response ?? 'N/A'}`);
  }
});


export default appEvents;
