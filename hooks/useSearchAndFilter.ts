import { useState, useMemo, useCallback } from 'react';

interface UseSearchAndFilterConfig<T> {
  searchKeys?: (keyof T)[]; // Keys for text search
  // initialFilters?: Record<string, any>; // Could be added for default filters
}

interface UseSearchAndFilterOutput<T> {
  processedData: T[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: Record<string, any>; // Represents active filters
  setFilter: (filterKey: string, value: any) => void;
  removeFilter: (filterKey: string) => void;
  clearAllFilters: () => void;
  clearSearch: () => void;
}

/**
 * Hook para buscar y filtrar un array de datos.
 * @param initialData Array inicial de objetos de tipo T.
 * @param config Objeto de configuración opcional con searchKeys.
 */
export function useSearchAndFilter<T extends Record<string, any>>(
  initialDataInput: T[] | null | undefined,
  config?: UseSearchAndFilterConfig<T>
): UseSearchAndFilterOutput<T> {
  // Normalizar initialDataInput a un array vacío si es null o undefined
  const initialData = useMemo(() => initialDataInput ?? [], [initialDataInput]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleSetSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleSetFilter = useCallback((filterKey: string, value: any) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterKey]: value,
    }));
  }, []);

  const handleRemoveFilter = useCallback((filterKey: string) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      delete newFilters[filterKey];
      return newFilters;
    });
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const processedData = useMemo(() => {
    let result = [...initialData];

    // Aplicar búsqueda por texto
    if (searchTerm.trim() && config?.searchKeys && config.searchKeys.length > 0) {
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      result = result.filter(item =>
        config.searchKeys!.some(key => {
          const itemValue = item[key];
          // Asegurar que el valor no sea null o undefined antes de convertir a string
          return itemValue !== null && itemValue !== undefined && String(itemValue).toLowerCase().includes(lowerSearchTerm);
        }
        )
      );
    }

    // Aplicar filtros
    const activeFilterKeys = Object.keys(filters).filter(
      key => filters[key] !== undefined && filters[key] !== null && String(filters[key]).trim() !== ''
    );

    if (activeFilterKeys.length > 0) {
      result = result.filter(item => {
        return activeFilterKeys.every(key => {
          const itemValue = item[key as keyof T];
          const filterValue = filters[key];
          
          // Asegurar que itemValue no sea null o undefined antes de comparar
          if (itemValue === null || itemValue === undefined) {
            return false; // O true, dependiendo de cómo quieras tratar los nulos en el filtrado
          }

          // Comparación flexible (includes) para cadenas, igualdad para otros tipos.
          // Podrías querer una lógica de comparación más específica aquí.
          if (typeof itemValue === 'string' && typeof filterValue === 'string') {
            return itemValue.toLowerCase().includes(filterValue.toLowerCase());
          }
          // Para comparaciones exactas (ej. IDs, estados booleanos)
           return String(itemValue).toLowerCase() === String(filterValue).toLowerCase();
        });
      });
    }

    return result;
  }, [initialData, searchTerm, filters, config]);

  return {
    processedData,
    searchTerm,
    setSearchTerm: handleSetSearchTerm,
    filters,
    setFilter: handleSetFilter,
    removeFilter: handleRemoveFilter,
    clearAllFilters: handleClearAllFilters,
    clearSearch: handleClearSearch,
  };
}

// Exportación por defecto para facilitar importaciones comunes, si se prefiere.
// export default useSearchAndFilter; // Descomentar si se prefiere importación por defecto
