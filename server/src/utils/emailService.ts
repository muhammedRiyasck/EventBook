import nodemailer from 'nodemailer';
import env from '../config/env';
import { otpEmailTemplate } from './emailTemplates/otpEmail';
import { bookingConfirmationTemplate, BookingEmailData } from './emailTemplates/bookingConfirmation';
import { bookingCancellationTemplate } from './emailTemplates/bookingCancellation';
import { refundEmailTemplate, RefundEmailData } from './emailTemplates/refundEmail';

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: false, // TLS via STARTTLS
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

const SENDER = `"EventBook Platform" <${env.EMAIL_USER}>`;


/**
 * Sends an OTP verification email.
 */
export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  await transporter.sendMail({
    from: SENDER,
    to: email,
    subject: 'Your EventBook Verification Code',
    html: otpEmailTemplate(otp),
  });
};

/**
 * Sends a booking confirmation email to the user.
 */
export const sendBookingConfirmationEmail = async (data: BookingEmailData): Promise<void> => {
  await transporter.sendMail({
    from: SENDER,
    to: data.userEmail,
    subject: `✅ Booking Confirmed — ${data.serviceName}`,
    html: bookingConfirmationTemplate(data),
  });
};

/**
 * Sends a booking cancellation email to the user.
 */
export const sendBookingCancellationEmail = async (data: BookingEmailData): Promise<void> => {
  await transporter.sendMail({
    from: SENDER,
    to: data.userEmail,
    subject: `Booking Cancelled — ${data.serviceName}`,
    html: bookingCancellationTemplate(data),
  });
};

/**
 * Sends a refund notification email to the user.
 */
export const sendRefundEmail = async (data: RefundEmailData): Promise<void> => {
  await transporter.sendMail({
    from: SENDER,
    to: data.userEmail,
    subject: `💰 Refund Processed — ${data.serviceName}`,
    html: refundEmailTemplate(data),
  });
};

// Re-export the shared types so consumers don't need to dig into templates
export type { BookingEmailData, RefundEmailData };
