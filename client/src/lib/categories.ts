// Legacy static map kept as fallback only
export const CATEGORY_MAP: Record<string, { label: string; description: string; color: string }> = {
  spirituality: {
    label: "רוחניות",
    description: "מסעות פנימיים, מדיטציה, ומודעות",
    color: "badge-spirituality",
  },
  philosophy: {
    label: "פילוסופיה",
    description: "שאלות קיום, אתיקה ומחשבה",
    color: "badge-philosophy",
  },
  healing: {
    label: "ריפוי",
    description: "גוף, נפש ואנרגיה",
    color: "badge-healing",
  },
};

export function getCategoryLabel(key: string) {
  return CATEGORY_MAP[key]?.label ?? key;
}

export function getCategoryBadgeClass(key: string) {
  return CATEGORY_MAP[key]?.color ?? "";
}
