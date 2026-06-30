import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * Transactional email. Configure SMTP_URL (any provider: Resend, SES, Postmark,
 * SendGrid, Mailgun, Gmail…) to actually send. Without it, emails are logged so
 * local/dev flows still work end-to-end without an email account.
 */
let transport: Transporter | null = null;
if (env.SMTP_URL) {
  transport = nodemailer.createTransport(env.SMTP_URL);
  logger.info('SMTP transport configured');
} else {
  logger.warn('SMTP_URL not set — emails will be logged, not sent');
}

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string }) {
  if (!transport) {
    logger.info({ to: opts.to, subject: opts.subject }, `[email:logged] ${opts.text ?? opts.subject}`);
    return;
  }
  await transport.sendMail({ from: env.EMAIL_FROM, ...opts });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const base = env.APP_WEB_URL ?? 'http://localhost:5180';
  const link = `${base.replace(/\/$/, '')}/reset?token=${encodeURIComponent(token)}`;
  await sendMail({
    to,
    subject: 'Reset your Study Buddy password',
    text: `Reset your password: ${link}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto">
        <h2>Reset your password</h2>
        <p>Click the button below to choose a new password. This link expires in 1 hour.</p>
        <p><a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset password</a></p>
        <p style="color:#64748b;font-size:13px">If you didn’t request this, you can safely ignore this email.</p>
      </div>`,
  });
}
