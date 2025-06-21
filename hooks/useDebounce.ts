
import { useState, useEffect } from 'react';

/**
 * Hook personalizado para debouncing de un valor.
 * @param value El valor a debouncing.
 * @param delay El tiempo de retraso en milisegundos.
 * @returns El valor con debounce.
 */
function useDebounce<T>(value: T, delay: number): T {
  // Estado para almacenar el valor con debounce
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(
    () => {
      // Configurar un temporizador para actualizar el valor con debounce
      // después de que el 'delay' haya transcurrido desde el último cambio de 'value'.
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Limpiar el temporizador si 'value' o 'delay' cambian antes de que el temporizador expire.
      // Esto asegura que el valor con debounce solo se actualice después de que el usuario
      // haya dejado de interactuar (o el valor haya dejado de cambiar) durante el 'delay' especificado.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Solo volver a ejecutar el efecto si 'value' o 'delay' cambian
  );

  return debouncedValue;
}

export default useDebounce;
