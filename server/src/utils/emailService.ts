import nodemailer from 'nodemailer';
import env from '../config/env';
import { otpEmailTemplate } from './emailTemplates/otpEmail';
import { bookingConfirmationTemplate, BookingEmailData } from './emailTemplates/bookingConfirmation';
import { bookingCancellationTemplate } from './emailTemplates/bookingCancellation';
import { refundEmailTemplate, RefundEmailData } from './emailTemplates/refundEmail';

const transporter = (env.EMAIL_USER && env.EMAIL_PASS)
  ? nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    })
  : null;

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

const sendWithBrevo = async ({ to, subject, html }: SendMailOptions): Promise<void> => {
  const senderEmail = env.BREVO_SENDER_EMAIL || env.EMAIL_USER;
  const senderName = env.BREVO_SENDER_NAME || 'EventBook Platform';

  if (!senderEmail) {
    throw new Error('[Brevo] Missing sender email. Please configure BREVO_SENDER_EMAIL or EMAIL_USER.');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as { message?: string; code?: string } | null;
    const msg = errorBody?.message || response.statusText;
    if (response.status === 401) {
      throw new Error(`[Brevo API Error 401] ${msg} — Make sure BREVO_API_KEY is an active v3 API key (starts with "xkeysib-", found under SMTP & API > API Keys), not an SMTP password/key.`);
    }
    throw new Error(`[Brevo API Error ${response.status}] ${msg}`);
  }
};

const sendEmail = async ({ to, subject, html }: SendMailOptions): Promise<void> => {
  if (env.BREVO_API_KEY) {
    return sendWithBrevo({ to, subject, html });
  }

  if (transporter) {
    const sender = `"EventBook Platform" <${env.EMAIL_USER}>`;
    await transporter.sendMail({
      from: sender,
      to,
      subject,
      html,
    });
    return;
  }

  throw new Error('No email provider configured. Please set BREVO_API_KEY in your environment variables.');
};

/**
 * Sends an OTP verification email.
 */
export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  await sendEmail({
    to: email,
    subject: 'Your EventBook Verification Code',
    html: otpEmailTemplate(otp),
  });
};

/**
 * Sends a booking confirmation email to the user.
 */
export const sendBookingConfirmationEmail = async (data: BookingEmailData): Promise<void> => {
  await sendEmail({
    to: data.userEmail,
    subject: `✅ Booking Confirmed — ${data.serviceName}`,
    html: bookingConfirmationTemplate(data),
  });
};

/**
 * Sends a booking cancellation email to the user.
 */
export const sendBookingCancellationEmail = async (data: BookingEmailData): Promise<void> => {
  await sendEmail({
    to: data.userEmail,
    subject: `Booking Cancelled — ${data.serviceName}`,
    html: bookingCancellationTemplate(data),
  });
};

/**
 * Sends a refund notification email to the user.
 */
export const sendRefundEmail = async (data: RefundEmailData): Promise<void> => {
  await sendEmail({
    to: data.userEmail,
    subject: `💰 Refund Processed — ${data.serviceName}`,
    html: refundEmailTemplate(data),
  });
};

// Re-export the shared types so consumers don't need to dig into templates
export type { BookingEmailData, RefundEmailData };
