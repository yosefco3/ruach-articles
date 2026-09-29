/**
 * מכונת המצבים של עבודת רקע בטארוט (פירוש AI / שאלת המשך) — טהורה וניתנת לבדיקה.
 * השרת מחזיר jobId מיד, והלקוח שואל על התוצאה כל כמה שניות. ה-hook (useTarotJob) רק
 * מחבר את המכונה הזו לרשת; כל ההחלטות — מתי להמשיך לשאול, מתי להתחיל מחדש בשקט,
 * מה נספר ככישלון — מתקבלות כאן.
 */

/** מצב עבודה כפי שהשרת מחזיר אותו (server/_core/jobs.ts). */
export type JobState<T> =
  | { status: "pending" }
  | { status: "done"; result: T }
  | { status: "error"; message: string };

export interface JobError {
  /** קוד tRPC (FORBIDDEN, NOT_FOUND…) — חסר כשלא הגיעה תשובת שרת. */
  code?: string;
  message: string;
  /**
   * שגיאה "עסקית" (מכסה מוצתה, תקרת שאלות, קריאה שפגה): אינה תקלה, אינה נספרת
   * ככישלון, וניסיון חוזר לא יעזור.
   */
  business: boolean;
}

export interface JobMachine<T> {
  phase: "idle" | "starting" | "polling" | "done" | "failed";
  jobId: string | null;
  result: T | null;
  error: JobError | null;
  /** כשלים אמיתיים רצופים — מתאפס בהצלחה. אחרי כמה כאלה מתנצלים במקום להציע ניסיון חוזר. */
  failures: number;
  /** האם כבר התחלנו מחדש בשקט פעם אחת בריצה הנוכחית. */
  autoRestarted: boolean;
  /** עולה בכל פעם שצריך לפתוח עבודה בשרת (run או התחלה מחדש שקטה). */
  startNonce: number;
}

export type JobEvent<T> =
  /** המשתמש לחץ — פותחים עבודה חדשה. */
  | { type: "run" }
  | { type: "started"; jobId: string }
  | { type: "startFailed"; error: JobError }
  | { type: "polled"; jobId: string; job: JobState<T> }
  /** שאילתת המעקב נכשלה. code חסר = לא הגיעה תשובת שרת (רשת נקטעה). */
  | { type: "pollFailed"; jobId: string; code?: string; message: string }
  | { type: "reset" };

export function initialJob<T>(): JobMachine<T> {
  return {
    phase: "idle",
    jobId: null,
    result: null,
    error: null,
    failures: 0,
    autoRestarted: false,
    startNonce: 0,
  };
}

export function jobReducer<T>(state: JobMachine<T>, event: JobEvent<T>): JobMachine<T> {
  switch (event.type) {
    case "run":
      return {
        ...state,
        phase: "starting",
        jobId: null,
        result: null,
        error: null,
        autoRestarted: false,
        startNonce: state.startNonce + 1,
      };

    case "started":
      if (state.phase !== "starting") return state;
      return { ...state, phase: "polling", jobId: event.jobId };

    case "startFailed":
      if (state.phase !== "starting") return state;
      return {
        ...state,
        phase: "failed",
        jobId: null,
        error: event.error,
        failures: event.error.business ? state.failures : state.failures + 1,
      };

    case "polled": {
      // תשובה של עבודה ישנה (למשל אחרי התחלה מחדש) — מתעלמים.
      if (state.phase !== "polling" || event.jobId !== state.jobId) return state;
      const { job } = event;
      if (job.status === "pending") return state;
      if (job.status === "done") {
        return { ...state, phase: "done", jobId: null, result: job.result, error: null, failures: 0 };
      }
      // שגיאת ספק — כישלון אמיתי; ניסיון חוזר יפתח עבודה חדשה.
      return {
        ...state,
        phase: "failed",
        jobId: null,
        error: { message: job.message, business: false },
        failures: state.failures + 1,
      };
    }

    case "pollFailed": {
      if (state.phase !== "polling" || event.jobId !== state.jobId) return state;
      // לא הגיעה תשובת שרת (מובייל שעבר לרקע, 4G מהבהב) — זו לא תקלה של הפירוש;
      // ממשיכים לשאול ולא מציגים שגיאה.
      if (!event.code) return state;
      // העבודה אבדה בשרת (פריסה חדשה באמצע) — פותחים עבודה חדשה פעם אחת, בשקט.
      // בטוח: המכסה והתקרה נספרות רק כשעבודה הושלמה.
      if (event.code === "NOT_FOUND" && !state.autoRestarted) {
        return {
          ...state,
          phase: "starting",
          jobId: null,
          autoRestarted: true,
          startNonce: state.startNonce + 1,
        };
      }
      return {
        ...state,
        phase: "failed",
        jobId: null,
        error: { code: event.code, message: event.message, business: false },
        failures: state.failures + 1,
      };
    }

    case "reset":
      return initialJob<T>();
  }
}

/** העבודה בדרך: נפתחת או ממתינה לתוצאה. */
export function jobPending<T>(state: JobMachine<T>): boolean {
  return state.phase === "starting" || state.phase === "polling";
}
