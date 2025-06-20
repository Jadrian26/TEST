
import React, { useState, useMemo, useEffect, ChangeEvent, DragEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEditableContent } from '../../contexts/EditableContentContext';
import { Product, School } from '../../types';
import AddProductModal from '../../components/admin/AddProductModal';
import EditProductModal from '../../components/admin/EditProductModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import EditIcon from '../../components/admin/icons/EditIcon';
import DeleteIcon from '../../components/admin/icons/DeleteIcon';
import PlusCircleIcon from '../../components/icons/PlusCircleIcon';
import DragHandleIcon from '../../components/admin/icons/DragHandleIcon';
import useDraggableList from '../../hooks/useDraggableList'; 
import useModalState from '../../hooks/useModalState'; 
import { useNotifications } from '../../contexts/NotificationsContext';
import { useSearchAndFilter } from '../../hooks/useSearchAndFilter'; // Added

const AdminSchoolProductsPage: React.FC = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { products, schools, isLoading, deleteProduct, updateProductOrder } = useEditableContent();
  const { showNotification } = useNotifications();

  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  
  const { isOpen: isAddProductModalOpen, openModal: openAddProductModal, closeModal: closeAddProductModal } = useModalState();
  const { isOpen: isEditProductModalOpen, openModal: openEditProductModalDirect, closeModal: closeEditProductModal } = useModalState();
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModalDirect, closeModal: closeDeleteModal } = useModalState();

  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const initialSchoolProducts = useMemo(() => {
    if (!isLoading && schoolId) {
      return products
        .filter(p => p.schoolId === schoolId)
        .sort((a, b) => a.orderIndex - b.orderIndex);
    }
    return [];
  }, [products, schoolId, isLoading]);

  const {
    orderedItems: orderedLocalProducts,
    draggingIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    setOrderedItems: setOrderedLocalProducts 
  } = useDraggableList<Product>({
    initialItems: initialSchoolProducts,
    onOrderChange: (newOrderedList) => {
      if (schoolId) {
        try {
          updateProductOrder(schoolId, newOrderedList.map(p => p.id));
          showNotification("Orden de productos actualizado.", "success");
        } catch (error) {
          showNotification("Error al actualizar el orden de los productos.", "error");
          console.error("Error updating product order:", error);
        }
      }
    },
    getItemId: (item) => item.id,
  });

  const {
    processedData: filteredAndOrderedProducts,
    searchTerm,
    setSearchTerm
  } = useSearchAndFilter<Product>(orderedLocalProducts, { searchKeys: ['name']});
  
  useEffect(() => {
    if (!isLoading && schoolId) {
      const foundSchool = schools.find(s => s.id === schoolId);
      if (foundSchool) {
        setCurrentSchool(foundSchool);
        const latestSchoolProducts = products
          .filter(p => p.schoolId === schoolId)
          .sort((a, b) => a.orderIndex - b.orderIndex);

        const localProductIds = orderedLocalProducts.map(p => p.id).join(',');
        const contextProductIds = latestSchoolProducts.map(p => p.id).join(',');

        if (localProductIds !== contextProductIds || orderedLocalProducts.length !== latestSchoolProducts.length) {
          setOrderedLocalProducts(latestSchoolProducts);
        }

      } else {
        navigate('/admin/colegios');
      }
    }
  }, [schoolId, schools, products, isLoading, navigate, setOrderedLocalProducts, orderedLocalProducts]);

  const handleOpenEditModal = (product: Product) => {
    setProductToEdit(product);
    openEditProductModalDirect();
  };

  const handleOpenDeleteModal = (product: Product) => {
    setProductToDelete(product);
    openDeleteModalDirect();
  };

  const confirmDeleteProductAction = () => {
    if (productToDelete) {
      try {
        deleteProduct(productToDelete.id);
        showNotification(`Producto "${productToDelete.name}" eliminado exitosamente.`, 'success');
      } catch (error) {
        showNotification('Error al eliminar el producto.', 'error');
        console.error("Error deleting product:", error);
      }
    }
  };

  const getProductPriceDisplay = (product: Product): string => {
    if (!product.variants || product.variants.length === 0) {
      return "N/A";
    }
    const prices = product.variants.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return `$${minPrice.toFixed(2)}`;
    }
    return `Desde $${minPrice.toFixed(2)}`;
  };

  const getProductSizesDisplay = (product: Product): string => {
    if (!product.variants || product.variants.length === 0) {
      return "N/A";
    }
    const uniqueSizes = [...new Set(product.variants.map(v => v.size))];
    return uniqueSizes.join(', ');
  };
  
  if (isLoading || !currentSchool) {
    return <div className="text-center py-10 text-text-secondary">Cargando productos del colegio...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-brand-quaternary border-opacity-30">
        <Link to="/admin/colegios" className="text-sm text-brand-tertiary hover:text-brand-secondary font-medium flex items-center mb-2 group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          Volver a Gestión de Catálogo
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary">
                    Productos: <span className="text-brand-tertiary">{currentSchool.name}</span>
                </h1>
                <p className="text-text-secondary text-base sm:text-lg mt-1">Gestiona y reordena los productos asociados a este colegio.</p>
            </div>
            <button 
              onClick={openAddProductModal} 
              className="btn-primary text-sm sm:text-base whitespace-nowrap mt-3 sm:mt-0 flex items-center"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Añadir Nuevo Producto
            </button>
        </div>
      </div>

      <div className="bg-brand-primary p-4 rounded-lg shadow-sm">
        <label htmlFor="productSearch" className="block text-xs font-medium text-text-secondary mb-1">Buscar por nombre de producto:</label>
        <input
          type="text"
          id="productSearch"
          placeholder="Escribe para buscar productos..."
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 text-sm"
        />
      </div>

      {filteredAndOrderedProducts.length === 0 ? (
        <div className="text-center py-12 bg-brand-primary p-6 rounded-lg shadow-card">
           <svg className="mx-auto h-12 w-12 text-brand-quaternary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
           </svg>
          <h3 className="mt-2 text-base sm:text-lg font-medium text-text-primary">
            {orderedLocalProducts.length === 0 ? `No hay productos registrados para ${currentSchool.name}.` : "No se encontraron productos con la búsqueda actual."}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {orderedLocalProducts.length === 0 ? "Comienza añadiendo el primer producto a este colegio." : "Intenta ajustar tu búsqueda."}
          </p>
          <div className="mt-6">
            <button 
                onClick={openAddProductModal} 
                className="btn-secondary text-sm sm:text-base flex items-center mx-auto"
            >
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Añadir Producto a {currentSchool.name}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-brand-primary shadow-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm text-left text-text-secondary">
              <thead className="text-xs text-text-primary uppercase bg-brand-gray-light bg-opacity-50">
                <tr>
                  <th scope="col" className="px-2 py-3 w-10 text-center"></th>
                  <th scope="col" className="px-4 py-3 w-16">Imagen</th>
                  <th scope="col" className="px-4 py-3">Nombre</th>
                  <th scope="col" className="px-4 py-3">Precio</th>
                  <th scope="col" className="px-4 py-3">Tallas</th>
                  <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndOrderedProducts.map((product, index) => (
                  <tr 
                    key={product.id} 
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, orderedLocalProducts.findIndex(p => p.id === product.id) )} 
                    onDragOver={(e) => handleDragOver(e, orderedLocalProducts.findIndex(p => p.id === product.id))}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, orderedLocalProducts.findIndex(p => p.id === product.id))}
                    onDragEnd={handleDragEnd}
                    className={`transition-all duration-150 ease-in-out group
                                ${draggingIndex === orderedLocalProducts.findIndex(p => p.id === product.id) ? 'opacity-40 bg-brand-tertiary/20 scale-105 shadow-lg' : ''}
                                ${dragOverIndex === orderedLocalProducts.findIndex(p => p.id === product.id) && draggingIndex !== null && draggingIndex !== orderedLocalProducts.findIndex(p => p.id === product.id) ? 'outline outline-2 outline-offset-[-2px] outline-brand-tertiary rounded' : ''}
                                hover:bg-brand-gray-light hover:bg-opacity-30`}
                  >
                    <td className="px-2 py-2 text-center align-middle">
                      <div className="inline-flex items-center justify-center h-full text-brand-gray-medium group-hover:text-brand-secondary cursor-grab" title="Arrastrar para reordenar">
                        <DragHandleIcon className="w-5 h-5" />
                      </div>
                    </td>
                    <td className="px-4 py-2 align-middle">
                      <img src={product.imageUrl} alt={product.name} className="h-10 w-10 object-contain rounded bg-brand-gray-light p-0.5" />
                    </td>
                    <td className="px-4 py-2 font-medium text-text-primary whitespace-nowrap align-middle text-sm">{product.name}</td>
                    <td className="px-4 py-2 align-middle text-sm">{getProductPriceDisplay(product)}</td>
                    <td className="px-4 py-2 text-xs align-middle">{getProductSizesDisplay(product)}</td>
                    <td className="px-4 py-2 text-right space-x-1 whitespace-nowrap align-middle">
                      <button 
                        onClick={() => handleOpenEditModal(product)} 
                        className="icon-btn text-brand-secondary hover:text-brand-tertiary" 
                        title="Editar Producto"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenDeleteModal(product)} 
                        className="icon-btn text-error hover:text-red-700" 
                        title="Eliminar Producto"
                      >
                        <DeleteIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddProductModal 
        isOpen={isAddProductModalOpen} 
        onClose={closeAddProductModal} 
        preselectedSchoolId={currentSchool.id}
      />
      {productToEdit && <EditProductModal isOpen={isEditProductModalOpen} onClose={closeEditProductModal} productToEdit={productToEdit} />}
      {productToDelete && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={confirmDeleteProductAction}
          title="Confirmar Eliminación de Producto"
          message={`¿Estás seguro de que quieres eliminar el producto "${productToDelete.name}"?`}
          itemName={productToDelete.name}
        />
      )}
    </div>
  );
};

export default AdminSchoolProductsPage;
