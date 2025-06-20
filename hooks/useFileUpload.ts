import { useState, useCallback, useRef, ChangeEvent, DragEvent } from 'react';
import { useMedia } from '../contexts/MediaContext'; // Assuming MediaContext provides addMediaItems

interface UseFileUploadOptions {
  allowedTypes?: string[];
  maxSizeMb?: number;
  multiple?: boolean;
}

interface FileError {
  fileName: string;
  message: string;
}

interface UploadFeedback {
  type: 'success' | 'error' | 'info';
  messages: string[];
}

interface UseFileUploadOutput {
  feedback: UploadFeedback | null;
  isDraggingOver: boolean;
  processFiles: (files: FileList | null) => Promise<void>;
  handleDragOver: (e: DragEvent<HTMLElement>) => void;
  handleDragLeave: (e: DragEvent<HTMLElement>) => void;
  handleDrop: (e: DragEvent<HTMLElement>) => void;
  triggerFileInput: () => void;
  handleFileInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  clearFeedback: () => void;
}

const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
const DEFAULT_MAX_SIZE_MB = 32;

function useFileUpload(options?: UseFileUploadOptions): UseFileUploadOutput {
  const { addMediaItems } = useMedia(); // From MediaContext
  const [feedback, setFeedback] = useState<UploadFeedback | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = options?.allowedTypes || DEFAULT_ALLOWED_TYPES;
  const maxSize = (options?.maxSizeMb || DEFAULT_MAX_SIZE_MB) * 1024 * 1024;

  const handleSetFeedback = (type: 'success' | 'error' | 'info', messages: string[]) => {
    setFeedback({ type, messages });
    if (type !== 'error') { // Keep error messages until next action
        setTimeout(() => setFeedback(null), 5000);
    }
  };
  const clearFeedback = useCallback(() => setFeedback(null), []);


  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFeedback(null); // Clear previous feedback

    // Delegate actual file addition to MediaContext
    const result = await addMediaItems(Array.from(files)); 
    
    const messages: string[] = [];
    let feedbackType: 'success' | 'error' | 'info' = 'info';

    if (result.successCount > 0) {
        messages.push(`${result.successCount} archivo(s) subido(s) exitosamente.`);
        feedbackType = 'success';
    }
    if (result.errors.length > 0) {
        result.errors.forEach(err => messages.push(`Error en ${err.fileName}: ${err.message}`));
        feedbackType = result.successCount > 0 ? 'info' : 'error'; 
    }
    
    if (messages.length > 0) {
        handleSetFeedback(feedbackType, messages);
    }
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [addMediaItems, allowedTypes, maxSize]);


  const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if the leave event is actually leaving the drop zone
    const relatedTarget = e.relatedTarget as Node;
    if (!e.currentTarget.contains(relatedTarget)) {
       setIsDraggingOver(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    await processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileInputChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    await processFiles(e.target.files);
  }, [processFiles]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    feedback,
    isDraggingOver,
    processFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    triggerFileInput,
    handleFileInputChange,
    fileInputRef,
    clearFeedback,
  };
}

export default useFileUpload;
