export const COLORES_DEFAULT = {
  principal: "#6366f1",
  secundario: "#ec4899",
};

export function normalizarHex(valor) {
  if (typeof valor !== "string") return null;
  let h = valor.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    h = h.split("").map((c) => c + c).join("");
  }
  return /^[0-9a-fA-F]{6}$/.test(h) ? `#${h.toLowerCase()}` : null;
}

export function getColorInicial() {
  let principal = COLORES_DEFAULT.principal;
  let secundario = COLORES_DEFAULT.secundario;
  try {
    principal = normalizarHex(localStorage.getItem("colorPrincipal")) || COLORES_DEFAULT.principal;
    secundario = normalizarHex(localStorage.getItem("colorSecundario")) || COLORES_DEFAULT.secundario;
  } catch {
    // sin localStorage se usan los colores por defecto
  }
  return { principal, secundario };
}

export function aplicarColores(principal, secundario) {
  const p = normalizarHex(principal);
  const s = normalizarHex(secundario);
  if (!p || !s) return;
  const root = document.documentElement;
  root.style.setProperty("--color-primary", p);
  root.style.setProperty("--color-secondary", s);
  try {
    localStorage.setItem("colorPrincipal", p);
    localStorage.setItem("colorSecundario", s);
  } catch {
    // sin localStorage disponible, solo se aplica en memoria
  }
}

export function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function darkenHex(hex, factor = 0.2) {
  const n = normalizarHex(hex);
  if (!n) return hex;
  const scale = 1 - Math.min(Math.max(factor, 0), 1);
  const to = (part) => {
    const v = Math.round(parseInt(part, 16) * scale);
    return v.toString(16).padStart(2, "0");
  };
  return `#${to(n.slice(1, 3))}${to(n.slice(3, 5))}${to(n.slice(5, 7))}`;
}