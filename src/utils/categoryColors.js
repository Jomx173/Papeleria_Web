const CATEGORY_PALETTE = [
  { bg: "#eef2ff", fg: "#4f46e5" },
  { bg: "#eff6ff", fg: "#2563eb" },
  { bg: "#ecfdf5", fg: "#059669" },
  { bg: "#fff7ed", fg: "#ea580c" },
  { bg: "#fdf2f8", fg: "#db2777" },
  { bg: "#f5f3ff", fg: "#7c3aed" },
  { bg: "#fef9c3", fg: "#a16207" },
  { bg: "#f0fdf9", fg: "#0d9488" },
];

export const getCategoryColor = (name) => {
  if (!name) return { bg: "#f1f5f9", fg: "#64748b" };
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
};