/**
 * useTarotJob — מחבר את מכונת המצבים (pages/tarot/job.ts) לרשת: פותח עבודה בשרת,
 * שואל על מצבה כל 3 שניות עד done/error, ומתחיל מחדש בשקט כשעבודה אבדה.
 * משותף לפירוש ה-AI (TarotAiPanel) ולשאלת ההמשך (TarotFollowUp).
 */
import { useEffect, useReducer, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  initialJob,
  jobPending,
  jobReducer,
  type JobError,
  type JobEvent,
  type JobMachine,
  type JobState,
} from "@/pages/tarot/job";

/** תדירות הבדיקה של עבודת הרקע. */
export const POLL_MS = 3000;

export interface TarotJobApi<TInput, TResult> {
  /** מזהה לסוג העבודה — מפריד בין מטמוני ה-polling של פירוש ושל שאלת המשך. */
  key: string;
  /** פותח עבודה בשרת ומחזיר jobId. */
  start: (input: TInput) => Promise<{ jobId: string }>;
  /** שואל על מצב העבודה; זורק שגיאת tRPC (עם data.code) כשאינה קיימת. */
  poll: (jobId: string) => Promise<JobState<TResult>>;
}

type ErrorLike = { message?: unknown; data?: { code?: unknown } | null } | null | undefined;

function errorCode(err: unknown): string | undefined {
  const code = (err as ErrorLike)?.data?.code;
  return typeof code === "string" ? code : undefined;
}

function errorMessage(err: unknown): string {
  const message = (err as ErrorLike)?.message;
  return typeof message === "string" && message ? message : "UNKNOWN_ERROR";
}

export function useTarotJob<TInput, TResult>(
  api: TarotJobApi<TInput, TResult>,
  opts: {
    /** נקרא פעם אחת לכל עבודה שהושלמה. */
    onDone?: (result: TResult) => void;
    /** אילו שגיאות פתיחה הן "עסקיות" (לא נספרות ככישלון). */
    isBusinessError?: (code: string | undefined, message: string) => boolean;
  } = {},
): {
  run: (input: TInput) => void;
  pending: boolean;
  result: TResult | null;
  error: JobError | null;
  failures: number;
  reset: () => void;
} {
  const [state, dispatch] = useReducer(
    jobReducer as (s: JobMachine<TResult>, e: JobEvent<TResult>) => JobMachine<TResult>,
    undefined,
    () => initialJob<TResult>(),
  );
  // הקלט של הריצה הנוכחית — נדרש להתחלה מחדש שקטה (אותה בקשה בדיוק).
  const inputRef = useRef<TInput | null>(null);
  // תמיד ה-callbacks העדכניים, בלי להפעיל מחדש את ה-effects.
  const apiRef = useRef(api);
  const optsRef = useRef(opts);
  apiRef.current = api;
  optsRef.current = opts;

  // כל עלייה ב-startNonce (run או התחלה מחדש שקטה) פותחת עבודה אחת בשרת.
  useEffect(() => {
    if (state.startNonce === 0 || inputRef.current === null) return;
    let cancelled = false;
    apiRef.current.start(inputRef.current).then(
      ({ jobId }) => {
        if (!cancelled) dispatch({ type: "started", jobId });
      },
      (err: unknown) => {
        if (cancelled) return;
        const code = errorCode(err);
        const message = errorMessage(err);
        const business = optsRef.current.isBusinessError?.(code, message) ?? false;
        dispatch({ type: "startFailed", error: { code, message, business } });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [state.startNonce]);

  // polling: כל 3 שניות כל עוד יש עבודה פעילה. ממשיך גם כשהלשונית ברקע. תקלת רשת
  // חולפת מקבלת ניסיון חוזר; ההחלטה מה לעשות עם כל תשובה — במכונת המצבים.
  const jobId = state.phase === "polling" ? state.jobId : null;
  const query = useQuery({
    queryKey: ["tarot-job", api.key, jobId],
    queryFn: () => apiRef.current.poll(jobId as string),
    enabled: !!jobId,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: true,
    retry: 2,
    refetchOnWindowFocus: false,
    gcTime: 0,
  });

  useEffect(() => {
    if (!jobId) return;
    // השגיאה קודמת: אחרי בדיקה מוצלחת אחת react-query משאיר את ה-data הישן ("pending")
    // גם כשהבדיקה הבאה נכשלת — ואז עבודה שאבדה הייתה נראית כממתינה לנצח.
    if (query.error) {
      dispatch({ type: "pollFailed", jobId, code: errorCode(query.error), message: errorMessage(query.error) });
    } else if (query.data) {
      dispatch({ type: "polled", jobId, job: query.data });
    }
  }, [jobId, query.data, query.error]);

  // מדווחים להורה פעם אחת לכל תוצאה.
  const reported = useRef<TResult | null>(null);
  useEffect(() => {
    if (state.result !== null && reported.current !== state.result) {
      reported.current = state.result;
      optsRef.current.onDone?.(state.result);
    }
  }, [state.result]);

  return {
    run: (input: TInput) => {
      inputRef.current = input;
      dispatch({ type: "run" });
    },
    pending: jobPending(state),
    result: state.result,
    error: state.error,
    failures: state.failures,
    reset: () => dispatch({ type: "reset" }),
  };
}
