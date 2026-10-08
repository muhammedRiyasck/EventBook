/** Shared CSS applied to every outgoing email. */
const BASE_STYLES = `
  body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
  .body { padding: 30px; }
  .body p { color: #444; line-height: 1.6; }
  .footer { background: #f9f9f9; padding: 20px 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
  .booking-id { font-family: monospace; background: #f0f0f0; padding: 2px 8px; border-radius: 4px; color: #333; }
  .detail-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .detail-table td { padding: 10px 14px; border-bottom: 1px solid #eee; }
  .detail-table td:first-child { font-weight: bold; color: #333; width: 40%; }
  .detail-table td:last-child { color: #555; }
  .total-row td { background: #f9f5e3; font-weight: bold; color: #0f1c3f; font-size: 16px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; }
  .badge-green { background: #e6f4ea; color: #2e7d32; }
  .otp-box { background: #f9f5e3; padding: 15px 24px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f1c3f; display: inline-block; margin: 20px 0; }
`;

const FOOTER_TEXT = '© 2024 EventBook Platform. All rights reserved.';

/**
 * Wraps content in the shared email shell (styles + container + footer).
 * @param headerHtml - The coloured header block HTML.
 * @param bodyHtml   - The main content area HTML.
 */
export function buildEmail(headerHtml: string, bodyHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>${BASE_STYLES}</style>
    </head>
    <body>
      <div class="container">
        ${headerHtml}
        <div class="body">${bodyHtml}</div>
        <div class="footer">
          <p>${FOOTER_TEXT}</p>
          <p>This is an automated email — please do not reply directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
