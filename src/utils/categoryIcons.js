import {
  FaTag,
  FaBook,
  FaPen,
  FaPalette,
  FaPaperclip,
  FaRulerCombined,
  FaCut,
  FaScroll,
} from "react-icons/fa";

const ICON_RULES = [
  { keywords: ["cuaderno", "libro", "libreta"], icon: FaBook },
  { keywords: ["escritura", "boligrafo", "lapicero", "pluma", "lapiz", "marcador", "resaltador"], icon: FaPen },
  { keywords: ["arte", "pintura", "dibujo"], icon: FaPalette },
  { keywords: ["oficina", "clip"], icon: FaPaperclip },
  { keywords: ["escolar", "regla", "geometria", "geometrico"], icon: FaRulerCombined },
  { keywords: ["accesorio", "tijera", "cutter"], icon: FaCut },
  { keywords: ["papel", "cartulina", "carta", "hoja"], icon: FaScroll },
];

const normalize = (text) =>
  (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const getCategoryIcon = (name) => {
  const lower = normalize(name);
  for (const rule of ICON_RULES) {
    if (rule.keywords.some((keyword) => lower.includes(keyword))) {
      return rule.icon;
    }
  }
  return FaTag;
};