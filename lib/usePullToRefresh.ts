// lib/usePullToRefresh.ts
import { useEffect } from "react";

/**
 * Activa un pull-to-refresh simple en PWAs iOS:
 * - Solo activa si scroll está arriba del todo (scrollY === 0).
 * - Si el usuario arrastra hacia abajo > 70px, se recarga la página.
 */
export function usePullToRefresh(threshold = 70) {
  useEffect(() => {
    let startY = 0;
    let pulling = false;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      } else {
        pulling = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling) return;
      const delta = e.touches[0].clientY - startY;
      // si baja hacia abajo y supera threshold => refrescamos
      if (delta > threshold) {
        pulling = false;
        // pequeña vibración (si está disponible)
        try { (navigator as any).vibrate?.(10); } catch {}
        // recargar
        location.reload();
      }
    };

    const onTouchEnd = () => { pulling = false; };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [threshold]);
}
