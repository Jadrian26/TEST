
import { useState, useCallback } from 'react';

interface UseToggleOutput {
  value: boolean;
  toggle: () => void;
  setOn: () => void;
  setOff: () => void;
  setValue: (value: boolean) => void;
}

/**
 * Hook personalizado para gestionar un estado booleano.
 * @param initialValue El valor booleano inicial (por defecto es false).
 * @returns Un objeto con el estado actual y funciones para manipularlo.
 */
function useToggle(initialValue: boolean = false): UseToggleOutput {
  const [value, setValue] = useState<boolean>(initialValue);

  const toggle = useCallback(() => {
    setValue(prevValue => !prevValue);
  }, []);

  const setOn = useCallback(() => {
    setValue(true);
  }, []);

  const setOff = useCallback(() => {
    setValue(false);
  }, []);

  return {
    value,
    toggle,
    setOn,
    setOff,
    setValue, // Directamente exponer setValue también puede ser útil
  };
}

export default useToggle;
