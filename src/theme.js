export const COLORES_DEFAULT = {
  principal: "#4f46e5",
  secundario: "#ec4899",
};

export function normalizarHex(valor) {
  if (typeof valor !== "string") return null;
  let h = valor.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
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

export function hexToRgb(hex) {
  const h = (normalizarHex(hex) || hex).replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function darkenHex(hex, amount = 0.15) {
  const factor = 1 - amount;
  const [r, g, b] = hexToRgb(hex);
  const toHex = (v) => Math.round(v * factor).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function bannerPattern(principal) {
  const h = principal.replace("#", "");
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Ccircle cx='3' cy='3' r='1.6' fill='%23${h}' fill-opacity='0.12'/%3E%3Ccircle cx='19' cy='19' r='0.9' fill='%23${h}' fill-opacity='0.10'/%3E%3Cpath d='M21 5 l-4 4' stroke='%23${h}' stroke-width='1' stroke-opacity='0.10'/%3E%3C/svg%3E")`;
}

export function aplicarColores(principal, secundario) {
  const p = normalizarHex(principal);
  const s = normalizarHex(secundario);
  if (!p || !s) return;
  const root = document.documentElement;
  root.style.setProperty("--color-primary", p);
  root.style.setProperty("--color-primary-dark", darkenHex(p));
  root.style.setProperty("--color-secondary", s);
  root.style.setProperty("--banner-pattern", bannerPattern(p));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", p);
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