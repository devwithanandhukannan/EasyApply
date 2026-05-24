import nodemailer from 'nodemailer';

// Setup connection configurations utilizing environment parameters
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'workbridge.anandhu@gmail.com',
    pass: process.env.SMTP_PASS || 'hackerpass', // This should be a 16-character App Password if using 2FA
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Shared wrapper layout to fire SMTP transactional emails safely
 */
export const sendMail = async ({ to, subject, html }: SendEmailOptions): Promise<void> => {
  const fromEmail = process.env.EMAIL_FROM || 'workbridge.anandhu@gmail.com';

  const mailOptions = {
    from: `"WorkBridge Support" <${fromEmail}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ Operational SMTP email successfully dispatched to: ${to}`);
  } catch (error) {
    console.error(`❌ Critical error dispatching SMTP email to ${to}:`, error);
    throw new Error('SMTP transactional delivery channel crashed.');
  }
};

/**
 * Explicit helper to format and dispatch the unique registration/verification token link
 */
export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  // Update this domain link with your actual Frontend client endpoint structure
  const clientAppUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const completeVerificationUrl = `${clientAppUrl}/verify-email?token=${token}`;

  const htmlTemplate = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-md;">
      <h2 style="color: #0f172a; font-size: 24px; margin-bottom: 16px;">Verify your WorkBridge Workspace</h2>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">
        Thank you for choosing WorkBridge. Please confirm your corporate email address to unlock your recruiter management control panel.
      </p>
      <div style="margin: 32px 0;">
        <a href="${completeVerificationUrl}" 
           style="background-color: #000000; color: #ffffff; padding: 12px 24px; font-weight: 500; text-decoration: none; border-radius: 8px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="color: #64748b; font-size: 14px;">
        This activation connection token will expire automatically in 24 hours. If you did not initiate this workspace configuration, please ignore this communication.
      </p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">
        Secure link raw context fallback: <br/>
        <a href="${completeVerificationUrl}" style="color: #2563eb;">${completeVerificationUrl}</a>
      </p>
    </div>
  `;

  await sendMail({
    to: email,
    subject: 'Action Required: Activate Your Corporate Workspace Profile',
    html: htmlTemplate,
  });
};