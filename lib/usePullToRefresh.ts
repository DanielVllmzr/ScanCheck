import { useEffect, useRef, useState } from "react";

/**
 * Pull-to-refresh con progreso para PWAs en iOS (y navegadores sin gesto nativo).
 * - Solo actúa si estás scrolleado en el tope (scrollY === 0).
 * - Devuelve progreso (0..1) e isPulling para que puedas mostrar un indicador.
 * - Hace reload cuando el delta supera el threshold (por defecto 70px).
 */
export function usePullToRefresh(threshold = 70) {
  const [progress, setProgress] = useState(0);   // 0..1
  const [isPulling, setIsPulling] = useState(false);
  const reloadingRef = useRef(false);
  const startYRef = useRef(0);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startYRef.current = e.touches[0].clientY;
        setIsPulling(true);
        setProgress(0);
      } else {
        setIsPulling(false);
        setProgress(0);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0) {
        setProgress(0);
        return;
      }
      const p = Math.min(delta / threshold, 1);
      setProgress(p);

      // Si superó el umbral, recargamos con un pequeño delay para que se vea el snap final
      if (p >= 1 && !reloadingRef.current) {
        reloadingRef.current = true;
        try { (navigator as any).vibrate?.(10); } catch {}
        setTimeout(() => location.reload(), 180);
      }
    };

    const onTouchEnd = () => {
      setIsPulling(false);
      setProgress(0);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isPulling, threshold]);

  return { progress, isPulling };
}
