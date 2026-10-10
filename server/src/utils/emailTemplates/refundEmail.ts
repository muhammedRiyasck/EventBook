import { buildEmail } from './base';

export interface RefundEmailData {
  userName: string;
  userEmail: string;
  serviceName: string;
  refundAmount: number;
  totalPrice: number;
  isFullRefund: boolean;
  reason: string;
  bookingId: string;
}

export function refundEmailTemplate(data: RefundEmailData): string {
  const { userName, serviceName, refundAmount, totalPrice, isFullRefund, reason, bookingId } = data;

  const header = `
    <div style="background: linear-gradient(135deg, #0a2a4a, #1a5f7a); color: #fff; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Refund ${isFullRefund ? 'Processed' : 'Partially Processed'}</h1>
      <p style="margin: 6px 0 0; color: #a8d8ea; font-size: 14px;">Your refund has been issued successfully.</p>
    </div>
  `;

  const body = `
    <p>Hi <strong>${userName}</strong>,</p>
    <p>
      A ${isFullRefund ? 'full' : 'partial'} refund has been processed for your booking of
      <strong>${serviceName}</strong> (ID: <span class="booking-id">${bookingId}</span>).
    </p>
    <table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size:14px;">
      <tr style="background:#f5f5f5;">
        <td style="padding:10px; border:1px solid #eee; font-weight:600;">Refund Amount</td>
        <td style="padding:10px; border:1px solid #eee;">&#8377;${refundAmount.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding:10px; border:1px solid #eee; font-weight:600;">Total Paid</td>
        <td style="padding:10px; border:1px solid #eee;">&#8377;${totalPrice.toLocaleString()}</td>
      </tr>
      <tr style="background:#f5f5f5;">
        <td style="padding:10px; border:1px solid #eee; font-weight:600;">Reason</td>
        <td style="padding:10px; border:1px solid #eee;">${reason || 'Not specified'}</td>
      </tr>
    </table>
    <p>Refunds typically take 5-10 business days to reflect in your account depending on your bank.</p>
    <p>If you have any questions, please don't hesitate to contact us.</p>
  `;

  return buildEmail(header, body);
}
