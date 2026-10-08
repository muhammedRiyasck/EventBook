import { buildEmail } from './base';

/**
 * @param otp - The 6-digit one-time password.
 */
export function otpEmailTemplate(otp: string): string {
  const header = `
    <div style="background: linear-gradient(135deg, #0f1c3f, #1a3a6b); color: #FFD700; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Email Verification</h1>
      <p style="margin: 6px 0 0; color: #ccc; font-size: 14px;">EventBook Platform</p>
    </div>
  `;

  const body = `
    <p style="text-align: center;">Thank you for registering! Use the OTP below to verify your email address.</p>
    <p style="text-align: center;"><strong>This code expires in 5 minutes.</strong></p>
    <div style="text-align: center;">
      <span class="otp-box">${otp}</span>
    </div>
    <p style="text-align: center; color: #999; font-size: 13px;">
      If you did not request this, you can safely ignore this email.
    </p>
  `;

  return buildEmail(header, body);
}
