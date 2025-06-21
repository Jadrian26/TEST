
import React, { useState, DragEvent, ChangeEvent, useEffect, useMemo, useCallback } from 'react';
import { useMedia } from '../../contexts/MediaContext';
import { MediaItem, MediaFolder } from '../../types';
import UploadIcon from '../../components/admin/icons/UploadIcon';
import MediaIcon from '../../components/admin/icons/MediaIcon';
import DeleteIcon from '../../components/admin/icons/DeleteIcon';
import EditIcon from '../../components/admin/icons/EditIcon';
import FolderIcon from '../../components/admin/icons/FolderIcon';
import PlusCircleIcon from '../../components/icons/PlusCircleIcon';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import CloseIcon from '../../components/icons/CloseIcon';
// ListBulletIcon and Squares2X2Icon are no longer needed for view toggling
import useFileUpload from '../../hooks/useFileUpload';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useSearchAndFilter } from '../../hooks/useSearchAndFilter';
import usePagination, { DOTS } from '../../hooks/usePagination';
import useModalState from '../../hooks/useModalState';

// Type for combined display items (folders or files)
type DisplayItem = (MediaFolder & { itemType: 'folder' }) | (MediaItem & { itemType: 'file' });

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

// Create Folder Modal
interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  isLoading?: boolean;
}
const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ isOpen, onClose, onCreate, isLoading }) => {
  const [folderName, setFolderName] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);
  
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreate(folderName.trim());
    }
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 z-[140] transition-opacity duration-300 ${isVisible ? 'bg-black bg-opacity-70 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}>
      <div className={`bg-brand-primary p-6 rounded-lg shadow-modal w-full max-w-md transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-brand-secondary">Crear Nueva Carpeta</h2>
          <button onClick={handleClose} className="icon-btn"><CloseIcon /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <label htmlFor="newFolderName" className="block text-sm font-medium text-text-primary mb-1">Nombre de la Carpeta</label>
          <input
            type="text"
            id="newFolderName"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className="w-full p-2.5 border border-brand-quaternary rounded-md shadow-sm focus:ring-2 focus:ring-brand-tertiary focus:border-transparent text-sm sm:text-base"
            placeholder="Ej: Documentos"
            required
            disabled={isLoading}
          />
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={handleClose} className="btn-ghost" disabled={isLoading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isLoading || !folderName.trim()}>
              {isLoading ? 'Creando...' : 'Crear Carpeta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Rename Folder Modal
interface RenameFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
  currentName: string;
  isLoading?: boolean;
}
const RenameFolderModal: React.FC<RenameFolderModalProps> = ({ isOpen, onClose, onRename, currentName, isLoading }) => {
  const [newFolderName, setNewFolderName] = useState(currentName);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewFolderName(currentName);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, currentName]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim() && newFolderName.trim() !== currentName) {
      onRename(newFolderName.trim());
    } else if (newFolderName.trim() === currentName) {
      handleClose(); // No change, just close
    }
  };
  
  if (!isOpen && !isVisible) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 z-[140] transition-opacity duration-300 ${isVisible ? 'bg-black bg-opacity-70 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}>
      <div className={`bg-brand-primary p-6 rounded-lg shadow-modal w-full max-w-md transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-brand-secondary">Renombrar Carpeta</h2>
          <button onClick={handleClose} className="icon-btn"><CloseIcon /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <label htmlFor="renameFolderName" className="block text-sm font-medium text-text-primary mb-1">Nuevo Nombre</label>
          <input
            type="text"
            id="renameFolderName"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="w-full p-2.5 border border-brand-quaternary rounded-md shadow-sm focus:ring-2 focus:ring-brand-tertiary focus:border-transparent text-sm sm:text-base"
            required
            disabled={isLoading}
          />
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={handleClose} className="btn-ghost" disabled={isLoading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isLoading || !newFolderName.trim()}>
              {isLoading ? 'Renombrando...' : 'Renombrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const AdminMediaManagementPage: React.FC = () => {
  const { 
    mediaItems, 
    folders, 
    deleteMediaItem, 
    isLoadingMedia, 
    addFolder, 
    updateFolder, 
    deleteFolder,
    addMediaItems: contextAddMediaItems
  } = useMedia();
  const { showNotification } = useNotifications();
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [path, setPath] = useState<BreadcrumbItem[]>([{ id: null, name: 'Raíz' }]);
  
  const [itemToDelete, setItemToDelete] = useState<DisplayItem | null>(null);
  const [folderToRename, setFolderToRename] = useState<MediaFolder | null>(null);
  const [isProcessingFolderAction, setIsProcessingFolderAction] = useState(false);

  const { isOpen: isDeleteConfirmModalOpen, openModal: openDeleteConfirmModal, closeModal: closeDeleteConfirmModal } = useModalState();
  const { isOpen: isCreateFolderModalOpen, openModal: openCreateFolderModal, closeModal: closeCreateFolderModal } = useModalState();
  const { isOpen: isRenameFolderModalOpen, openModal: openRenameFolderModal, closeModal: closeRenameFolderModal } = useModalState();

  const MAX_DISPLAY_FILENAME_LENGTH_LIST = 40;
  const ITEMS_PER_PAGE = 20;

  const {
    feedback: uploadFeedback,
    isDraggingOver,
    handleDragOver,
    handleDragLeave,
    triggerFileInput,
    fileInputRef,
    clearFeedback: clearUploadFeedback
  } = useFileUpload(); 

  useEffect(() => {
    if (uploadFeedback) { 
      uploadFeedback.messages.forEach(msg => {
        showNotification(msg, uploadFeedback.type);
      });
      clearUploadFeedback();
    }
  }, [uploadFeedback, showNotification, clearUploadFeedback]);
  
  const itemsInCurrentFolderUnsorted = useMemo<DisplayItem[]>(() => {
    const currentFoldersItems = folders
      .filter(f => f.parentId === currentFolderId)
      .map(f => ({ ...f, itemType: 'folder' as const }));
    const currentFilesItems = mediaItems
      .filter(item => item.folderId === currentFolderId)
      .map(item => ({ ...item, itemType: 'file' as const }));
    return [...currentFoldersItems, ...currentFilesItems];
  }, [folders, mediaItems, currentFolderId]);

  const sortedItemsInCurrentFolder = useMemo(() => {
    return itemsInCurrentFolderUnsorted.sort((a, b) => {
      if (a.itemType === 'folder' && b.itemType === 'file') return -1;
      if (a.itemType === 'file' && b.itemType === 'folder') return 1;
      
      if (a.itemType === 'folder' && b.itemType === 'folder') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      
      if (a.itemType === 'file' && b.itemType === 'file') {
        return new Date((b as MediaItem).uploadedAt).getTime() - new Date((a as MediaItem).uploadedAt).getTime();
      }
      return 0;
    });
  }, [itemsInCurrentFolderUnsorted]);

  const {
    processedData: filteredDisplayItems,
    searchTerm,
    setSearchTerm,
  } = useSearchAndFilter<DisplayItem>(sortedItemsInCurrentFolder, { searchKeys: ['name'] });

  const {
    currentPage, totalPages, startIndex, endIndex,
    goToNextPage, goToPreviousPage, goToPage,
    paginationRange
  } = usePagination({
    totalItems: filteredDisplayItems.length,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  const paginatedDisplayItems = useMemo(() => {
    return filteredDisplayItems.slice(startIndex, endIndex + 1);
  }, [filteredDisplayItems, startIndex, endIndex]);

  useEffect(() => {
    if (currentFolderId === null) {
      setPath([{ id: null, name: 'Raíz' }]);
    } else {
      const newPathArr: BreadcrumbItem[] = [{ id: null, name: 'Raíz' }];
      let targetId: string | null = currentFolderId;
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
      setPath(newPathArr);
    }
    goToPage(1); 
  }, [currentFolderId, folders, goToPage]);

  const handleNavigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSearchTerm(''); 
  };

  const handleDeleteClick = (item: DisplayItem) => {
    setItemToDelete(item);
    openDeleteConfirmModal();
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsProcessingFolderAction(true);
    try {
      if (itemToDelete.itemType === 'file') {
        deleteMediaItem(itemToDelete.id);
        showNotification(`Archivo "${itemToDelete.name}" eliminado.`, 'success');
      } else { 
        const result = await deleteFolder(itemToDelete.id);
        showNotification(result.message || `Carpeta "${itemToDelete.name}" eliminada.`, result.success ? 'success' : 'error');
      }
    } catch (error) {
      showNotification(`Error al eliminar: ${(error as Error).message}`, 'error');
    }
    setIsProcessingFolderAction(false);
    closeDeleteConfirmModal();
    setItemToDelete(null);
  };

  const handleCreateFolder = async (name: string) => {
    setIsProcessingFolderAction(true);
    const result = await addFolder(name, currentFolderId);
    showNotification(result.message || 'Acción completada.', result.success ? 'success' : 'error');
    setIsProcessingFolderAction(false);
    if (result.success) {
      closeCreateFolderModal();
    }
  };
  
  const handleRenameFolderClick = (folder: MediaFolder) => {
    setFolderToRename(folder);
    openRenameFolderModal();
  };

  const handleRenameFolder = async (newName: string) => {
    if (!folderToRename) return;
    setIsProcessingFolderAction(true);
    const result = await updateFolder(folderToRename.id, newName);
    showNotification(result.message || 'Acción completada.', result.success ? 'success' : 'error');
    setIsProcessingFolderAction(false);
    if (result.success) {
      closeRenameFolderModal();
      setFolderToRename(null);
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFormattedDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-PA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const customHandleDrop = useCallback(async (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if(files && files.length > 0) {
        const result = await contextAddMediaItems(Array.from(files), currentFolderId);
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
        if(messages.length > 0) showNotification(messages.join('; '), feedbackType);
    }
  }, [currentFolderId, showNotification, contextAddMediaItems]);

  const customHandleFileInputChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if(files && files.length > 0) {
        const result = await contextAddMediaItems(Array.from(files), currentFolderId);
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
        if(messages.length > 0) showNotification(messages.join('; '), feedbackType);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [currentFolderId, showNotification, fileInputRef, contextAddMediaItems]);


  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-brand-quaternary border-opacity-30">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary flex items-center">
          <MediaIcon className="w-7 h-7 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-brand-tertiary" /> Gestión de Medios
        </h1>
        <p className="text-text-secondary text-base sm:text-lg mt-1">Administra tu biblioteca de imágenes y otros archivos multimedia.</p>
      </div>
      
      <nav aria-label="Breadcrumb" className="text-sm text-text-secondary flex items-center space-x-1.5 flex-wrap">
        {path.map((p, index) => (
          <React.Fragment key={p.id || 'root'}>
            {index > 0 && <span className="text-brand-quaternary">/</span>}
            <button
              onClick={() => handleNavigateToFolder(p.id)}
              className={`hover:underline ${index === path.length - 1 ? 'font-semibold text-brand-secondary' : 'text-brand-tertiary'}`}
              aria-current={index === path.length - 1 ? 'page' : undefined}
            >
              {p.name}
            </button>
          </React.Fragment>
        ))}
      </nav>

      <div className="bg-brand-primary p-4 sm:p-6 rounded-lg shadow-card">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-brand-secondary">Subir a: <span className="font-normal">{path.find(p=>p.id === currentFolderId)?.name || "Raíz"}</span></h2>
            <button onClick={openCreateFolderModal} className="btn-secondary text-sm py-2 px-3 flex items-center self-start sm:self-center">
                <PlusCircleIcon className="w-4 h-4 mr-1.5" /> Crear Carpeta
            </button>
        </div>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={customHandleDrop}
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-colors
                        ${isDraggingOver ? 'border-brand-tertiary bg-brand-tertiary/10' : 'border-brand-quaternary hover:border-brand-secondary'}`}
        >
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
            ref={fileInputRef}
            onChange={customHandleFileInputChange}
            className="hidden"
            aria-label="Selector de archivos"
          />
          <UploadIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-brand-gray-medium mb-2 sm:mb-3" />
          <p className="text-text-primary font-medium text-sm sm:text-base">Arrastra y suelta archivos aquí</p>
          <p className="text-xs sm:text-sm text-text-secondary">o haz clic para seleccionar archivos</p>
          <p className="text-xs text-brand-gray-medium mt-1 sm:mt-2">Máx 32MB por archivo. Formatos: JPG, PNG, GIF, SVG, WEBP.</p>
        </div>
      </div>
      
      <div className="bg-brand-primary p-4 sm:p-6 rounded-lg shadow-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-brand-secondary whitespace-nowrap">Contenido de: <span className="font-normal">{path.find(p=>p.id === currentFolderId)?.name || "Raíz"}</span></h2>
            <div className="w-full sm:w-auto flex items-center gap-2">
                 <input
                    type="text"
                    placeholder="Buscar en carpeta actual..."
                    value={searchTerm}
                    onChange={(e) => {setSearchTerm(e.target.value); goToPage(1);}}
                    className="w-full sm:w-64 p-2 text-sm border border-brand-quaternary rounded-md focus:ring-brand-tertiary focus:border-brand-tertiary"
                    aria-label="Buscar en carpeta actual"
                  />
            </div>
        </div>

        {isLoadingMedia ? (
          <p className="text-text-secondary text-sm text-center py-6">Cargando biblioteca...</p>
        ) : paginatedDisplayItems.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-8">
            {itemsInCurrentFolderUnsorted.length === 0 ? "Esta carpeta está vacía." : "No se encontraron elementos con ese nombre."}
          </p>
        ) : ( 
            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm text-left text-text-secondary">
                    <thead className="text-xs text-text-primary uppercase bg-brand-gray-light bg-opacity-50">
                        <tr>
                            <th scope="col" className="px-4 py-3 w-16">Icono</th>
                            <th scope="col" className="px-4 py-3">Nombre</th>
                            <th scope="col" className="px-4 py-3">Tipo/Info</th>
                            <th scope="col" className="px-4 py-3">Tamaño</th>
                            <th scope="col" className="px-4 py-3">Fecha</th>
                            <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-gray-light">
                        {paginatedDisplayItems.map(item => (
                            <tr key={item.id} className="hover:bg-brand-gray-light hover:bg-opacity-30 transition-colors"
                                onDoubleClick={item.itemType === 'folder' ? () => handleNavigateToFolder(item.id) : undefined}
                            >
                                <td className="px-4 py-2">
                                    {item.itemType === 'folder' ? (
                                        <FolderIcon className="w-8 h-8 text-brand-secondary"/>
                                    ) : (item as MediaItem).type.startsWith('image/') ? (
                                        <img src={(item as MediaItem).dataUrl} alt={item.name} className="h-10 w-10 object-contain rounded bg-white border border-brand-quaternary/50" />
                                    ) : (
                                        <div className="h-10 w-10 flex items-center justify-center bg-brand-gray-light rounded border border-brand-quaternary/50">
                                            <MediaIcon className="w-6 h-6 text-brand-gray-medium" />
                                        </div>
                                    )}
                                </td>
                                <td 
                                    className={`px-4 py-2 font-medium text-text-primary whitespace-nowrap text-sm ${item.itemType === 'folder' ? 'cursor-pointer hover:underline hover:text-brand-tertiary' : ''}`} 
                                    title={item.name}
                                    onClick={item.itemType === 'folder' ? () => handleNavigateToFolder(item.id) : undefined}
                                >
                                    {item.name.length > MAX_DISPLAY_FILENAME_LENGTH_LIST ? item.name.substring(0, MAX_DISPLAY_FILENAME_LENGTH_LIST) + '...' : item.name}
                                </td>
                                <td className="px-4 py-2 text-xs">{item.itemType === 'folder' ? 'Carpeta' : (item as MediaItem).type}</td>
                                <td className="px-4 py-2 text-xs">{item.itemType === 'file' ? formatFileSize((item as MediaItem).size) : '-'}</td>
                                <td className="px-4 py-2 text-xs">{getFormattedDate(item.itemType === 'file' ? (item as MediaItem).uploadedAt : (item as MediaFolder).createdAt)}</td>
                                <td className="px-4 py-2 text-right space-x-1">
                                   {item.itemType === 'folder' && (
                                     <button onClick={() => handleRenameFolderClick(item as MediaFolder)} className="icon-btn !p-1.5 text-brand-secondary hover:text-brand-tertiary" title="Renombrar Carpeta">
                                        <EditIcon className="w-4 h-4" /> </button>
                                    )}
                                    <button onClick={() => handleDeleteClick(item)} className="icon-btn !p-1.5 text-error hover:text-red-700" title={item.itemType === 'folder' ? "Eliminar Carpeta" : "Eliminar Archivo"}>
                                        <DeleteIcon className="w-4 h-4" /> </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
        {totalPages > 1 && (
          <nav aria-label="Paginación de medios" className="mt-6 flex items-center justify-between border-t border-brand-gray-light pt-4">
            <div className="text-sm text-text-secondary">
              Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="btn-ghost !py-1.5 !px-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              {paginationRange.map((page, index) =>
                page === DOTS ? (
                  <span key={`${page}-${index}-dots`} className="px-2.5 py-1.5 text-sm">...</span>
                ) : (
                  <button
                    key={page as number}
                    onClick={() => goToPage(page as number)}
                    className={`btn-ghost !py-1.5 !px-2.5 text-sm ${currentPage === page ? '!bg-brand-secondary !text-white shadow-sm' : ''}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="btn-ghost !py-1.5 !px-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </nav>
        )}
      </div>
      <ConfirmDeleteModal
          isOpen={isDeleteConfirmModalOpen}
          onClose={closeDeleteConfirmModal}
          onConfirm={handleConfirmDelete}
          title={`Confirmar Eliminación de ${itemToDelete?.itemType === 'folder' ? 'Carpeta' : 'Archivo'}`}
          message={
            itemToDelete?.itemType === 'folder' 
            ? `¿Estás seguro de que quieres eliminar la carpeta "${itemToDelete?.name}"? TODOS los archivos y subcarpetas dentro de ella también serán eliminados permanentemente. Esta acción no se puede deshacer.`
            : `¿Estás seguro de que quieres eliminar el archivo "${itemToDelete?.name}"? Esta acción no se puede deshacer.`
          }
          itemName={itemToDelete?.name}
        />
      <CreateFolderModal isOpen={isCreateFolderModalOpen} onClose={closeCreateFolderModal} onCreate={handleCreateFolder} isLoading={isProcessingFolderAction} />
      {folderToRename && <RenameFolderModal isOpen={isRenameFolderModalOpen} onClose={closeRenameFolderModal} onRename={handleRenameFolder} currentName={folderToRename.name} isLoading={isProcessingFolderAction} />}
    </div>
  );
};

export default AdminMediaManagementPage;
