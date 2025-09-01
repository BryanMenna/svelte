// src/lib/utils/responsive.js
import { writable } from "svelte/store";

// store con el ancho de la pantalla
export const screenWidth = writable(0);

// breakpoint de diseño (puedes modificar según tus necesidades)
export const breakpoints = {
  sm: 640,   // mobile
  md: 768,   // tablet
  lg: 1024,  // desktop
  xl: 1280
};

// helpers
// @ts-ignore
export function isMobile(width) {
  return width < breakpoints.md;
}

// @ts-ignore
export function isTablet(width) {
  return width >= breakpoints.md && width < breakpoints.lg;
}

// @ts-ignore
export function isDesktop(width) {
  return width >= breakpoints.lg;
}

// listener para actualizar el store al redimensionar
export function initResponsive() {
  if (typeof window !== "undefined") {
    screenWidth.set(window.innerWidth);

    window.addEventListener("resize", () => {
      screenWidth.set(window.innerWidth);
    });
  }
}
