import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { getSiteSettings } from "./db";

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
        // Get contact email from settings for display in notification
        const settings = await getSiteSettings();
        const contactEmail = (settings as any).contactEmail;
        const emailLine = contactEmail
          ? `\n\n📧 לתשובה ישירה: ${contactEmail}`
          : "";

        // Send notification to owner via Manus notification service
        const success = await notifyOwner({
          title: `📬 הודעה חדשה מא-${input.name} — יצירת קשר באתר`,
          content: [
            `📌 נושא: ${input.subject}`,
            `👤 שם: ${input.name}`,
            `📧 דוא"ל השולח: ${input.email}`,
            ``,
            `💬 הודעה:`,
            input.message,
            emailLine,
            ``,
            `---`,
            `הודעה זו נשלחה דרך טופס יצירת הקשר באתר רוּחַ`,
          ].join("\n"),
        });

        if (!success) {
          console.warn("[Contact] Failed to send notification to owner");
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
});
