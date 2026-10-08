import { buildEmail } from './base';

export interface BookingEmailData {
  userName: string;
  userEmail: string;
  serviceName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalPrice: number;
  bookingId: string;
}

export function bookingConfirmationTemplate(data: BookingEmailData): string {
  const { userName, serviceName, startDate, endDate, totalDays, totalPrice, bookingId } = data;

  const header = `
    <div style="background: linear-gradient(135deg, #0f1c3f, #1a3a6b); color: #FFD700; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">🎉 Booking Confirmed!</h1>
      <p style="margin: 6px 0 0; color: #ccc; font-size: 14px;">Your event service has been successfully booked.</p>
    </div>
  `;

  const body = `
    <p>Hi <strong>${userName}</strong>,</p>
    <p>Great news! Your booking for <strong>${serviceName}</strong> has been confirmed. Here are your details:</p>
    <table class="detail-table">
      <tr><td>Booking ID</td><td><span class="booking-id">${bookingId}</span></td></tr>
      <tr><td>Service</td><td>${serviceName}</td></tr>
      <tr><td>Start Date</td><td>${startDate}</td></tr>
      <tr><td>End Date</td><td>${endDate}</td></tr>
      <tr><td>Duration</td><td>${totalDays} day${totalDays > 1 ? 's' : ''}</td></tr>
      <tr><td>Status</td><td><span class="badge badge-green">✅ Confirmed</span></td></tr>
      <tr class="total-row"><td>Total Price</td><td>₹${totalPrice.toLocaleString('en-IN')}</td></tr>
    </table>
    <p>If you have any questions or need to make changes, visit your bookings dashboard.</p>
    <p>Thank you for choosing EventBook! 🙏</p>
  `;

  return buildEmail(header, body);
}
