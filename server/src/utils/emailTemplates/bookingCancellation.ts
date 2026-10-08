import { buildEmail } from './base';
import { BookingEmailData } from './bookingConfirmation';

export function bookingCancellationTemplate(data: BookingEmailData): string {
  const { userName, serviceName, bookingId } = data;

  const header = `
    <div style="background: linear-gradient(135deg, #4a0000, #8b0000); color: #fff; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Booking Cancelled</h1>
      <p style="margin: 6px 0 0; color: #ffaaaa; font-size: 14px;">We're sorry to see this booking go.</p>
    </div>
  `;

  const body = `
    <p>Hi <strong>${userName}</strong>,</p>
    <p>
      Your booking for <strong>${serviceName}</strong>
      (ID: <span class="booking-id">${bookingId}</span>) has been successfully cancelled.
    </p>
    <p>If this was a mistake or you'd like to rebook, please visit our platform to make a new booking.</p>
    <p>We hope to serve you again soon.</p>
  `;

  return buildEmail(header, body);
}
