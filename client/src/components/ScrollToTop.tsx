import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

/**
 * Scrolls the window to the top whenever the route changes, and moves keyboard
 * focus to the #main landmark so keyboard/screen-reader users start at the new
 * page's content instead of re-tabbing through the header (skipped on the
 * initial render — the browser's default focus is correct there).
 * Place this component inside the Router, before any Route definitions.
 */
export function ScrollToTop() {
  const [location] = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [location]);

  return null;
}
