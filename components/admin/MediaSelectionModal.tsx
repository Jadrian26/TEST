
import React, { useState, useEffect, useMemo, ChangeEvent, useCallback, DragEvent } from 'react';
import { useMedia } from '../../contexts/MediaContext';
import { MediaItem, MediaFolder } from '../../types';
import CloseIcon from '../icons/CloseIcon';
import MediaIcon from './icons/MediaIcon';
import UploadIcon from './icons/UploadIcon';
import FolderIcon from './icons/FolderIcon'; // Added
import { useNotifications } from '../../contexts/NotificationsContext';
import { useSearchAndFilter } from '../../hooks/useSearchAndFilter';

// Type for combined display items (folders or files)
type DisplayItemModal = (MediaFolder & { itemType: 'folder' }) | (MediaItem & { itemType: 'file' });

interface BreadcrumbItemModal {
  id: string | null;
  name: string;
}

interface MediaSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (mediaItem: MediaItem) => void;
  modalIdPrefix?: string;
}

const MediaSelectionModal: React.FC<MediaSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  modalIdPrefix = "media-select"
}) => {
  const { mediaItems: allMediaFromLibrary, folders, addMediaItems: contextAddMediaItems, isLoadingMedia } = useMedia();
  const { showNotification } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);

  const [currentFolderIdInModal, setCurrentFolderIdInModal] = useState<string | null>(null);
  const [pathInModal, setPathInModal] = useState<BreadcrumbItemModal[]>([{ id: null, name: 'Raíz' }]);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const imageMediaItemsOnly = useMemo(() => {
    return allMediaFromLibrary.filter(item => item.type.startsWith('image/'));
  }, [allMediaFromLibrary]);

  const itemsInCurrentModalFolder = useMemo<DisplayItemModal[]>(() => {
    const currentFolders = folders
      .filter(f => f.parentId === currentFolderIdInModal)
      .map(f => ({ ...f, itemType: 'folder' as const }));
    const currentFiles = imageMediaItemsOnly
      .filter(item => item.folderId === currentFolderIdInModal)
      .map(item => ({ ...item, itemType: 'file' as const }));
    
    // Sort: folders first (alphabetically), then files (newest first)
    currentFolders.sort((a, b) => a.name.localeCompare(b.name));
    currentFiles.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return [...currentFolders, ...currentFiles];
  }, [folders, imageMediaItemsOnly, currentFolderIdInModal]);
  
  const {
    processedData: filteredDisplayItems,
    searchTerm,
    setSearchTerm
  } = useSearchAndFilter<DisplayItemModal>(itemsInCurrentModalFolder, { searchKeys: ['name'] });

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setSearchTerm('');
      setCurrentFolderIdInModal(null); // Reset to root on open
      setPathInModal([{ id: null, name: 'Raíz' }]);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, setSearchTerm]);
  
  useEffect(() => { // Update breadcrumbs when currentFolderIdInModal changes
    if (currentFolderIdInModal === null) {
      setPathInModal([{ id: null, name: 'Raíz' }]);
    } else {
      const newPathArr: BreadcrumbItemModal[] = [{ id: null, name: 'Raíz' }];
      let targetId: string | null = currentFolderIdInModal;
      const safety = folders.length + 1;
      let count = 0;
      while (targetId && count < safety) {
        const folder = folders.find(f => f.id === targetId);
        if (folder) {
          newPathArr.splice(1, 0, { id: folder.id, name: folder.name });
          targetId = folder.parentId;
        } else {
          targetId = null;
        }
        count++;
      }
      setPathInModal(newPathArr);
    }
  }, [currentFolderIdInModal, folders]);


  const handleCloseModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleItemClick = (item: DisplayItemModal) => {
    if (item.itemType === 'folder') {
      setCurrentFolderIdInModal(item.id);
      setSearchTerm(''); 
    } else {
      onSelectMedia(item as MediaItem); // It's a MediaItem
      handleCloseModal();
    }
  };
  
  const handleNavigateToModalFolder = (folderId: string | null) => {
    setCurrentFolderIdInModal(folderId);
    setSearchTerm('');
  };


  // Upload logic adapted for modal context
  const processFilesForModal = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const result = await contextAddMediaItems(Array.from(files), currentFolderIdInModal);
    
    const messages: string[] = [];
    let feedbackType: 'success' | 'error' | 'info' = 'info';

    if (result.successCount > 0) {
        messages.push(`${result.successCount} archivo(s) subido(s) a la carpeta actual.`);
        feedbackType = 'success';
    }
    if (result.errors.length > 0) {
        result.errors.forEach(err => messages.push(`Error en ${err.fileName}: ${err.message}`));
        feedbackType = result.successCount > 0 ? 'info' : 'error'; 
    }
    
    if (messages.length > 0) {
        showNotification(messages.join('; '), feedbackType);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleModalDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleModalDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const relatedTarget = e.relatedTarget as Node;
    if (!e.currentTarget.contains(relatedTarget)) {
       setIsDraggingOver(false);
    }
  }, []);

  const handleModalDrop = useCallback(async (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    await processFilesForModal(e.dataTransfer.files);
  }, [processFilesForModal]);

  const handleModalFileInputChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    await processFilesForModal(e.target.files);
  }, [processFilesForModal]);

  const triggerModalFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);


  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-[180] transition-opacity duration-300 ease-in-out ${isVisible ? 'bg-black bg-opacity-70 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${modalIdPrefix}-title`}
      onClick={handleCloseModal}
    >
      <div
        className={`bg-brand-primary p-6 rounded-lg shadow-modal w-full max-w-3xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out-expo ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-brand-gray-light">
          <h2 id={`${modalIdPrefix}-title`} className="text-lg sm:text-xl font-semibold text-brand-secondary">
            Seleccionar Imagen
          </h2>
          <button onClick={handleCloseModal} className="icon-btn" aria-label="Cerrar modal">
            <CloseIcon />
          </button>
        </div>
        
        <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
            ref={fileInputRef}
            onChange={handleModalFileInputChange}
            className="hidden"
            aria-label="Selector de archivos para subir"
        />
        
        <nav aria-label="Breadcrumb" className="text-sm text-text-secondary flex items-center space-x-1.5 flex-wrap mb-3">
          {pathInModal.map((p, index) => (
            <React.Fragment key={p.id || 'root-modal'}>
              {index > 0 && <span className="text-brand-quaternary">/</span>}
              <button
                onClick={() => handleNavigateToModalFolder(p.id)}
                className={`hover:underline ${index === pathInModal.length - 1 ? 'font-semibold text-brand-secondary' : 'text-brand-tertiary'}`}
                aria-current={index === pathInModal.length - 1 ? 'page' : undefined}
              >
                {p.name}
              </button>
            </React.Fragment>
          ))}
        </nav>

        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Buscar en carpeta actual..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="flex-grow w-full sm:w-auto p-2.5 bg-brand-primary border border-brand-quaternary rounded-md shadow-sm focus:ring-2 focus:ring-brand-tertiary focus:border-transparent text-sm sm:text-base"
            aria-label="Buscar en carpeta actual"
          />
           <button
            type="button"
            onClick={triggerModalFileInput}
            className="btn-secondary px-4 py-2 flex items-center justify-center sm:w-auto w-full"
            title="Subir nuevos archivos a la carpeta actual"
          >
            <UploadIcon className="w-4 h-4 mr-2" />
            Subir Archivo
          </button>
        </div>

        <div
          className={`flex-grow overflow-y-auto pr-1 relative rounded-md transition-all duration-200 ${
            isDraggingOver
              ? 'border-2 border-dashed border-brand-tertiary bg-brand-tertiary/5 outline-none ring-2 ring-brand-tertiary ring-offset-2' 
              : 'border-2 border-transparent'
          }`}
          onDragOver={handleModalDragOver}
          onDragEnter={handleModalDragOver} 
          onDragLeave={handleModalDragLeave}
          onDrop={handleModalDrop}
        >
          {isDraggingOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-primary bg-opacity-80 z-10 pointer-events-none rounded-md">
              <UploadIcon className="w-12 h-12 text-brand-tertiary mb-2" />
              <p className="text-lg font-semibold text-brand-secondary">Soltar para Subir Archivos</p>
              <p className="text-sm text-brand-gray-medium">A la carpeta: {pathInModal.find(p=>p.id === currentFolderIdInModal)?.name || "Raíz"}</p>
            </div>
          )}
          {isLoadingMedia ? (
            <p className="text-text-secondary text-sm text-center py-10">Cargando imágenes...</p>
          ) : filteredDisplayItems.length === 0 ? (
            <div className="text-center py-10 text-text-secondary flex flex-col items-center justify-center h-full">
              <MediaIcon className="w-16 h-16 mx-auto text-brand-quaternary mb-4" />
              <p className="text-base">
                {itemsInCurrentModalFolder.length === 0 ? "Esta carpeta está vacía." : "No se encontraron elementos."}
              </p>
              <p className="text-sm mt-1">Arrastra archivos aquí o usa el botón para subir a la carpeta actual.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredDisplayItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`group bg-brand-gray-light border border-brand-quaternary rounded-lg shadow-subtle overflow-hidden flex flex-col hover:border-brand-tertiary hover:ring-2 hover:ring-brand-tertiary focus:outline-none focus:ring-2 focus:ring-brand-tertiary focus:ring-offset-1 transition-all aspect-square
                              ${item.itemType === 'folder' ? 'items-center justify-center' : ''}`}
                  aria-label={`Seleccionar ${item.name}`}
                  title={item.name}
                >
                  {item.itemType === 'folder' ? (
                    <>
                      <FolderIcon className="w-16 h-16 text-brand-secondary group-hover:text-brand-tertiary transition-colors" />
                      <p className="mt-1 p-1.5 text-xs bg-brand-gray-light w-full text-center font-medium text-text-primary break-all truncate">
                        {item.name}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex-grow flex items-center justify-center p-1 bg-white">
                        <img src={(item as MediaItem).dataUrl} alt={item.name} className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105" />
                      </div>
                      <div className="p-1.5 text-xs bg-brand-gray-light border-t border-brand-quaternary w-full">
                        <p className="font-medium text-text-primary break-all truncate">
                          {item.name}
                        </p>
                      </div>
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-auto pt-6 border-t border-brand-gray-light flex justify-end">
            <button type="button" onClick={handleCloseModal} className="btn-ghost">
              Cancelar
            </button>
        </div>
      </div>
    </div>
  );
};

export default MediaSelectionModal;
