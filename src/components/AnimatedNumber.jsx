import { useEffect, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function AnimatedNumber({ value, format = (v) => String(v), duration = 700, delay = 0 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value == null || value === "" || Number.isNaN(Number(value))) {
      return undefined;
    }
    if (prefersReducedMotion()) {
      const raf = requestAnimationFrame(() => setDisplay(Number(value)));
      return () => cancelAnimationFrame(raf);
    }
    const target = Number(value);
    let raf = 0;
    let started = false;
    let start = 0;
    const timer = setTimeout(() => {
      const loop = (now) => {
        if (!started) {
          started = true;
          start = now;
        }
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(target * eased);
        if (t < 1) raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value, duration, delay]);

  if (value == null || value === "") return "—";
  return format(display);
}

export default AnimatedNumber;