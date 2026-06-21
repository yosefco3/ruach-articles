/**
 * שלושת המטבעות — פורט מ-`coinsEl` באב-טיפוס.
 * `flipping` מפעיל את אנימציית `coinFlip`; `faces` (2/3) מציג את התוצאה ותווית יִין/יָאנְג.
 */
import type { CoinFace } from "@shared/iching";

export interface CoinsProps {
  faces: CoinFace[] | null;
  flipping: boolean;
}

const LABELS: Record<CoinFace, string> = { 3: "יָאנְג", 2: "יִין" };
const FLIP_GRAD = "linear-gradient(135deg,#e7c982,#9c7a3a)";
const HEADS_GRAD = "radial-gradient(circle at 35% 30%,#f6e0a0,#c89a40 68%,#9a7328)";
const TAILS_GRAD = "radial-gradient(circle at 35% 30%,#d7bd84,#927339 68%,#6d5526)";

export function Coins({ faces, flipping }: CoinsProps) {
  return (
    <div style={{ display: "flex", gap: 28, justifyContent: "center" }}>
      {[0, 1, 2].map((i) => {
        const face = faces ? faces[i] : null;
        const grad = face ? (face === 3 ? HEADS_GRAD : TAILS_GRAD) : FLIP_GRAD;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 66,
                height: 66,
                borderRadius: "50%",
                background: grad,
                border: "2px solid rgba(255,244,210,0.4)",
                boxShadow:
                  "0 10px 22px rgba(0,0,0,0.45), inset 0 2px 7px rgba(255,255,255,0.3), inset 0 -3px 8px rgba(60,40,10,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: flipping ? `coinFlip 0.55s linear ${i * 0.09}s infinite` : "none",
              }}
            >
              <div
                style={{
                  width: 15,
                  height: 15,
                  background: "radial-gradient(circle,#1a160f,#2a2316)",
                  borderRadius: 3,
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.7)",
                }}
              />
            </div>
            <div
              style={{
                minHeight: 22,
                marginTop: 10,
                textAlign: "center",
                fontFamily: "'Frank Ruhl Libre',serif",
                fontWeight: 700,
                fontSize: 16,
                color: face ? (face === 3 ? "#f0d690" : "#cdb079") : "transparent",
              }}
            >
              {face ? `${face} · ${LABELS[face]}` : "·"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
