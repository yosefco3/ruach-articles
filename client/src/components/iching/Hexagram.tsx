/**
 * תצוגת הקסגרמה — פורט מ-`lineEl`/`hexEl` באב-טיפוס.
 * מצייר 6 קווים מלמטה למעלה (אינדקס slots-1 … 0): yang = פס מלא, yin = שני פסים,
 * קו משתנה = סימון עיגול. תומך בבנייה הדרגתית (animateNewest) ובכניסה מדורגת (stagger).
 */
import type { CSSProperties } from "react";
import type { Line } from "@shared/iching";

export interface HexagramProps {
  lines: (Line | undefined)[];
  slots?: number;
  big?: boolean;
  mid?: boolean;
  color: string;
  mark: string;
  placeholder?: string;
  shadow?: string;
  stagger?: boolean;
  animateNewest?: boolean;
}

interface LineOpts {
  big?: boolean;
  mid?: boolean;
  color: string;
  mark: string;
  placeholder?: string;
  shadow?: string;
  newest?: boolean;
  stagger?: number;
}

function bar(width: string, color: string, shadow?: string, key?: string) {
  return (
    <div
      key={key}
      style={{ width, height: "100%", borderRadius: 3.5, background: color, boxShadow: shadow ?? "none" }}
    />
  );
}

function LineEl({ ln, opts }: { ln?: Line; opts: LineOpts }) {
  const w = opts.big ? 192 : opts.mid ? 104 : 90;
  const h = opts.big ? 22 : 13;
  const gap = opts.big ? 32 : 18;

  let animation = "none";
  if (opts.newest) animation = "lineReveal 0.5s ease both";
  else if (opts.stagger != null) animation = `lineReveal 0.5s ease ${opts.stagger * 0.1}s both`;

  if (!ln) {
    return (
      <div
        style={{ width: w, height: h, borderRadius: 3.5, border: `1px dashed ${opts.placeholder}`, opacity: 0.45 }}
      />
    );
  }

  const inner = ln.isYang ? (
    bar("100%", opts.color, opts.shadow)
  ) : (
    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", height: "100%" }}>
      {bar(`calc(50% - ${gap / 2}px)`, opts.color, opts.shadow, "l")}
      {bar(`calc(50% - ${gap / 2}px)`, opts.color, opts.shadow, "r")}
    </div>
  );

  const wrapStyle: CSSProperties = { position: "relative", width: w, height: h, animation };
  const m = opts.big ? 13 : 10;

  return (
    <div style={wrapStyle}>
      {inner}
      {ln.isChanging && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            width: m,
            height: m,
            borderRadius: "50%",
            border: `2px solid ${opts.mark}`,
            boxShadow: `0 0 12px ${opts.mark}`,
            background: "transparent",
          }}
        />
      )}
    </div>
  );
}

export function Hexagram({
  lines,
  slots = 6,
  big,
  mid,
  color,
  mark,
  placeholder,
  shadow,
  stagger,
  animateNewest,
}: HexagramProps) {
  const rows = [];
  for (let i = slots - 1; i >= 0; i--) {
    rows.push(
      <LineEl
        key={i}
        ln={lines[i]}
        opts={{
          big,
          mid,
          color,
          mark,
          placeholder,
          shadow,
          newest: animateNewest && i === lines.length - 1,
          stagger: stagger ? slots - 1 - i : undefined,
        }}
      />,
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: big ? 11 : 8, alignItems: "center" }}>
      {rows}
    </div>
  );
}
