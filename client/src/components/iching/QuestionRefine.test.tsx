import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { QuestionRefine } from "./QuestionRefine";

describe("QuestionRefine", () => {
  const original = "האם הוא אוהב אותי?";
  const suggestions = ["מהי הדינמיקה של הקשר בינינו?", "כיצד נכון עבורי להתייחס לקשר?"];

  it("renders both suggestions and the original question", () => {
    const html = renderToString(
      <QuestionRefine original={original} suggestions={suggestions} onPick={() => {}} />,
    );
    expect(html).toContain(suggestions[0]);
    expect(html).toContain(suggestions[1]);
    expect(html).toContain(original);
    expect(html).toContain("הניסוח שלי");
  });

  it("labels two suggestions with א׳/ב׳ badges", () => {
    const html = renderToString(
      <QuestionRefine original={original} suggestions={suggestions} onPick={() => {}} />,
    );
    expect(html).toContain("ניסוח מוצע א׳");
    expect(html).toContain("ניסוח מוצע ב׳");
  });

  it("shows a single unlettered badge when only one suggestion is given", () => {
    const html = renderToString(
      <QuestionRefine original={original} suggestions={[suggestions[0]]} onPick={() => {}} />,
    );
    expect(html).toContain("ניסוח מוצע");
    expect(html).not.toContain("ניסוח מוצע א׳");
  });
});
