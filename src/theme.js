export const COLORES_DEFAULT = {
  principal: "#4f46e5",
  secundario: "#ec4899",
};

export function getColorInicial() {
  try {
    const principal = localStorage.getItem("colorPrincipal");
    const secundario = localStorage.getItem("colorSecundario");
    return {
      principal: principal || COLORES_DEFAULT.principal,
      secundario: secundario || COLORES_DEFAULT.secundario,
    };
  } catch {
    return COLORES_DEFAULT;
  }
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function darkenHex(hex, amount = 0.15) {
  const factor = 1 - amount;
  const [r, g, b] = hexToRgb(hex);
  const toHex = (v) => Math.round(v * factor).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function aplicarColores(principal, secundario) {
  const root = document.documentElement;
  root.style.setProperty("--color-primary", principal);
  root.style.setProperty("--color-primary-dark", darkenHex(principal));
  root.style.setProperty("--color-secondary", secundario);
  try {
    localStorage.setItem("colorPrincipal", principal);
    localStorage.setItem("colorSecundario", secundario);
  } catch {
    // sin localStorage disponible, solo se aplica en memoria
  }
}

export function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}