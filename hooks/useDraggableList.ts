
import { useState, useCallback, DragEvent, useEffect } from 'react';

interface UseDraggableListOptions<T> {
  initialItems: T[];
  onOrderChange: (orderedItems: T[]) => void;
  getItemId: (item: T) => string; // Function to get a unique ID from an item
}

interface UseDraggableListOutput<T> {
  orderedItems: T[];
  draggingIndex: number | null;
  dragOverIndex: number | null;
  handleDragStart: (e: DragEvent<HTMLElement>, index: number) => void;
  handleDragOver: (e: DragEvent<HTMLElement>, index: number) => void;
  handleDragLeave: (e: DragEvent<HTMLElement>) => void;
  handleDrop: (e: DragEvent<HTMLElement>, dropIndex: number) => void;
  handleDragEnd: (e: DragEvent<HTMLElement>) => void;
  setOrderedItems: React.Dispatch<React.SetStateAction<T[]>>; // Allow external updates
}

function useDraggableList<T>({
  initialItems,
  onOrderChange,
  getItemId, // getItemId is kept in case its stability is not guaranteed by the caller, though often it is.
}: UseDraggableListOptions<T>): UseDraggableListOutput<T> {
  const [orderedItems, setOrderedItems] = useState<T[]>(initialItems);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    // This effect ensures that if the initialItems prop changes from the parent,
    // the internal orderedItems state reflects that change.
    // The parent component (e.g., AdminSchoolProductsPage) is responsible for
    // ensuring initialItems is correctly sorted if it's derived from context.
    setOrderedItems(initialItems);
  }, [initialItems, getItemId]); // Listen to changes in initialItems or how item IDs are obtained.

  const handleDragStart = useCallback((e: DragEvent<HTMLElement>, index: number) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Using a minimal data transfer as the actual item data is sourced from the component's state.
    // This is primarily to enable the drag operation.
    e.dataTransfer.setData("text/plain", getItemId(orderedItems[index])); 
    if (e.currentTarget && e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.4'; // Visual feedback for dragging
    }
  }, [getItemId, orderedItems]);

  const handleDragOver = useCallback((e: DragEvent<HTMLElement>, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    if (index !== draggingIndex) {
      setDragOverIndex(index);
      e.dataTransfer.dropEffect = "move"; // Visual feedback for drop target
    }
  }, [draggingIndex]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === dropIndex) {
      setDraggingIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrderedList = [...orderedItems];
    const draggedItem = newOrderedList.splice(draggingIndex, 1)[0];
    newOrderedList.splice(dropIndex, 0, draggedItem);
    
    setOrderedItems(newOrderedList); // Update local state immediately for responsive UI
    onOrderChange(newOrderedList);  // Notify parent of the new order

    setDraggingIndex(null);
    setDragOverIndex(null);
  }, [draggingIndex, orderedItems, onOrderChange]);

  const handleDragEnd = useCallback((e: DragEvent<HTMLElement>) => {
    if (e.currentTarget && e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'; // Reset opacity
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, []);

  return {
    orderedItems,
    draggingIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    setOrderedItems
  };
}

export default useDraggableList;
