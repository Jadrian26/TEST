
import { useState, useEffect } from 'react';

interface WindowSize {
  width: number | undefined;
  height: number | undefined;
}

/**
 * Hook personalizado para obtener el tamaño actual de la ventana del navegador.
 * @returns Un objeto con las propiedades 'width' y 'height'.
 *          Inicialmente, 'width' y 'height' pueden ser undefined si se ejecuta
 *          en un entorno sin 'window' (como SSR), o hasta que el efecto se monte.
 */
function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    // Handler para ser llamado en el evento de redimensionamiento
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Añadir event listener
    window.addEventListener('resize', handleResize);

    // Llamar al handler inmediatamente para establecer el tamaño inicial
    handleResize();

    // Limpiar el event listener al desmontar el componente
    return () => window.removeEventListener('resize', handleResize);
  }, []); // El array vacío asegura que el efecto solo se ejecute al montar y desmontar

  return windowSize;
}

export default useWindowSize;
