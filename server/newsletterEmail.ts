import { Resend } from "resend";
import { getNewsletterSubscribers, getSiteSettings } from "./db";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL =
  process.env.NEWSLETTER_FROM_EMAIL || "newsletter@ruach.club";

export interface ArticleEmailPayload {
  title: string;
  excerpt?: string | null;
  slug: string;
  coverImage?: string | null;
  category?: string | null;
  siteUrl: string;
}

function buildEmailHtml(
  article: ArticleEmailPayload,
  siteTitle: string,
  subscriberEmail: string
): string {
  const articleUrl = `${article.siteUrl}/articles/${article.slug}`;
  const unsubscribeUrl = `${article.siteUrl}/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`;
  const coverImageHtml = article.coverImage
    ? `<img src="${article.coverImage}" alt="${article.title}" style="width:100%;max-height:320px;object-fit:cover;border-radius:8px;margin-bottom:24px;" />`
    : "";
  const categoryHtml = article.category
    ? `<span style="display:inline-block;background:#8B6914;color:#fff;font-size:12px;padding:3px 10px;border-radius:20px;margin-bottom:12px;">${article.category}</span>`
    : "";
  const excerptHtml = article.excerpt
    ? `<p style="color:#b0a090;font-size:16px;line-height:1.7;margin:0 0 24px;">${article.excerpt}</p>`
    : "";

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${article.title}</title>
</head>
<body style="margin:0;padding:0;background:#1a1008;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1008;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#231508;border-radius:16px;overflow:hidden;border:1px solid #3a2a10;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid #3a2a10;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#c9a84c;letter-spacing:1px;">${siteTitle}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#7a6a50;">ניוזלטר</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${coverImageHtml}
              ${categoryHtml}
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#f0e6d0;line-height:1.4;">${article.title}</h1>
              ${excerptHtml}
              <a href="${articleUrl}" style="display:inline-block;background:#8B6914;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">קרא את המאמר המלא</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #3a2a10;text-align:center;">
              <p style="margin:0;font-size:12px;color:#5a4a30;">
                קיבלת מייל זה כי נרשמת לניוזלטר של ${siteTitle}.<br/>
                <a href="${unsubscribeUrl}" style="color:#8B6914;text-decoration:underline;">הסר אותי מהרשימה</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends a newsletter email to all active subscribers about a newly published article.
 * Returns { sent: number, failed: number }
 */
export async function sendArticleNewsletter(
  article: ArticleEmailPayload
): Promise<{ sent: number; failed: number }> {
  const settings = await getSiteSettings();
  const siteTitle = (settings as any)?.siteTitle || "רוּחַ חָכְמָה";

  const allSubscribers = await getNewsletterSubscribers();
  const active = allSubscribers.filter((s) => s.active);

  if (active.length === 0) {
    console.log("[Newsletter] No active subscribers — skipping email send.");
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  // Send in batches of 50 to avoid rate limits
  const BATCH_SIZE = 50;
  for (let i = 0; i < active.length; i += BATCH_SIZE) {
    const batch = active.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (subscriber) => {
        try {
          const html = buildEmailHtml(article, siteTitle, subscriber.email);
          const { error } = await resend.emails.send({
            from: `${siteTitle} <${FROM_EMAIL}>`,
            to: subscriber.email,
            subject: `מאמר חדש: ${article.title}`,
            html,
          });
          if (error) {
            console.error(
              `[Newsletter] Failed to send to ${subscriber.email}:`,
              error
            );
            failed++;
          } else {
            sent++;
          }
        } catch (err) {
          console.error(
            `[Newsletter] Exception sending to ${subscriber.email}:`,
            err
          );
          failed++;
        }
      })
    );
  }

  console.log(
    `[Newsletter] Article "${article.title}" sent: ${sent}, failed: ${failed}`
  );
  return { sent, failed };
}
