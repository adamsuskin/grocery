/**
 * Email utility functions for sending transactional emails
 *
 * PRODUCTION NOTES:
 * - This is a mock implementation for development
 * - In production, integrate with a real email service:
 *   - SendGrid: https://sendgrid.com
 *   - AWS SES: https://aws.amazon.com/ses/
 *   - Mailgun: https://www.mailgun.com
 *   - Postmark: https://postmarkapp.com
 * - Use environment variables for email service credentials
 * - Implement retry logic for failed email sends
 * - Add email logging for audit trail
 * - Consider email templates with proper HTML/CSS
 * - Implement rate limiting to prevent email spam
 */

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Mock email sending function
 * In production, replace with actual email service integration
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Log email details for development
  console.log('\n==================== EMAIL SENT ====================');
  console.log('To:', options.to);
  console.log('Subject:', options.subject);
  console.log('Text:\n', options.text);
  if (options.html) {
    console.log('HTML:\n', options.html);
  }
  console.log('====================================================\n');

  // Simulate async email sending
  await new Promise(resolve => setTimeout(resolve, 100));

  // In production, replace with actual email service call:
  // try {
  //   await emailService.send({
  //     from: process.env.EMAIL_FROM,
  //     to: options.to,
  //     subject: options.subject,
  //     text: options.text,
  //     html: options.html,
  //   });
  //   return true;
  // } catch (error) {
  //   console.error('Email send failed:', error);
  //   return false;
  // }

  return true; // Mock success
}

/**
 * Generate password reset email content
 */
export function generatePasswordResetEmail(
  email: string,
  resetToken: string,
  userName?: string
): EmailOptions {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  const expiryMinutes = 60; // Should match token expiry in controller

  const text = `
Hello${userName ? ` ${userName}` : ''},

You recently requested to reset your password for your Grocery List account.

Click the link below to reset your password:
${resetUrl}

This link will expire in ${expiryMinutes} minutes.

If you did not request a password reset, please ignore this email or contact support if you have concerns.

Thanks,
The Grocery List Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border: 1px solid #e1e8ed;
      border-radius: 8px;
      padding: 30px;
      margin: 20px 0;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2c5282;
      margin: 0;
      font-size: 24px;
    }
    .content {
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #3182ce;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      text-align: center;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #2c5282;
    }
    .button-container {
      text-align: center;
    }
    .footer {
      font-size: 14px;
      color: #718096;
      border-top: 1px solid #e1e8ed;
      padding-top: 20px;
      margin-top: 30px;
    }
    .warning {
      background-color: #fff5f5;
      border-left: 4px solid #fc8181;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .code {
      background-color: #f7fafc;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reset Your Password</h1>
    </div>

    <div class="content">
      <p>Hello${userName ? ` <strong>${userName}</strong>` : ''},</p>

      <p>You recently requested to reset your password for your Grocery List account.</p>

      <div class="button-container">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>

      <p style="font-size: 14px; color: #718096;">
        Or copy and paste this link into your browser:<br>
        <span class="code">${resetUrl}</span>
      </p>

      <div class="warning">
        <strong>Important:</strong> This link will expire in <strong>${expiryMinutes} minutes</strong>.
      </div>

      <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
    </div>

    <div class="footer">
      <p>Thanks,<br>The Grocery List Team</p>
      <p style="font-size: 12px; margin-top: 20px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    to: email,
    subject: 'Reset Your Password - Grocery List',
    text,
    html,
  };
}

/**
 * Generate password reset success email content
 */
export function generatePasswordResetSuccessEmail(
  email: string,
  userName?: string
): EmailOptions {
  const text = `
Hello${userName ? ` ${userName}` : ''},

Your password has been successfully reset.

If you did not make this change, please contact support immediately.

Thanks,
The Grocery List Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border: 1px solid #e1e8ed;
      border-radius: 8px;
      padding: 30px;
      margin: 20px 0;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #38a169;
      margin: 0;
      font-size: 24px;
    }
    .success-icon {
      font-size: 48px;
      text-align: center;
      margin-bottom: 20px;
    }
    .content {
      margin-bottom: 30px;
    }
    .footer {
      font-size: 14px;
      color: #718096;
      border-top: 1px solid #e1e8ed;
      padding-top: 20px;
      margin-top: 30px;
    }
    .warning {
      background-color: #fff5f5;
      border-left: 4px solid #fc8181;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">✓</div>

    <div class="header">
      <h1>Password Reset Successful</h1>
    </div>

    <div class="content">
      <p>Hello${userName ? ` <strong>${userName}</strong>` : ''},</p>

      <p>Your password has been successfully reset. You can now log in with your new password.</p>

      <div class="warning">
        <strong>Security Notice:</strong> If you did not make this change, please contact support immediately.
      </div>
    </div>

    <div class="footer">
      <p>Thanks,<br>The Grocery List Team</p>
      <p style="font-size: 12px; margin-top: 20px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    to: email,
    subject: 'Password Reset Successful - Grocery List',
    text,
    html,
  };
}
