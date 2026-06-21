import { useEffect } from "react";

/**
 * Keep document.title in sync on the client (SPA navigation). The initial,
 * crawler-visible <head> is rendered server-side by seo.ts (applySeoToHtml);
 * this only updates the title as the user navigates between routes.
 */
export function useDocumentTitle(title: string | undefined | null): void {
  useEffect(() => {
    if (typeof document !== "undefined" && title) {
      document.title = title;
    }
  }, [title]);
}
