import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import env from '../config/env';
import { otpEmailTemplate } from './emailTemplates/otpEmail';
import { bookingConfirmationTemplate, BookingEmailData } from './emailTemplates/bookingConfirmation';
import { bookingCancellationTemplate } from './emailTemplates/bookingCancellation';
import { refundEmailTemplate, RefundEmailData } from './emailTemplates/refundEmail';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

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

const sendEmail = async ({ to, subject, html }: SendMailOptions): Promise<void> => {
  if (resend) {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM || 'EventBook <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    if (error) {
      throw new Error(`[Resend] ${error.name}: ${error.message}`);
    }
    return;
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

  throw new Error('No email provider configured. Please set RESEND_API_KEY in your environment variables.');
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
