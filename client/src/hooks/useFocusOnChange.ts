import { useEffect, useRef, type RefObject } from "react";

/**
 * מעביר פוקוס לאלמנט (כותרת עם tabIndex={-1}) כשהמפתח משתנה — כשצעד מוחלף והפקד שהיה ממוקד
 * נעלם, הפוקוס לא נופל ל-body. לא מתפקד בעלייה הראשונה (לא גונבים פוקוס בטעינה), לא גולל,
 * ופועל רק אם הפוקוס אבד (body/null) או נמצא בתוך `container` — כך משתמש שהתרחק לא נמשך חזרה.
 */
export function useFocusOnChange(
  ref: RefObject<HTMLElement | null>,
  key: unknown,
  container?: RefObject<HTMLElement | null>,
) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const active = typeof document !== "undefined" ? document.activeElement : null;
    const lost = !active || active === document.body;
    const inside = !!active && !!container?.current && container.current.contains(active);
    if (lost || inside) ref.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
