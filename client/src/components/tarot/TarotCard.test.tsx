import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { TarotCard } from "./TarotCard";
import type { CardView } from "@/pages/tarot/model";

const view: CardView = {
  id: "major-00",
  name: "השוטה",
  en: "The Fool",
  summary: "התחלה חדשה",
  interpretationHtml: "<p>פירוש</p>",
  imageUrl: "/tarot-cards/major-00.webp",
  suitLabel: "אַרְקָנָה גְּדוֹלָה",
};

describe("TarotCard", () => {
  it("face-down: rotated to the back, aria says covered card", () => {
    const html = renderToString(<TarotCard view={view} faceUp={false} />);
    expect(html).toContain("rotateY(180deg)");
    expect(html).toContain("קלף מכוסה");
    expect(html).toContain("/tarot-cards/back.webp");
  });

  it("face-up: no back rotation on the flipper, aria carries the card name", () => {
    const html = renderToString(<TarotCard view={view} faceUp />);
    expect(html).toContain("rotateY(0deg)");
    expect(html).toContain('aria-label="השוטה"');
    expect(html).toContain("/tarot-cards/major-00.webp");
    expect(html).toContain('alt="השוטה"');
  });

  it("undealt card is transparent and shifted; clickable card gets role=button", () => {
    const undealt = renderToString(<TarotCard view={view} faceUp={false} dealt={false} />);
    expect(undealt).toContain("opacity:0");
    const clickable = renderToString(<TarotCard view={view} faceUp onClick={() => {}} />);
    expect(clickable).toContain('role="button"');
  });
});
