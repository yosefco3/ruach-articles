/** שדה השאלה בדפי הקריאה — תווית מקושרת לתיבת הטקסט (htmlFor/id) ומסגרת פוקוס גלויה. */
import { useId } from "react";

export function QuestionField({
  prompt,
  value,
  onChange,
  placeholder,
  labelStyle,
  textareaStyle,
}: {
  prompt: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  labelStyle: React.CSSProperties;
  textareaStyle: React.CSSProperties;
}) {
  const id = useId();
  return (
    <>
      <label htmlFor={id} style={labelStyle}>
        {prompt}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        style={textareaStyle}
      />
    </>
  );
}
