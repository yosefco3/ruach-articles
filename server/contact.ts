import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getSiteSettings, getTeacherById } from "./db";
import { DEFAULT_FROM_EMAIL } from "@shared/const";

export const contactRouter = router({
  // Public: get contact email for display on contact page
  getEmail: publicProcedure.query(async () => {
    const settings = await getSiteSettings();
    return { email: (settings as any).contactEmail ?? null };
  }),

  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "שם חייב להיות לפחות 2 תווים"),
        email: z.string().email("כתובת דוא״ל לא תקינה"),
        subject: z.string().min(5, "הנושא חייב להיות לפחות 5 תווים"),
        message: z.string().min(10, "ההודעה חייבת להיות לפחות 10 תווים"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Get contact email from settings
        const settings = await getSiteSettings();
        const adminEmail = (settings as any).contactEmail;
        const siteName = (settings as any).siteTitle || "רוּחַ";

        // Send email notification to admin via Resend
        if (adminEmail) {
          try {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);
            const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || DEFAULT_FROM_EMAIL;
            
            await resend.emails.send({
              from: `${siteName} <${FROM_EMAIL}>`,
              to: adminEmail,
              subject: `📬 הודעה חדשה מ-${input.name} — יצירת קשר באתר`,
              html: `<div dir="rtl" style="font-family:Arial,sans-serif;background:#1a1008;color:#f0e6d0;padding:32px;border-radius:12px;max-width:600px;">
  <h2 style="color:#c9a84c;">📬 הודעה חדשה מטופס יצירת קשר</h2>
  <div style="background:#231508;border-radius:8px;padding:20px;margin:20px 0;border-right:4px solid #c9a84c;">
    <p style="margin:8px 0;"><strong>📌 נושא:</strong> ${input.subject}</p>
    <p style="margin:8px 0;"><strong>👤 שם:</strong> ${input.name}</p>
    <p style="margin:8px 0;"><strong>📧 דוא"ל השולח:</strong> <a href="mailto:${input.email}" style="color:#c9a84c;">${input.email}</a></p>
  </div>
  <div style="background:#231508;border-radius:8px;padding:16px;margin:16px 0;">
    <p style="margin:0 0 8px 0;"><strong>💬 הודעה:</strong></p>
    <p style="margin:0;white-space:pre-wrap;">${input.message}</p>
  </div>
  <p style="font-size:12px;color:#8B7355;margin-top:24px;">הודעה זו נשלחה דרך טופס יצירת הקשר באתר ${siteName}</p>
</div>`,
            });
          } catch (emailError) {
            console.error("[Contact] Failed to send email notification:", emailError);
          }
        }

        return {
          success: true,
          message: "ההודעה נשלחה בהצלחה. תודה על יצירת הקשר!",
        };
      } catch (error) {
        console.error("[Contact] Error submitting contact form:", error);
        return {
          success: false,
          message: "שגיאה בשליחת ההודעה. אנא נסו שוב מאוחר יותר.",
        };
      }
    }),

  /**
   * הודעה למורה בשיטה דרך האתר (site-pivot-books): נשלחת ל-teachers.contactEmail,
   * שלעולם אינו נחשף ללקוח. מורה בלי מייל קשר → ההודעה הולכת למייל האתר.
   */
  toTeacher: publicProcedure
    .input(
      z.object({
        teacherId: z.number().int(),
        name: z.string().min(2, "שם חייב להיות לפחות 2 תווים").max(120),
        email: z.string().email("כתובת דוא״ל לא תקינה"),
        message: z.string().min(10, "ההודעה חייבת להיות לפחות 10 תווים").max(5000),
      }),
    )
    .mutation(async ({ input }) => {
      const teacher = await getTeacherById(input.teacherId);
      if (!teacher || !teacher.visible) return { success: false, message: "המורה לא נמצא" };
      const settings = await getSiteSettings();
      const to = teacher.contactEmail || (settings as any).contactEmail;
      const siteName = (settings as any).siteTitle || "דרך הרוח";
      if (!to) return { success: false, message: "לא הוגדר מייל ליצירת קשר" };
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || DEFAULT_FROM_EMAIL;
        const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
        await resend.emails.send({
          from: `${siteName} <${FROM_EMAIL}>`,
          to,
          replyTo: input.email,
          subject: `✉️ פנייה מ-${input.name} דרך דף המורה שלך באתר ${siteName}`,
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;max-width:600px;">
  <p>שלום ${esc(teacher.name)},</p>
  <p>התקבלה פנייה דרך דף המורה שלך באתר ${esc(siteName)}:</p>
  <p><strong>מאת:</strong> ${esc(input.name)} &lt;${esc(input.email)}&gt;</p>
  <p style="white-space:pre-wrap;border-right:3px solid #c9a84c;padding-right:12px;">${esc(input.message)}</p>
  <p style="font-size:12px;color:#888;">אפשר להשיב ישירות למייל הזה.</p>
</div>`,
        });
        return { success: true, message: "ההודעה נשלחה למורה. תודה!" };
      } catch (error) {
        console.error("[Contact] Failed to send teacher message:", error);
        return { success: false, message: "שגיאה בשליחת ההודעה. אנא נסו שוב מאוחר יותר." };
      }
    }),
});
