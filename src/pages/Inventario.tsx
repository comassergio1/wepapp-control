import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Product, InventoryMovement } from '../types';
import {
  PlusIcon,
  MinusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CubeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useCurrency } from '../contexts/CurrencyContext';

const Inventario: React.FC = () => {
  const { user } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct, movements, addMovement, users, loading, error } = useData();
  const { currency, setCurrency, formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showViewProduct, setShowViewProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    location: 'Central',
  });
  const [productFormError, setProductFormError] = useState('');

  // Formulario de movimiento
  const [movementForm, setMovementForm] = useState({
    productId: '',
    type: 'ingreso' as 'ingreso' | 'egreso' | 'traslado' | 'desvio',
    quantity: '',
    notes: '',
    fromLocation: '',
    toLocation: '',
  });
  const [movementFormError, setMovementFormError] = useState('');

  // Formulario de edición masiva
  const [bulkEditForm, setBulkEditForm] = useState({
    editType: 'percentage' as 'percentage' | 'fixed',
    value: '',
    selectedProducts: [] as string[],
  });

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener ubicaciones disponibles (Central + emails de revendedores)
  const availableLocations = ['Central', ...users.filter(u => u.role === 'revendedor').map(u => u.email)];

  const canEdit = user?.role === 'admin';

  const resetProductForm = () => {
    setProductForm({ name: '', description: '', price: '', stock: '', category: '', location: 'Central' });
    setProductFormError('');
  };

  const resetMovementForm = () => {
    setMovementForm({
      productId: '',
      type: 'ingreso',
      quantity: '',
      notes: '',
      fromLocation: '',
      toLocation: '',
    });
    setMovementFormError('');
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      location: product.location
    });
    setShowEditProduct(true);
  };

  const openViewModal = (product: Product) => {
    setSelectedProduct(product);
    setShowViewProduct(true);
  };

  const validateProductForm = () => {
    if (!productForm.name.trim() || !productForm.description.trim() || !productForm.price.trim() || !productForm.stock.trim() || !productForm.category.trim()) {
      setProductFormError('Todos los campos son obligatorios.');
      return false;
    }
    if (isNaN(Number(productForm.price)) || isNaN(Number(productForm.stock))) {
      setProductFormError('Precio y stock deben ser números.');
      return false;
    }
    setProductFormError('');
    return true;
  };

  const validateMovementForm = () => {
    if (!movementForm.productId || !movementForm.quantity.trim()) {
      setMovementFormError('Producto y cantidad son obligatorios.');
      return false;
    }
    if (isNaN(Number(movementForm.quantity)) || Number(movementForm.quantity) <= 0) {
      setMovementFormError('La cantidad debe ser un número positivo.');
      return false;
    }
    if (movementForm.type === 'traslado' && (!movementForm.fromLocation || !movementForm.toLocation)) {
      setMovementFormError('Para traslados, origen y destino son obligatorios.');
      return false;
    }
    setMovementFormError('');
    return true;
  };

  const handleSubmitAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProductForm()) return;
    
    try {
      await addProduct({
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        category: productForm.category,
        location: productForm.location
      });

      setShowAddProduct(false);
      resetProductForm();
    } catch (err) {
      setProductFormError('Error al agregar el producto');
    }
  };

  const handleSubmitEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !validateProductForm()) return;

    try {
      await updateProduct({
        ...selectedProduct,
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        category: productForm.category,
        location: productForm.location
      });

      setShowEditProduct(false);
      setSelectedProduct(null);
      resetProductForm();
    } catch (err) {
      setProductFormError('Error al actualizar el producto');
    }
  };

  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMovementForm()) return;

    try {
      const product = products.find(p => p.id === movementForm.productId);
      if (!product) {
        setMovementFormError('Producto no encontrado.');
        return;
      }

      await addMovement({
        productId: movementForm.productId,
        productName: product.name,
        type: movementForm.type,
        quantity: Number(movementForm.quantity),
        previousStock: product.stock,
        newStock: movementForm.type === 'ingreso' ? product.stock + Number(movementForm.quantity) : product.stock - Number(movementForm.quantity),
        userId: user?.id || '',
        userName: user?.name || '',
        notes: movementForm.notes,
        fromLocation: movementForm.fromLocation,
        toLocation: movementForm.toLocation
      });

      setShowMovement(false);
      resetMovementForm();
    } catch (err) {
      setMovementFormError('Error al registrar el movimiento');
    }
  };

  const handleBulkEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkEditForm.selectedProducts.length === 0) {
      alert('Selecciona al menos un producto.');
      return;
    }
    if (!bulkEditForm.value.trim() || isNaN(Number(bulkEditForm.value))) {
      alert('Ingresa un valor válido.');
      return;
    }

    try {
      const value = Number(bulkEditForm.value);
      const selectedProducts = products.filter(p => bulkEditForm.selectedProducts.includes(p.id));

      for (const product of selectedProducts) {
        let newPrice = product.price;
        if (bulkEditForm.editType === 'percentage') {
          newPrice = product.price * (1 + value / 100);
        } else {
          newPrice = product.price + value;
        }

        await updateProduct({
          ...product,
          price: Math.max(0, newPrice) // Evitar precios negativos
        });
      }

      setShowBulkEdit(false);
      setBulkEditForm({ editType: 'percentage', value: '', selectedProducts: [] });
      alert('Precios actualizados correctamente.');
    } catch (err) {
      alert('Error al actualizar los precios');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el producto "${product.name}"?`)) {
      try {
        await deleteProduct(product.id);
      } catch (err) {
        alert('Error al eliminar el producto');
      }
    }
  };

  const getMovementsForProduct = (productId: string) => {
    return movements.filter(m => m.productId === productId);
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'ingreso': return 'bg-green-100 text-green-800';
      case 'egreso': return 'bg-red-100 text-red-800';
      case 'traslado': return 'bg-blue-100 text-blue-800';
      case 'desvio': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'ingreso': return <PlusIcon className="h-3 w-3 mr-1" />;
      case 'egreso': return <MinusIcon className="h-3 w-3 mr-1" />;
      case 'traslado': return <ArrowRightIcon className="h-3 w-3 mr-1" />;
      case 'desvio': return <ChartBarIcon className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p className="font-medium">Error:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Inventario
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona el stock de productos y registra movimientos
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2 sm:space-x-3">
            <button
              onClick={() => setShowAddProduct(true)}
              className="btn-primary flex items-center justify-center sm:justify-start px-2 sm:px-4 py-2"
            >
              <CubeIcon className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Agregar Producto</span>
            </button>
            <button
              onClick={() => setShowMovement(true)}
              className="btn-secondary flex items-center justify-center sm:justify-start px-2 sm:px-4 py-2"
            >
              <ArrowPathIcon className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Registrar Movimiento</span>
            </button>
            <button
              className="btn-secondary flex items-center justify-center sm:justify-start px-2 sm:px-4 py-2"
              onClick={() => setShowBulkEdit(true)}
            >
              <CurrencyDollarIcon className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Edición Masiva</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('stock')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stock'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Stock Actual
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'movements'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Movimientos
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Content */}
      {activeTab === 'stock' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  {canEdit && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stock > 10 ? 'bg-green-100 text-green-800' :
                        product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.stock} unidades
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stock > 10 ? 'bg-green-100 text-green-800' :
                        product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.stock > 10 ? 'Disponible' :
                         product.stock > 0 ? 'Stock Bajo' : 'Sin Stock'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button onClick={() => openViewModal(product)} className="text-blue-600 hover:text-blue-900 flex items-center justify-center h-8 w-8 p-0 mx-auto"><EyeIcon className="h-4 w-4" /></button>
                          <button onClick={() => openEditModal(product)} className="text-primary-600 hover:text-primary-900 flex items-center justify-center h-8 w-8 p-0 mx-auto"><PencilIcon className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteProduct(product)} className="text-red-600 hover:text-red-900 flex items-center justify-center h-8 w-8 p-0 mx-auto">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'movements' && (
        <div className="space-y-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {product.name} - {product.location}
                </h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  product.stock > 10 ? 'bg-green-100 text-green-800' :
                  product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  Stock: {product.stock} unidades
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Anterior
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Nuevo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getMovementsForProduct(product.id).map((movement) => (
                      <tr key={movement.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movement.date.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getMovementTypeColor(movement.type)}`}>
                            {getMovementTypeIcon(movement.type)}
                            {movement.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movement.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movement.previousStock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movement.newStock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movement.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movement.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showViewProduct && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detalle del Producto</h3>
              <div className="space-y-2">
                <div><span className="font-semibold">Nombre:</span> {selectedProduct.name}</div>
                <div><span className="font-semibold">Descripción:</span> {selectedProduct.description}</div>
                <div><span className="font-semibold">Precio:</span> {formatCurrency(selectedProduct.price)}</div>
                <div><span className="font-semibold">Stock:</span> {selectedProduct.stock} unidades</div>
                <div><span className="font-semibold">Categoría:</span> {selectedProduct.category}</div>
                <div><span className="font-semibold">Ubicación:</span> {selectedProduct.location}</div>
                <div><span className="font-semibold">Fecha de alta:</span> {selectedProduct.createdAt.toLocaleDateString()}</div>
                <div><span className="font-semibold">Última actualización:</span> {selectedProduct.updatedAt.toLocaleDateString()}</div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={() => setShowViewProduct(false)} className="btn-secondary">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddProduct && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Producto</h3>
              <form className="space-y-4" onSubmit={handleSubmitAddProduct}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input type="text" className="input-field mt-1" value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea className="input-field mt-1" rows={2} value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio</label>
                  <input type="number" className="input-field mt-1" value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock</label>
                  <input type="number" className="input-field mt-1" value={productForm.stock} onChange={e => setProductForm(f => ({ ...f, stock: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoría</label>
                  <input type="text" className="input-field mt-1" value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                  <select className="input-field mt-1" value={productForm.location} onChange={e => setProductForm(f => ({ ...f, location: e.target.value }))}>
                    {availableLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
                {productFormError && <div className="text-red-600 text-sm">{productFormError}</div>}
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => { setShowAddProduct(false); resetProductForm(); }} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditProduct && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Producto</h3>
              <form className="space-y-4" onSubmit={handleSubmitEditProduct}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input type="text" className="input-field mt-1" value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea className="input-field mt-1" rows={2} value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio</label>
                  <input type="number" className="input-field mt-1" value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock</label>
                  <input type="number" className="input-field mt-1" value={productForm.stock} onChange={e => setProductForm(f => ({ ...f, stock: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoría</label>
                  <input type="text" className="input-field mt-1" value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                  <select className="input-field mt-1" value={productForm.location} onChange={e => setProductForm(f => ({ ...f, location: e.target.value }))}>
                    {availableLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
                {productFormError && <div className="text-red-600 text-sm">{productFormError}</div>}
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => { setShowEditProduct(false); setSelectedProduct(null); resetProductForm(); }} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">Actualizar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showMovement && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Registrar Movimiento
              </h3>
              <form className="space-y-4" onSubmit={handleSubmitMovement}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Producto</label>
                  <select className="input-field mt-1" value={movementForm.productId} onChange={e => setMovementForm(f => ({ ...f, productId: e.target.value }))}>
                    <option value="">Seleccionar producto</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {p.location}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Movimiento</label>
                  <select className="input-field mt-1" value={movementForm.type} onChange={e => setMovementForm(f => ({ ...f, type: e.target.value as any }))}>
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                    <option value="traslado">Traslado</option>
                    <option value="desvio">Desvío</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                  <input type="number" className="input-field mt-1" value={movementForm.quantity} onChange={e => setMovementForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
                {movementForm.type === 'traslado' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Desde</label>
                      <select className="input-field mt-1" value={movementForm.fromLocation} onChange={e => setMovementForm(f => ({ ...f, fromLocation: e.target.value }))}>
                        <option value="">Seleccionar origen</option>
                        {availableLocations.map(location => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hacia</label>
                      <select className="input-field mt-1" value={movementForm.toLocation} onChange={e => setMovementForm(f => ({ ...f, toLocation: e.target.value }))}>
                        <option value="">Seleccionar destino</option>
                        {availableLocations.map(location => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notas</label>
                  <textarea className="input-field mt-1" rows={2} value={movementForm.notes} onChange={e => setMovementForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                {movementFormError && <div className="text-red-600 text-sm">{movementFormError}</div>}
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => { setShowMovement(false); resetMovementForm(); }} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">Registrar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showBulkEdit && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edición Masiva de Precios
              </h3>
              <form className="space-y-4" onSubmit={handleBulkEdit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Edición</label>
                  <select className="input-field mt-1" value={bulkEditForm.editType} onChange={e => setBulkEditForm(f => ({ ...f, editType: e.target.value as any }))}>
                    <option value="percentage">Por Porcentaje</option>
                    <option value="fixed">Por Monto Fijo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {bulkEditForm.editType === 'percentage' ? 'Porcentaje (%)' : 'Monto ($)'}
                  </label>
                  <input 
                    type="number" 
                    className="input-field mt-1" 
                    value={bulkEditForm.value} 
                    onChange={e => setBulkEditForm(f => ({ ...f, value: e.target.value }))}
                    placeholder={bulkEditForm.editType === 'percentage' ? 'Ej: 10 para +10%' : 'Ej: 1000 para +$1000'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Productos a Modificar</label>
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {products.map(product => (
                      <label key={product.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={bulkEditForm.selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkEditForm(f => ({ ...f, selectedProducts: [...f.selectedProducts, product.id] }));
                            } else {
                              setBulkEditForm(f => ({ ...f, selectedProducts: f.selectedProducts.filter(id => id !== product.id) }));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{product.name} - {formatCurrency(product.price)}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => { setShowBulkEdit(false); setBulkEditForm({ editType: 'percentage', value: '', selectedProducts: [] }); }} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">Actualizar Precios</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario; 