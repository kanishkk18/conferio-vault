import { Resend } from "resend";
import { serverEnv } from "./env.server";

const resend = serverEnv.RESEND_API_KEY ? new Resend(serverEnv.RESEND_API_KEY) : null;

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends a transactional email via Resend. If RESEND_API_KEY isn't set
 * (e.g. local dev), falls back to logging the email to the console so the
 * auth flow can still be exercised without a real provider configured.
 */
async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not set — would have sent "${subject}" to ${to}:\n${html}`
    );
    return;
  }

  const { error } = await resend.emails.send({
    from: serverEnv.RESEND_FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[email] Resend send failed:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Verify your SecureVault email",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Verify your email</h2>
        <p>Click the button below to verify your SecureVault account. This link expires in 1 hour.</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Verify email</a>
        <p style="color:#6b7280;font-size:13px;">If you didn't create a SecureVault account, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, url: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Reset your SecureVault account password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your account password</h2>
        <p>Click the button below to reset the password you use to sign in. This link expires in 1 hour.</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Reset password</a>
        <p style="color:#b91c1c;font-size:13px;"><strong>Important:</strong> SecureVault uses end-to-end encryption. Resetting your account password does <em>not</em> recover items encrypted with your old vault password — those can only be decrypted with the password you used when you created them.</p>
        <p style="color:#6b7280;font-size:13px;">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
}
