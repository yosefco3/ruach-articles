import type { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

/** הודעת פרטיות קצרה בנקודת איסוף מידע (סעיף 11 לחוק הגנת הפרטיות). */
export function PrivacyNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      {children}{" "}
      <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">מדיניות הפרטיות</Link>
    </p>
  );
}
