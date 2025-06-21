
import { useState, useMemo, useCallback, useEffect } from 'react';

interface UsePaginationOptions {
  totalItems: number;
  itemsPerPage: number;
  initialPage?: number;
  siblingCount?: number; // Número de páginas a mostrar a cada lado de la página actual
}

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToPage: (pageNumber: number) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  paginationRange: (string | number)[]; // Puede incluir '...'
}

export const DOTS = '...';

const range = (start: number, end: number): number[] => {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

function usePagination({
  totalItems,
  itemsPerPage,
  initialPage = 1,
  siblingCount = 1,
}: UsePaginationOptions): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / itemsPerPage));
  }, [totalItems, itemsPerPage]);

  // Asegurar que currentPage esté dentro de los límites
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);
  
  const paginationRange = useMemo(() => {
    const totalPageNumbers = siblingCount + 5; // siblingCount + firstPage + lastPage + currentPage + 2*DOTS

    // Caso 1: Si el número de páginas es menor que los números de página que queremos mostrar
    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    // Caso 2: No mostrar puntos a la izquierda, solo a la derecha
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, DOTS, totalPages];
    }

    // Caso 3: No mostrar puntos a la derecha, solo a la izquierda
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [firstPageIndex, DOTS, ...rightRange];
    }

    // Caso 4: Mostrar puntos a la izquierda y a la derecha
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }
    
    // Default case (should ideally not be reached if logic above is correct)
    return range(1, totalPages);

  }, [totalPages, siblingCount, currentPage]);


  const goToNextPage = useCallback(() => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  }, [totalPages]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  }, []);

  const goToPage = useCallback((pageNumber: number) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  }, [totalPages]);

  const canGoNext = currentPage < totalPages;
  const canGoPrevious = currentPage > 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, totalItems - 1);

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    canGoNext,
    canGoPrevious,
    paginationRange,
  };
}

export default usePagination;