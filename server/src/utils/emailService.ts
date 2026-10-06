import nodemailer from 'nodemailer';
import env from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: false, // TLS
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

interface BookingEmailData {
  userName: string;
  userEmail: string;
  serviceName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalPrice: number;
  bookingId: string;
  status?: string;
}

/**
 * Sends a booking confirmation email to the user.
 */
export const sendBookingConfirmationEmail = async (
  data: BookingEmailData
): Promise<void> => {
  const { userName, userEmail, serviceName, startDate, endDate, totalDays, totalPrice, bookingId } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0f1c3f, #1a3a6b); color: #FFD700; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0; color: #ccc; font-size: 14px; }
        .body { padding: 30px; }
        .body p { color: #444; line-height: 1.6; }
        .detail-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .detail-table td { padding: 10px 14px; border-bottom: 1px solid #eee; }
        .detail-table td:first-child { font-weight: bold; color: #333; width: 40%; }
        .detail-table td:last-child { color: #555; }
        .total-row td { background: #f9f5e3; font-weight: bold; color: #0f1c3f; font-size: 16px; }
        .badge { display: inline-block; padding: 4px 12px; background: #e6f4ea; color: #2e7d32; border-radius: 20px; font-size: 13px; font-weight: bold; }
        .footer { background: #f9f9f9; padding: 20px 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
        .booking-id { font-family: monospace; background: #f0f0f0; padding: 2px 8px; border-radius: 4px; color: #333; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Booking Confirmed!</h1>
          <p>Your event service has been successfully booked.</p>
        </div>
        <div class="body">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Great news! Your booking for <strong>${serviceName}</strong> has been confirmed. Here are your booking details:</p>
          <table class="detail-table">
            <tr>
              <td>Booking ID</td>
              <td><span class="booking-id">${bookingId}</span></td>
            </tr>
            <tr>
              <td>Service</td>
              <td>${serviceName}</td>
            </tr>
            <tr>
              <td>Start Date</td>
              <td>${startDate}</td>
            </tr>
            <tr>
              <td>End Date</td>
              <td>${endDate}</td>
            </tr>
            <tr>
              <td>Duration</td>
              <td>${totalDays} day${totalDays > 1 ? 's' : ''}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td><span class="badge">✅ Confirmed</span></td>
            </tr>
            <tr class="total-row">
              <td>Total Price</td>
              <td>₹${totalPrice.toLocaleString('en-IN')}</td>
            </tr>
          </table>
          <p>If you have any questions or need to make changes, please contact us or visit your bookings dashboard.</p>
          <p>Thank you for choosing our platform! 🙏</p>
        </div>
        <div class="footer">
          <p>© 2024 EventBook Platform. All rights reserved.</p>
          <p>This is an automated email, please do not reply directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"EventBook Platform" <${env.EMAIL_USER}>`,
    to: userEmail,
    subject: `✅ Booking Confirmed — ${serviceName}`,
    html,
  });
};

/**
 * Sends a booking cancellation email to the user.
 */
export const sendBookingCancellationEmail = async (
  data: BookingEmailData
): Promise<void> => {
  const { userName, userEmail, serviceName, bookingId } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #4a0000, #8b0000); color: #fff; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .body { padding: 30px; }
        .body p { color: #444; line-height: 1.6; }
        .booking-id { font-family: monospace; background: #f0f0f0; padding: 2px 8px; border-radius: 4px; color: #333; }
        .footer { background: #f9f9f9; padding: 20px 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Cancelled</h1>
        </div>
        <div class="body">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Your booking for <strong>${serviceName}</strong> (ID: <span class="booking-id">${bookingId}</span>) has been successfully cancelled.</p>
          <p>If this was a mistake or you'd like to rebook, please visit our platform to make a new booking.</p>
          <p>We're sorry to see you go and hope to serve you again soon.</p>
        </div>
        <div class="footer">
          <p>© 2024 EventBook Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"EventBook Platform" <${env.EMAIL_USER}>`,
    to: userEmail,
    subject: `Booking Cancelled — ${serviceName}`,
    html,
  });
};
