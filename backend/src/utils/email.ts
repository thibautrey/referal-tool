import { Resend } from "resend";
import { Locale } from "../lib/i18n";

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND);

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  locale?: Locale;
}

/**
 * Send an email using Resend.com
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const {
      to,
      subject,
      html,
      from = "no-reply@rflnk.com",
      text,
      replyTo,
      headers,
      locale,
    } = options;

    const payload: any = {
      from: from,
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html,
      text: text,
      replyTo,
    };

    if (headers || locale) {
      payload.headers = {
        ...(headers ?? {}),
        ...(locale ? { "X-Preferred-Locale": locale } : {}),
      };
    }

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error("Error sending email via Resend:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception when sending email via Resend:", error);
    return false;
  }
}
