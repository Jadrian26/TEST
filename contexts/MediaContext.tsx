
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { MediaItem } from '../types';

const MEDIA_BUCKET_NAME = 'media_uploads';

interface MediaContextType {
  mediaItems: MediaItem[];
  addMediaItems: (files: File[]) => Promise<{ successCount: number; errors: { fileName: string; message: string }[] }>;
  deleteMediaItem: (mediaItemId: string) => Promise<{ success: boolean; message?: string }>;
  isLoadingMedia: boolean;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const { currentUser } = useAuth();

  const fetchMediaItems = useCallback(async () => {
    setIsLoadingMedia(true);
    const { data, error } = await supabase
      .from('media_items')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error("Error fetching media items:", error);
      setMediaItems([]);
    } else {
      const formattedMedia: MediaItem[] = data.map(item => ({
        id: item.id,
        name: item.name,
        mimeType: item.mime_type, // DB: mime_type
        size: item.size_bytes,    // DB: size_bytes
        public_url: item.public_url,
        uploadedAt: item.uploaded_at,
        file_path: item.file_path,
        user_id_uploader: item.user_id_uploader
      }));
      setMediaItems(formattedMedia);
    }
    setIsLoadingMedia(false);
  }, []);

  useEffect(() => {
    fetchMediaItems();
  }, [fetchMediaItems]);

  const addMediaItems = useCallback(async (files: File[]): Promise<{ successCount: number; errors: { fileName: string; message: string }[] }> => {
    let successCount = 0;
    const errors: { fileName: string; message: string }[] = [];
    
    const uploaderId = currentUser?.id || null;

    for (const file of files) {
      const filePath = `public/${uploaderId || 'anon'}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      
      try {
        const { error: uploadError } = await supabase.storage
          .from(MEDIA_BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: '3600', // Optional: cache for 1 hour
            upsert: false // Optional: true to overwrite if file exists
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(MEDIA_BUCKET_NAME)
          .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) {
          throw new Error('Could not get public URL for uploaded file.');
        }
        
        const mediaMetaDataToInsert = {
          name: file.name,
          file_path: filePath,
          mime_type: file.type,      // DB: mime_type
          size_bytes: file.size,     // DB: size_bytes
          public_url: publicUrlData.publicUrl,
          user_id_uploader: uploaderId,
        };

        const { error: insertError } = await supabase.from('media_items').insert(mediaMetaDataToInsert);
        if (insertError) throw insertError;
        
        successCount++;
      } catch (error: any) {
        console.error(`Error processing file ${file.name}:`, error);
        // Attempt to clean up storage if DB insert failed but upload succeeded
        if (error.message.includes('insert') || error.message.includes('constraint')) {
            await supabase.storage.from(MEDIA_BUCKET_NAME).remove([filePath]);
        }
        errors.push({ fileName: file.name, message: error.message || "Error al procesar el archivo." });
      }
    }

    if (successCount > 0) {
      await fetchMediaItems();
    }
    return { successCount, errors };
  }, [currentUser, fetchMediaItems]);

  const deleteMediaItem = useCallback(async (mediaItemId: string): Promise<{ success: boolean; message?: string }> => {
    const itemToDelete = mediaItems.find(item => item.id === mediaItemId);
    if (!itemToDelete || !itemToDelete.file_path) {
      return { success: false, message: 'Archivo no encontrado o ruta de archivo inválida.' };
    }

    try {
      const { error: storageError } = await supabase.storage
        .from(MEDIA_BUCKET_NAME)
        .remove([itemToDelete.file_path]);

      if (storageError) {
        console.warn(`Storage deletion warning for ${itemToDelete.file_path}:`, storageError.message);
      }

      const { error: dbError } = await supabase
        .from('media_items')
        .delete()
        .eq('id', mediaItemId);

      if (dbError) throw dbError;

      await fetchMediaItems();
      return { success: true, message: 'Archivo eliminado exitosamente.' };
    } catch (error: any) {
      console.error("Error deleting media item:", error);
      return { success: false, message: error.message || 'Error al eliminar el archivo.' };
    }
  }, [mediaItems, fetchMediaItems]);

  return (
    <MediaContext.Provider value={{
      mediaItems,
      addMediaItems,
      deleteMediaItem,
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
