import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import type { RouterDeps } from "./context";

export const createTarotRouter = (deps: RouterDeps) =>
  router({
    // ── ציבורי: כל מה שהדף צריך כדי להציג פירוש ──
    getContent: publicProcedure.query(async () => {
      const [cards, intro] = await Promise.all([
        deps.db.listCardTexts(),
        deps.db.getTarotIntro(),
      ]);
      return { cards, intro, aiMonthlyLimit: deps.tarotAiMonthlyLimit };
    }),

    // ── מחובר: יתרת המכסה החודשית — להצגה בפאנל עוד לפני הלחיצה ──
    myUsage: protectedProcedure.query(async ({ ctx }) => {
      const limit = deps.tarotAiMonthlyLimit;
      const unlimited = ctx.user.role === "admin";
      const used = unlimited ? 0 : await deps.db.getTarotMonthlyUsage(ctx.user.dbId);
      return { used, limit, remaining: Math.max(0, limit - used), unlimited };
    }),

    // ── מחובר: פירוש AI לפריסה, מוגבל במכסה חודשית נפרדת ──
    interpret: protectedProcedure
      .input(
        z.object({
          // יכולה להיות ריקה — שליפה בלי שאלה היא קריאה כללית.
          question: z.string().trim().max(500).default(""),
          cards: z
            .array(
              z.object({
                name: z.string().max(128),
                summary: z.string().max(512),
                text: z.string().max(8000),
              }),
            )
            .length(3),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        // מתג ראשי מפאנל האדמין — כשכבוי, אין כל קריאת AI (הגנה לעומק מעבר להסתרה ב-UI).
        const intro = await deps.db.getTarotIntro();
        if (!intro.aiEnabled) {
          throw new TRPCError({ code: "FORBIDDEN", message: "AI_DISABLED" });
        }

        const userId = ctx.user.dbId; // המזהה המספרי ב-DB (ctx.user.id הוא ה-openId)
        const isAdmin = ctx.user.role === "admin";
        const limit = deps.tarotAiMonthlyLimit;

        if (!isAdmin) {
          const used = await deps.db.getTarotMonthlyUsage(userId);
          if (used >= limit) {
            throw new TRPCError({ code: "FORBIDDEN", message: "QUOTA_EXCEEDED" });
          }
        }

        // קריאת הספק. נכשלת → לא מגדילים מונה (count-on-success).
        const interpretation = await deps.generateTarotInterpretation({
          question: input.question,
          cards: input.cards,
        });

        let used = 0;
        if (!isAdmin) {
          used = await deps.db.incrementTarotMonthlyUsage(userId);
        }

        return {
          interpretation,
          usage: { used, limit, remaining: Math.max(0, limit - used) },
        };
      }),

    // ── אדמין: עריכה ──
    upsertCard: adminProcedure
      .input(
        z.object({
          cardId: z.string().min(1).max(16),
          name: z.string().max(128).default(""), // override לשם; ריק = ברירת המחדל מ-shared
          summary: z.string().max(512).default(""),
          interpretation: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        await deps.db.upsertCardText(input);
        return await deps.db.getCardText(input.cardId);
      }),

    updateIntro: adminProcedure
      .input(
        z.object({
          articleHtml: z.string().optional(),
          questionPrompt: z.string().max(512).optional(),
          questionHint: z.string().max(512).optional(),
          buttonLabel: z.string().max(128).optional(),
          aiEnabled: z.boolean().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        await deps.db.updateTarotIntro(input);
        return await deps.db.getTarotIntro();
      }),
  });
