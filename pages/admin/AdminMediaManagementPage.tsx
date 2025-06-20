
import React, { useState, DragEvent, ChangeEvent, useEffect } from 'react';
import { useMedia } from '../../contexts/MediaContext';
import { MediaItem } from '../../types';
import UploadIcon from '../../components/admin/icons/UploadIcon';
import MediaIcon from '../../components/admin/icons/MediaIcon';
import DeleteIcon from '../../components/admin/icons/DeleteIcon';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import CloseIcon from '../../components/icons/CloseIcon';
import ListBulletIcon from '../../components/admin/icons/ListBulletIcon';
import Squares2X2Icon from '../../components/admin/icons/Squares2X2Icon';
import useFileUpload from '../../hooks/useFileUpload';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useSearchAndFilter } from '../../hooks/useSearchAndFilter'; 
import useDebounce from '../../hooks/useDebounce'; // Import useDebounce

const AdminMediaManagementPage: React.FC = () => {
  const { mediaItems, deleteMediaItem, isLoadingMedia } = useMedia();
  const { showNotification } = useNotifications();
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const MAX_DISPLAY_FILENAME_LENGTH_GRID = 20;
  const MAX_DISPLAY_FILENAME_LENGTH_LIST = 40;

  const {
    feedback: uploadFeedback,
    isDraggingOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    triggerFileInput,
    handleFileInputChange,
    fileInputRef,
    clearFeedback: clearUploadFeedback
  } = useFileUpload();

  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(localSearchTerm, 300);

  const {
    processedData: filteredMediaItems,
    // searchTerm, // Not used directly for input value anymore
    setSearchTerm, // Used with debounced value
  } = useSearchAndFilter<MediaItem>(mediaItems, { searchKeys: ['name'] });

  useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm, setSearchTerm]);

  useEffect(() => {
    if (uploadFeedback) {
      uploadFeedback.messages.forEach(msg => {
        showNotification(msg, uploadFeedback.type);
      });
      clearUploadFeedback();
    }
  }, [uploadFeedback, showNotification, clearUploadFeedback]);


  const handleDeleteClick = (item: MediaItem) => {
    setItemToDelete(item);
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      const result = await deleteMediaItem(itemToDelete.id);
      showNotification(result.message || (result.success ? `Archivo "${itemToDelete.name}" eliminado.` : "Error al eliminar."), result.success ? 'success': 'error');
    }
    setShowDeleteConfirmModal(false);
    setItemToDelete(null);
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
    return date.toLocaleDateString('es-PA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-brand-quaternary border-opacity-30">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary flex items-center">
          <MediaIcon className="w-7 h-7 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-brand-tertiary" /> Gestión de Medios
        </h1>
        <p className="text-text-secondary text-base sm:text-lg mt-1">Administra tu biblioteca de imágenes y otros archivos multimedia.</p>
      </div>

      <div className="bg-brand-primary p-6 rounded-lg shadow-card">
        <h2 className="text-xl font-semibold text-brand-secondary mb-4">Subir Nuevos Medios</h2>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                        ${isDraggingOver ? 'border-brand-tertiary bg-brand-tertiary/10' : 'border-brand-quaternary hover:border-brand-secondary'}`}
        >
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="Selector de archivos"
          />
          <UploadIcon className="w-12 h-12 mx-auto text-brand-gray-medium mb-3" />
          <p className="text-text-primary font-medium text-base">Arrastra y suelta archivos aquí</p>
          <p className="text-sm text-text-secondary">o haz clic para seleccionar archivos</p>
          <p className="text-xs text-brand-gray-medium mt-2">Máx 32MB por archivo. Formatos: JPG, PNG, GIF, SVG, WEBP.</p>
        </div>
      </div>
      
      <div className="bg-brand-primary p-6 rounded-lg shadow-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-xl font-semibold text-brand-secondary whitespace-nowrap">Biblioteca de Medios</h2>
            <div className="w-full sm:w-auto flex items-center gap-2">
                 <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    className="w-full sm:w-64 p-2 text-sm border border-brand-quaternary rounded-md focus:ring-brand-tertiary focus:border-brand-tertiary"
                    aria-label="Buscar en biblioteca de medios"
                  />
                <div className="flex space-x-1 bg-brand-gray-light p-1 rounded-lg shrink-0">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`icon-btn !p-1.5 ${viewMode === 'list' ? 'bg-brand-secondary text-white shadow-sm' : 'text-text-secondary hover:bg-brand-quaternary/30 hover:text-brand-secondary'}`}
                      aria-label="Vista de Lista"
                      title="Vista de Lista"
                    >
                      <ListBulletIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`icon-btn !p-1.5 ${viewMode === 'grid' ? 'bg-brand-secondary text-white shadow-sm' : 'text-text-secondary hover:bg-brand-quaternary/30 hover:text-brand-secondary'}`}
                      aria-label="Vista de Cuadrícula"
                      title="Vista de Cuadrícula"
                    >
                      <Squares2X2Icon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>

        {isLoadingMedia ? (
          <p className="text-text-secondary text-sm">Cargando biblioteca...</p>
        ) : filteredMediaItems.length === 0 ? (
          <p className="text-text-secondary text-sm text-center py-8">
            {mediaItems.length === 0 ? "Tu biblioteca de medios está vacía. Comienza subiendo algunos archivos." : "No se encontraron medios con ese nombre."}
          </p>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredMediaItems.map(item => (
              <div key={item.id} className="group bg-brand-gray-light border border-brand-quaternary rounded-lg shadow-subtle overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="aspect-square flex items-center justify-center bg-white p-1">
                  {item.mimeType.startsWith('image/') ? (
                    <img src={item.public_url} alt={item.name} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <MediaIcon className="w-16 h-16 text-brand-gray-medium" /> 
                  )}
                </div>
                <div className="p-2 text-xs flex-grow flex flex-col justify-between">
                  <div>
                    <p 
                        className="font-medium text-text-primary break-all truncate" 
                        title={item.name}
                    >
                        {item.name.length > MAX_DISPLAY_FILENAME_LENGTH_GRID ? item.name.substring(0, MAX_DISPLAY_FILENAME_LENGTH_GRID) + '...' : item.name}
                    </p>
                    <p className="text-brand-gray-medium text-xs">{formatFileSize(item.size)}</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-brand-quaternary/50 flex justify-end space-x-1">
                    <button 
                        onClick={() => handleDeleteClick(item)} 
                        className="icon-btn !p-1 text-error hover:text-red-700" 
                        title="Eliminar Medio"
                    >
                      <DeleteIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : ( 
            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm text-left text-text-secondary">
                    <thead className="text-xs text-text-primary uppercase bg-brand-gray-light bg-opacity-50">
                        <tr>
                            <th scope="col" className="px-4 py-3 w-16">Miniatura</th>
                            <th scope="col" className="px-4 py-3">Nombre</th>
                            <th scope="col" className="px-4 py-3">Tipo</th>
                            <th scope="col" className="px-4 py-3">Tamaño</th>
                            <th scope="col" className="px-4 py-3">Subido el</th>
                            <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-gray-light">
                        {filteredMediaItems.map(item => (
                            <tr key={item.id} className="hover:bg-brand-gray-light hover:bg-opacity-30 transition-colors">
                                <td className="px-4 py-2">
                                    {item.mimeType.startsWith('image/') ? (
                                        <img src={item.public_url} alt={item.name} className="h-10 w-10 object-contain rounded bg-white border border-brand-quaternary/50" />
                                    ) : (
                                        <div className="h-10 w-10 flex items-center justify-center bg-brand-gray-light rounded border border-brand-quaternary/50">
                                            <MediaIcon className="w-6 h-6 text-brand-gray-medium" />
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-2 font-medium text-text-primary whitespace-nowrap text-sm" title={item.name}>
                                    {item.name.length > MAX_DISPLAY_FILENAME_LENGTH_LIST ? item.name.substring(0, MAX_DISPLAY_FILENAME_LENGTH_LIST) + '...' : item.name}
                                </td>
                                <td className="px-4 py-2 text-xs">{item.mimeType}</td>
                                <td className="px-4 py-2 text-xs">{formatFileSize(item.size)}</td>
                                <td className="px-4 py-2 text-xs">{getFormattedDate(item.uploadedAt)}</td>
                                <td className="px-4 py-2 text-right">
                                    <button 
                                        onClick={() => handleDeleteClick(item)} 
                                        className="icon-btn !p-1.5 text-error hover:text-red-700" 
                                        title="Eliminar Medio"
                                    >
                                        <DeleteIcon className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
      {itemToDelete && (
        <ConfirmDeleteModal
          isOpen={showDeleteConfirmModal}
          onClose={() => setShowDeleteConfirmModal(false)}
          onConfirm={handleConfirmDelete}
          title="Confirmar Eliminación de Medio"
          message={`¿Estás seguro de que quieres eliminar el archivo "${itemToDelete.name}"? Esta acción no se puede deshacer.`}
          itemName={itemToDelete.name}
        />
      )}
    </div>
  );
};

export default AdminMediaManagementPage;
