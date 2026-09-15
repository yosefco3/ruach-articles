import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import { rateLimit } from "../_core/rateLimit";
import { MAX_CHOICE_OPTIONS, MAX_OPTION_LENGTH, THREE_SPREAD, normalizeSpreadChoice, spreadSize } from "@shared/tarot";
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

    // ── מחובר: ה-AI בוחר את הפריסה לשאלה, לפני השליפה. לא נספר במכסה; fail-open ל-three ──
    chooseSpread: protectedProcedure
      .input(z.object({ question: z.string().trim().min(1).max(500) }))
      .mutation(async ({ ctx, input }) => {
        // מתג ה-AI הראשי כבוי → בלי AI תמיד שלושה קלפים (וגם בלי קריאה לספק).
        const intro = await deps.db.getTarotIntro();
        if (!intro.aiEnabled) return THREE_SPREAD;
        // מעבר לתקרה לא חוסם שליפה — פשוט מפסיק לבזבז קריאות AI.
        const key = `tarot-spread:${ctx.user.dbId}`;
        if (!rateLimit(key, deps.spreadRatePerHour, 3_600_000)) {
          console.warn("[tarot] chooseSpread: rate-limited user", ctx.user.dbId);
          return THREE_SPREAD;
        }
        const t0 = Date.now();
        const chosen = await deps.chooseTarotSpread(input.question);
        // משך + תוצאה (בלי השאלה — פרטיות) — כדי לכייל את ה-timeout בקליינט.
        console.log(`[tarot] chooseSpread → ${chosen.kind}(${chosen.options.length}) in ${Date.now() - t0}ms`);
        return chosen;
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
            .min(3)
            .max(10),
          // הפריסה שנפרסה (ברירת מחדל three). מספר הקלפים חייב להתאים לתוכנית.
          spread: z
            .object({
              kind: z.enum(["three", "choice"]),
              options: z.array(z.string().trim().min(1).max(MAX_OPTION_LENGTH)).max(MAX_CHOICE_OPTIONS).default([]),
            })
            .optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const spread = normalizeSpreadChoice(input.spread);
        if (input.cards.length !== spreadSize(spread)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "SPREAD_SIZE_MISMATCH" });
        }

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
        const t0 = Date.now();
        let interpretation: string;
        try {
          interpretation = await deps.generateTarotInterpretation({
            question: input.question,
            cards: input.cards,
            spread,
          });
        } catch (err) {
          // בלי השאלה (פרטיות) — רק הפריסה, המשך והשגיאה, כדי שאפשר יהיה לאבחן בפרוד.
          console.error(
            `[tarot] interpret failed (${spread.kind}, ${input.cards.length} cards) after ${Date.now() - t0}ms:`,
            err instanceof Error ? err.message : err,
          );
          throw err;
        }
        console.log(`[tarot] interpret ok (${spread.kind}, ${input.cards.length} cards) in ${Date.now() - t0}ms`);

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
