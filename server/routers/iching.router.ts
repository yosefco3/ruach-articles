import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import { rateLimit } from "../_core/rateLimit";
import type { RouterDeps } from "./context";

/** מזהה ה-IP של הבקשה לצורך הגבלת-קצב; נופל ל-x-forwarded-for ואז ל-"unknown". */
function clientIp(req: { ip?: string; headers?: Record<string, unknown> }): string {
  const fwd = req.headers?.["x-forwarded-for"];
  const fromHeader = Array.isArray(fwd) ? fwd[0] : typeof fwd === "string" ? fwd.split(",")[0] : "";
  return req.ip || fromHeader.trim() || "unknown";
}

export const createIchingRouter = (deps: RouterDeps) =>
  router({
    // ── ציבורי: כל מה שהדף צריך כדי להציג פירוש ──
    getContent: publicProcedure.query(async () => {
      const [hexagrams, trigrams, intro] = await Promise.all([
        deps.db.listHexagramTexts(),
        deps.db.listTrigramTexts(),
        deps.db.getIchingIntro(),
      ]);
      return { hexagrams, trigrams, intro, aiMonthlyLimit: deps.ichingAiMonthlyLimit };
    }),

    // ── ציבורי: שכלול ניסוח השאלה לפני ההטלה (חופשי, מוגבל-קצב פר-IP) ──
    refineQuestion: publicProcedure
      .input(z.object({ question: z.string().trim().min(1).max(500) }))
      .mutation(async ({ ctx, input }) => {
        // Fail-open: מעבר לתקרה לא חוסם הטלה — פשוט מפסיק לבזבז קריאות AI.
        const key = `iching-refine:${clientIp(ctx.req)}`;
        if (!rateLimit(key, deps.refineRatePerHour, 3_600_000)) {
          return { problematic: false, suggestions: [] };
        }
        return await deps.evaluateIchingQuestion(input.question);
      }),

    // ── מחובר: פירוש AI מותאם-אישית, מוגבל במכסה חודשית ──
    interpret: protectedProcedure
      .input(
        z.object({
          question: z.string().trim().min(1).max(500),
          baseName: z.string().max(128),
          baseText: z.string().max(8000),
          resultName: z.string().max(128).default(""),
          resultText: z.string().max(8000).default(""),
          changingLines: z
            .array(z.object({ line: z.number().int().min(1).max(6), text: z.string().max(2000) }))
            .max(6)
            .default([]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.dbId; // המזהה המספרי ב-DB (ctx.user.id הוא ה-openId)
        const isAdmin = ctx.user.role === "admin";
        const limit = deps.ichingAiMonthlyLimit;

        if (!isAdmin) {
          const used = await deps.db.getMonthlyUsage(userId);
          if (used >= limit) {
            throw new TRPCError({ code: "FORBIDDEN", message: "QUOTA_EXCEEDED" });
          }
        }

        // הקריאה ל-Gemini. נכשלת → לא מגדילים מונה (count-on-success).
        const interpretation = await deps.generateIchingInterpretation({
          question: input.question,
          baseName: input.baseName,
          baseText: input.baseText,
          resultName: input.resultName,
          resultText: input.resultText,
          changingLines: input.changingLines,
        });

        let used = 0;
        if (!isAdmin) {
          used = await deps.db.incrementMonthlyUsage(userId);
        }

        return {
          interpretation,
          usage: { used, limit, remaining: Math.max(0, limit - used) },
        };
      }),

    // ── אדמין: עריכה ──
    upsertHexagram: adminProcedure
      .input(
        z.object({
          number: z.number().int().min(1).max(64),
          name: z.string().max(128).default(""), // override לשם; ריק = ברירת המחדל מ-shared
          trigramExplanation: z.string(),
          interpretation: z.string(),
          line1: z.string().default(""),
          line2: z.string().default(""),
          line3: z.string().default(""),
          line4: z.string().default(""),
          line5: z.string().default(""),
          line6: z.string().default(""),
        }),
      )
      .mutation(async ({ input }) => {
        await deps.db.upsertHexagramText(input);
        return await deps.db.getHexagramText(input.number);
      }),

    upsertTrigram: adminProcedure
      .input(
        z.object({
          trigramKey: z.enum(["qian", "kun", "zhen", "kan", "gen", "xun", "li", "dui"]),
          name: z.string().max(64).default(""), // override לשם/יסוד/תכונה; ריק = ברירת המחדל מ-shared
          element: z.string().max(64).default(""),
          attr: z.string().max(128).default(""),
          description: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        await deps.db.upsertTrigramText(input);
      }),

    updateIntro: adminProcedure
      .input(
        z.object({
          articleHtml: z.string().optional(),
          questionPrompt: z.string().max(512).optional(),
          questionHint: z.string().max(512).optional(),
          buttonLabel: z.string().max(128).optional(),
          refineEnabled: z.boolean().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        await deps.db.updateIchingIntro(input);
        return await deps.db.getIchingIntro();
      }),
  });
