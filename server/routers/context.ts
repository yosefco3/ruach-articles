// Router Dependency Injection Context
// Centralizes all external dependencies consumed by routers.
// Pass this into each router factory so no router imports db/external modules directly.

import type * as db from "../db";
import type { ArticleEmailPayload } from "../newsletterEmail";
import type { IchingAiContext, QuestionRefineResult } from "../ichingAi";
import type { TarotAiContext } from "../tarotAi";
import type { SpreadChoice } from "@shared/tarot";

export interface RouterDeps {
  db: typeof db;
  sendArticleNewsletter: (article: ArticleEmailPayload) => Promise<{ sent: number; failed: number }>;
  generateIchingInterpretation: (c: IchingAiContext) => Promise<string>;
  ichingAiMonthlyLimit: number;
  /** בודק שאלה לפני ההטלה ומציע ניסוחים חלופיים (fail-open, לעולם לא זורק). */
  evaluateIchingQuestion: (question: string) => Promise<QuestionRefineResult>;
  /** תקרת קריאות שכלול-שאלה לכל IP בשעה. */
  refineRatePerHour: number;
  generateTarotInterpretation: (c: TarotAiContext) => Promise<string>;
  /** מכסת פירושי טארוט חודשית — נפרדת ממכסת האי-צ'ינג. */
  tarotAiMonthlyLimit: number;
  /** ה-AI בוחר פריסה לשאלה לפני השליפה (fail-open ל-three, לעולם לא זורק). */
  chooseTarotSpread: (question: string) => Promise<SpreadChoice>;
  /** תקרת קריאות בחירת-פריסה לכל משתמש בשעה. */
  spreadRatePerHour: number;
}