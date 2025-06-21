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
  getItemId,
}: UseDraggableListOptions<T>): UseDraggableListOutput<T> {
  const [orderedItems, setOrderedItems] = useState<T[]>(initialItems);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    // Sync with external changes to initialItems, preserving order if possible
    // This is a simple sync; more complex scenarios might need deeper comparison
    const initialItemMap = new Map(initialItems.map(item => [getItemId(item), item]));
    const currentItemMap = new Map(orderedItems.map(item => [getItemId(item), item]));

    // Check if item sets are different or if any item content changed significantly
    // For simplicity, just checking if IDs match and length. A more robust check might be needed.
    let needsUpdate = initialItems.length !== orderedItems.length;
    if (!needsUpdate) {
        for (const item of initialItems) {
            if (!currentItemMap.has(getItemId(item))) { // New item added externally
                needsUpdate = true;
                break;
            }
        }
        if (!needsUpdate) {
             for (const item of orderedItems) {
                if (!initialItemMap.has(getItemId(item))) { // Item removed externally
                    needsUpdate = true;
                    break;
                }
            }
        }
    }

    if (needsUpdate) {
        // Basic re-initialization if structure drastically changes
        // Or if an item that was part of the ordered list is no longer in initialItems
        const newOrdered = initialItems.map(initItem => {
            const existing = currentItemMap.get(getItemId(initItem));
            return existing || initItem; // Prefer existing if item content might change but ID is same
        }).filter(item => initialItemMap.has(getItemId(item))); // Ensure only items present in initialItems are kept

        // Filter out items from orderedItems that are no longer in initialItems
        const finalOrderedItems = orderedItems.filter(item => initialItemMap.has(getItemId(item)));
        
        // Add new items from initialItems that are not in finalOrderedItems
        initialItems.forEach(initItem => {
            if (!finalOrderedItems.find(foItem => getItemId(foItem) === getItemId(initItem))) {
                finalOrderedItems.push(initItem); // Add new items at the end, or implement specific logic
            }
        });

        // Simple update based on new initialItems, trying to preserve order by ID if possible
        // This keeps items that are still present, and adds new ones. Order of new ones might be just appended.
        // A more sophisticated merge might be needed for complex cases.
         setOrderedItems(initialItems);
    }


  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItems, getItemId]); // Only re-run if initialItems or getItemId function changes

  const handleDragStart = useCallback((e: DragEvent<HTMLElement>, index: number) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString()); // Minimal data, item from state
    if (e.currentTarget) e.currentTarget.style.opacity = '0.4';
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLElement>, index: number) => {
    e.preventDefault();
    if (index !== draggingIndex) {
      setDragOverIndex(index);
      e.dataTransfer.dropEffect = "move";
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
    
    setOrderedItems(newOrderedList);
    onOrderChange(newOrderedList); // Notify parent of the new order

    setDraggingIndex(null);
    setDragOverIndex(null);
  }, [draggingIndex, orderedItems, onOrderChange]);

  const handleDragEnd = useCallback((e: DragEvent<HTMLElement>) => {
    if (e.currentTarget) e.currentTarget.style.opacity = '1';
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
