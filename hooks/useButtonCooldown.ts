import { useState, useCallback, useRef, useEffect } from 'react';

interface UseButtonCooldownOutput<T extends (...args: any[]) => Promise<any>> {
  trigger: (...args: Parameters<T>) => Promise<void>;
  isCoolingDown: boolean;
  timeLeft: number;
  resetCooldown: () => void;
}

/**
 * Hook para gestionar un período de enfriamiento para una acción de botón.
 * @param action La función asíncrona a ejecutar.
 * @param cooldownDuration Duración del enfriamiento en milisegundos.
 */
function useButtonCooldown<T extends (...args: any[]) => Promise<any>>(
  action: T,
  cooldownDuration: number
): UseButtonCooldownOutput<T> {
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const resetCooldown = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsCoolingDown(false);
    setTimeLeft(0);
  }, []);

  const trigger = useCallback(async (...args: Parameters<T>) => {
    if (isCoolingDown) return;

    await action(...args); // Ejecutar la acción

    setIsCoolingDown(true);
    setTimeLeft(Math.ceil(cooldownDuration / 1000));

    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    timerRef.current = window.setTimeout(() => {
      resetCooldown();
    }, cooldownDuration);

    intervalRef.current = window.setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

  }, [action, cooldownDuration, isCoolingDown, resetCooldown]);

  useEffect(() => {
    // Limpieza al desmontar
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { trigger, isCoolingDown, timeLeft, resetCooldown };
}

export default useButtonCooldown;
