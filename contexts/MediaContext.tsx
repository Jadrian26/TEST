import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { MediaItem, MediaFolder } from '../types'; // Added MediaFolder

const MEDIA_STORAGE_KEY = 'mediaLibraryItems';
const FOLDERS_STORAGE_KEY = 'mediaFolders'; // New key for folders
const MAX_FILE_SIZE_MB = 32;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];

interface MediaContextType {
  mediaItems: MediaItem[];
  folders: MediaFolder[];
  addMediaItems: (files: File[], folderId?: string | null) => Promise<{ successCount: number; errors: { fileName: string; message: string }[] }>;
  deleteMediaItem: (mediaItemId: string) => void;
  addFolder: (name: string, parentId: string | null) => Promise<{ success: boolean; folder?: MediaFolder; message?: string }>;
  updateFolder: (folderId: string, newName: string) => Promise<{ success: boolean; message?: string }>;
  deleteFolder: (folderId: string) => Promise<{ success: boolean; message?: string }>;
  isLoadingMedia: boolean;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]); // New state for folders
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);

  useEffect(() => {
    try {
      const storedMedia = localStorage.getItem(MEDIA_STORAGE_KEY);
      let loadedMedia: MediaItem[] = storedMedia ? JSON.parse(storedMedia) : [];
      setMediaItems(loadedMedia.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()));

      const storedFolders = localStorage.getItem(FOLDERS_STORAGE_KEY);
      setFolders(storedFolders ? JSON.parse(storedFolders).sort((a:MediaFolder,b:MediaFolder) => a.name.localeCompare(b.name)) : []); // Load folders and sort

    } catch (error) {
      console.error("Error loading media/folders from localStorage:", error);
      setMediaItems([]);
      setFolders([]);
    } finally {
      setIsLoadingMedia(false);
    }
  }, []);

  const saveMediaItemsToStorage = (items: MediaItem[]) => {
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(items));
  };

  const saveFoldersToStorage = (items: MediaFolder[]) => { // New function to save folders
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(items));
  };

  const addMediaItems = useCallback(async (files: File[], folderId?: string | null): Promise<{ successCount: number; errors: { fileName: string; message: string }[] }> => {
    let successCount = 0;
    const errors: { fileName: string; message: string }[] = [];
    const newMediaItemsProcessed: MediaItem[] = [];

    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push({ fileName: file.name, message: `Tipo de archivo no permitido: ${file.type}. Permitidos: JPG, PNG, GIF, SVG, WEBP.` });
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push({ fileName: file.name, message: `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo ${MAX_FILE_SIZE_MB}MB.` });
        continue;
      }

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        const newMediaItem: MediaItem = {
          id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: dataUrl,
          uploadedAt: new Date().toISOString(),
          folderId: folderId || null, // Assign folderId
        };
        newMediaItemsProcessed.push(newMediaItem);
        successCount++;
      } catch (error) {
        errors.push({ fileName: file.name, message: "Error al procesar el archivo." });
      }
    }

    if (newMediaItemsProcessed.length > 0) {
      setMediaItems(prevItems => {
        const updatedItems = [...newMediaItemsProcessed, ...prevItems].sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        saveMediaItemsToStorage(updatedItems);
        return updatedItems;
      });
    }
    return { successCount, errors };
  }, []);

  const deleteMediaItem = useCallback((mediaItemId: string) => {
    setMediaItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.id !== mediaItemId);
      saveMediaItemsToStorage(updatedItems);
      return updatedItems;
    });
  }, []);

  const addFolder = useCallback(async (name: string, parentId: string | null): Promise<{success: boolean, folder?: MediaFolder, message?: string}> => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, message: "El nombre de la carpeta no puede estar vacío." };
    }
    const siblingFolders = folders.filter(f => f.parentId === parentId);
    if (siblingFolders.some(f => f.name.toLowerCase() === trimmedName.toLowerCase())) {
      return { success: false, message: `Ya existe una carpeta llamada "${trimmedName}" en esta ubicación.`};
    }
    const newFolder: MediaFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: trimmedName,
      parentId,
      createdAt: new Date().toISOString(),
    };
    setFolders(prevFolders => {
      const updatedFolders = [newFolder, ...prevFolders].sort((a,b) => a.name.localeCompare(b.name));
      saveFoldersToStorage(updatedFolders);
      return updatedFolders;
    });
    return { success: true, folder: newFolder, message: `Carpeta "${trimmedName}" creada.` };
  }, [folders]);

  const updateFolder = useCallback(async (folderId: string, newName: string): Promise<{success: boolean, message?: string}> => {
    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
      return { success: false, message: "El nombre de la carpeta no puede estar vacío." };
    }
    const folderToUpdate = folders.find(f => f.id === folderId);
    if (!folderToUpdate) {
      return { success: false, message: "Carpeta no encontrada." };
    }
    const siblingFolders = folders.filter(f => f.parentId === folderToUpdate.parentId && f.id !== folderId);
    if (siblingFolders.some(f => f.name.toLowerCase() === trimmedNewName.toLowerCase())) {
      return { success: false, message: `Ya existe otra carpeta llamada "${trimmedNewName}" en esta ubicación.`};
    }

    setFolders(prevFolders => {
      const updatedFolders = prevFolders.map(f =>
        f.id === folderId ? { ...f, name: trimmedNewName } : f
      ).sort((a,b) => a.name.localeCompare(b.name));
      saveFoldersToStorage(updatedFolders);
      return updatedFolders;
    });
    return { success: true, message: `Carpeta renombrada a "${trimmedNewName}".` };
  }, [folders]);
  
  const deleteFolderRecursive = useCallback((
    folderIdToDelete: string,
    currentFolders: MediaFolder[],
    currentMediaItems: MediaItem[]
  ): { remainingFolders: MediaFolder[], remainingMediaItems: MediaItem[] } => {
    let foldersList = [...currentFolders];
    let mediaItemsList = [...currentMediaItems];
  
    // Delete media items in the current folder
    mediaItemsList = mediaItemsList.filter(item => item.folderId !== folderIdToDelete);
  
    // Find and delete subfolders
    const subFolders = foldersList.filter(f => f.parentId === folderIdToDelete);
    for (const subFolder of subFolders) {
      // Note: This recursive call needs to operate on the progressively filtered lists
      const result = deleteFolderRecursive(subFolder.id, foldersList, mediaItemsList);
      foldersList = result.remainingFolders;
      mediaItemsList = result.remainingMediaItems;
    }
  
    // Delete the folder itself from the progressively filtered list
    foldersList = foldersList.filter(f => f.id !== folderIdToDelete);
  
    return { remainingFolders: foldersList, remainingMediaItems: mediaItemsList };
  }, []); // No dependencies, it's a pure utility function based on its arguments

  const deleteFolder = useCallback(async (folderId: string): Promise<{success: boolean, message?: string}> => {
    const result = deleteFolderRecursive(folderId, folders, mediaItems);
    setFolders(result.remainingFolders.sort((a,b) => a.name.localeCompare(b.name)));
    saveFoldersToStorage(result.remainingFolders);
    setMediaItems(result.remainingMediaItems.sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()));
    saveMediaItemsToStorage(result.remainingMediaItems);
    return { success: true, message: 'Carpeta y su contenido eliminados exitosamente.' };
  }, [folders, mediaItems, deleteFolderRecursive]);


  return (
    <MediaContext.Provider value={{
      mediaItems,
      folders, // Provide folders
      addMediaItems,
      deleteMediaItem,
      addFolder,    // Provide folder functions
      updateFolder,
      deleteFolder,
      isLoadingMedia
    }}>
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = (): MediaContextType => {
  const context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
};