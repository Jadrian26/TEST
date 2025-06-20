
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditableContent } from '../../contexts/EditableContentContext';
import { School } from '../../types';
import AddSchoolModal from '../../components/admin/AddSchoolModal';
import EditSchoolModal from '../../components/admin/EditSchoolModal'; 
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import EditIcon from '../../components/admin/icons/EditIcon'; 
import DeleteIcon from '../../components/admin/icons/DeleteIcon'; 
import PlusCircleIcon from '../../components/icons/PlusCircleIcon'; 
import ProductIcon from '../../components/admin/icons/ProductIcon'; 
import ViewIcon from '../../components/admin/icons/ViewIcon'; 
import useModalState from '../../hooks/useModalState'; 
import { useNotifications } from '../../contexts/NotificationsContext'; // Added

const AdminManageSchoolsPage: React.FC = () => {
  const { schools, products, isLoading, deleteSchool } = useEditableContent();
  const { showNotification } = useNotifications(); // Added
  const navigate = useNavigate();
  
  const { isOpen: isAddSchoolModalOpen, openModal: openAddSchoolModal, closeModal: closeAddSchoolModal } = useModalState();
  const { isOpen: isEditSchoolModalOpen, openModal: openEditSchoolModalDirect, closeModal: closeEditSchoolModal } = useModalState();
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModalDirect, closeModal: closeDeleteModal } = useModalState();
  
  const [schoolToEdit, setSchoolToEdit] = useState<School | null>(null);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);

  const schoolProductCounts = useMemo(() => {
    const counts: { [schoolId: string]: number } = {};
    products.forEach(product => {
      if (product.schoolId) {
        counts[product.schoolId] = (counts[product.schoolId] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const handleOpenEditModal = (school: School) => {
    setSchoolToEdit(school);
    openEditSchoolModalDirect();
  };

  const handleOpenDeleteModal = (school: School) => {
    setSchoolToDelete(school);
    openDeleteModalDirect();
  };

  const confirmDeleteSchool = () => {
    if (schoolToDelete) {
      try {
        deleteSchool(schoolToDelete.id);
        showNotification(`Colegio "${schoolToDelete.name}" eliminado exitosamente.`, 'success');
      } catch (error) {
        showNotification('Error al eliminar el colegio.', 'error');
        console.error("Error deleting school:", error);
      }
    }
  };

  const handleViewProducts = (schoolId: string) => {
    navigate(`/admin/colegios/${schoolId}/productos`);
  };

  if (isLoading) {
    return <div className="text-center py-10 text-text-secondary">Cargando lista de colegios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-brand-quaternary border-opacity-30">
        <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary">Gestión de Catálogo</h1>
            <p className="text-text-secondary text-base sm:text-lg mt-1">Gestiona los colegios de la plataforma y accede a sus respectivos catálogos de productos.</p>
        </div>
        <button 
          onClick={openAddSchoolModal} 
          className="btn-primary text-sm sm:text-base whitespace-nowrap mt-3 sm:mt-0 flex items-center"
        >
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          Añadir Nuevo Colegio
        </button>
      </div>

      {schools.length === 0 ? (
        <div className="text-center py-12 bg-brand-primary p-6 rounded-lg shadow-card">
           <svg className="mx-auto h-12 w-12 text-brand-quaternary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
           </svg>
          <h3 className="mt-2 text-base sm:text-lg font-medium text-text-primary">No hay colegios registrados.</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Comienza añadiendo el primer colegio para gestionar sus productos.
          </p>
          <div className="mt-6">
            <button 
              onClick={openAddSchoolModal} 
              className="btn-secondary text-sm sm:text-base flex items-center mx-auto"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Añadir Colegio
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((school) => (
            <div key={school.id} className="bg-brand-primary rounded-lg shadow-card hover:shadow-card-hover transition-shadow flex flex-col">
              <div className="p-5">
                <div className="flex items-center mb-3">
                  <div className="h-12 w-12 flex-shrink-0 mr-4 bg-brand-gray-light rounded-md flex items-center justify-center overflow-hidden">
                    <img src={school.logoUrl} alt={`Logo de ${school.name}`} className="max-h-full max-w-full object-contain p-1" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-brand-secondary leading-tight">{school.name}</h2>
                    <p className="text-xs text-text-secondary flex items-center">
                      <ProductIcon className="w-3 h-3 mr-1 text-brand-gray-medium" />
                      ({schoolProductCounts[school.id] || 0}) Productos Registrados
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-brand-gray-light p-4 mt-auto space-y-2">
                 <button 
                    onClick={() => handleViewProducts(school.id)} 
                    className="btn-secondary w-full text-sm sm:text-base flex items-center justify-center"
                  >
                    <ViewIcon className="w-4 h-4 mr-2" /> Ver Productos
                  </button>
                <div className="flex justify-end space-x-2">
                  <button 
                    onClick={() => handleOpenEditModal(school)} 
                    className="btn-ghost text-xs px-3 py-1.5 flex items-center" 
                    title="Editar Colegio"
                  >
                    <EditIcon className="w-3.5 h-3.5 mr-1" /> Editar
                  </button>
                  <button 
                    onClick={() => handleOpenDeleteModal(school)} 
                    className="btn-ghost !text-error hover:!bg-error/10 text-xs px-3 py-1.5 flex items-center" 
                    title="Eliminar Colegio"
                  >
                    <DeleteIcon className="w-3.5 h-3.5 mr-1" /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddSchoolModal isOpen={isAddSchoolModalOpen} onClose={closeAddSchoolModal} />
      {schoolToEdit && <EditSchoolModal isOpen={isEditSchoolModalOpen} onClose={closeEditSchoolModal} schoolToEdit={schoolToEdit} />}
      {schoolToDelete && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={confirmDeleteSchool}
          title="Confirmar Eliminación de Colegio"
          message={`¿Estás seguro de que quieres eliminar el colegio "${schoolToDelete.name}"? Todos los productos asociados a este colegio serán desvinculados (no eliminados).`}
          itemName={schoolToDelete.name}
        />
      )}
    </div>
  );
};

export default AdminManageSchoolsPage;
