
import { useEffect, useRef } from 'react';

/**
 * Hook personalizado para ejecutar una función de callback a intervalos regulares.
 *
 * @param callback La función a ejecutar.
 * @param delay El intervalo de tiempo en milisegundos. Si es null, el intervalo se detiene.
 */
function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef<(() => void) | undefined>(undefined);

  // Recordar el último callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Configurar el intervalo.
  useEffect(() => {
    function tick() {
      const currentCb = savedCallback.current;
      if (currentCb) {
        currentCb();
      }
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default useInterval;
