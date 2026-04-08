import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";

export const contactRouter = router({
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
        // Send notification to owner
        const success = await notifyOwner({
          title: `הודעה חדשה מ-${input.name}`,
          content: `נושא: ${input.subject}\n\nדוא״ל: ${input.email}\n\nהודעה:\n${input.message}`,
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
