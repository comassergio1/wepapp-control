import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Client } from '../types';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const Clientes: React.FC = () => {
  const { user } = useAuth();
  const { clients, addClient, updateClient, deleteClient, accounts, updateAccount, loading, error } = useData();
  const [showAddClient, setShowAddClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showViewClient, setShowViewClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [clientFormError, setClientFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = user?.role === 'admin';

  const resetClientForm = () => {
    setClientForm({ name: '', email: '', phone: '', address: '' });
    setClientFormError('');
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setClientForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address
    });
    setShowEditClient(true);
  };

  const openViewModal = (client: Client) => {
    setSelectedClient(client);
    setShowViewClient(true);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientFormError('');
    setIsSubmitting(true);

    try {
      if (!clientForm.name || !clientForm.email || !clientForm.phone || !clientForm.address) {
        setClientFormError('Todos los campos son obligatorios');
        return;
      }

      await addClient({
        name: clientForm.name,
        email: clientForm.email,
        phone: clientForm.phone,
        address: clientForm.address,
        revendedorId: user?.id || '1',
        revendedorName: user?.name || 'Revendedor',
        isActive: true
      });

      setShowAddClient(false);
      resetClientForm();
    } catch (err: any) {
      // Manejo de error de email duplicado
      if (err && err.error && err.error.includes('Ya existe un cliente con ese email')) {
        setClientFormError('El cliente ya existe');
      } else {
        setClientFormError('Error al agregar el cliente');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    setClientFormError('');
    setIsSubmitting(true);

    try {
      if (!clientForm.name || !clientForm.email || !clientForm.phone || !clientForm.address) {
        setClientFormError('Todos los campos son obligatorios');
        return;
      }

      await updateClient({
        ...selectedClient,
        name: clientForm.name,
        email: clientForm.email,
        phone: clientForm.phone,
        address: clientForm.address
      });

      setShowEditClient(false);
      setSelectedClient(null);
      resetClientForm();
    } catch (err) {
      setClientFormError('Error al actualizar el cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (client: Client) => {
    if (user?.role !== 'admin') {
      alert('Solo los administradores pueden eliminar clientes.');
      return;
    }
    if (window.confirm(`¿Estás seguro de que quieres eliminar el cliente "${client.name}"?`)) {
      try {
        await deleteClient(client.id);
      } catch (err: any) {
        // Manejo de error de cuentas activas
        if (err && err.message && err.message.includes('cuentas activas')) {
          alert('Este cliente no puede eliminarse porque posee una cuenta activa.');
        } else {
          alert('Error al eliminar el cliente');
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando clientes...</p>
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
            Clientes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona la base de datos de clientes
          </p>
        </div>
        <button
          onClick={() => setShowAddClient(true)}
          className="btn-primary inline-flex items-center justify-center sm:justify-start px-2 sm:px-4 py-2 w-auto self-start"
        >
          <PlusIcon className="h-5 w-5 sm:mr-2" />
          <span className="hidden sm:inline">Agregar Cliente</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar clientes por nombre, email o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Clientes
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {filteredClients.length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-8 w-8 text-green-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Clientes Activos
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {filteredClients.filter(c => c.isActive).length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-8 w-8 text-red-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Clientes Inactivos
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {filteredClients.filter(c => !c.isActive).length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-8 w-8 text-blue-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Este Mes
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {filteredClients.filter(c => {
                    const thisMonth = new Date();
                    const clientDate = new Date(c.createdAt);
                    return thisMonth.getMonth() === clientDate.getMonth() &&
                           thisMonth.getFullYear() === clientDate.getFullYear();
                  }).length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {client.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {client.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center mb-1">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        {client.email}
                      </div>
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                        {client.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.revendedorName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      client.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {client.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    {canEdit && (
                      <button
                        className={`ml-2 ${client.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        title={client.isActive ? 'Desactivar cliente' : 'Activar cliente'}
                        onClick={() => {
                          const newStatus = !client.isActive;
                          updateClient({ ...client, isActive: newStatus });
                          // Actualizar el estado de todas las cuentas asociadas a este cliente
                          const clientAccounts = accounts.filter(account => account.clientId === client.id);
                          clientAccounts.forEach(account => {
                            const updatedAccount = { ...account, isActive: newStatus };
                            updateAccount(updatedAccount);
                          });
                        }}
                      >
                        {client.isActive ? (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button onClick={() => openViewModal(client)} className="text-blue-600 hover:text-blue-900 flex items-center justify-center h-8 w-8 p-0 mx-auto"><EyeIcon className="h-4 w-4" /></button>
                      {canEdit && (
                        <>
                          <button onClick={() => openEditModal(client)} className="text-primary-600 hover:text-primary-900 flex items-center justify-center h-8 w-8 p-0 mx-auto"><PencilIcon className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteClient(client)} className="text-red-600 hover:text-red-900 flex items-center justify-center h-8 w-8 p-0 mx-auto"><TrashIcon className="h-4 w-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ver Cliente */}
      {showViewClient && selectedClient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detalle del Cliente</h3>
              <div className="space-y-2">
                <div><span className="font-semibold">Nombre:</span> {selectedClient.name}</div>
                <div><span className="font-semibold">Email:</span> {selectedClient.email}</div>
                <div><span className="font-semibold">Teléfono:</span> {selectedClient.phone}</div>
                <div><span className="font-semibold">Dirección:</span> {selectedClient.address}</div>
                <div><span className="font-semibold">Revendedor:</span> {selectedClient.revendedorName}</div>
                <div><span className="font-semibold">Estado:</span> {selectedClient.isActive ? 'Activo' : 'Inactivo'}</div>
                <div><span className="font-semibold">Fecha de alta:</span> {selectedClient.createdAt.toLocaleDateString()}</div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={() => setShowViewClient(false)} className="btn-secondary">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Cliente */}
      {showAddClient && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Cliente</h3>
              <form className="space-y-4" onSubmit={handleAddClient}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                  <input type="text" className="input-field mt-1" placeholder="Nombre del cliente" value={clientForm.name} onChange={e => setClientForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" className="input-field mt-1" placeholder="email@ejemplo.com" value={clientForm.email} onChange={e => setClientForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <input type="tel" className="input-field mt-1" placeholder="+54 11 1234-5678" value={clientForm.phone} onChange={e => setClientForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección</label>
                  <textarea className="input-field mt-1" rows={3} placeholder="Dirección completa" value={clientForm.address} onChange={e => setClientForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                {clientFormError && <div className="text-red-600 text-sm">{clientFormError}</div>}
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => { setShowAddClient(false); resetClientForm(); }} className="btn-secondary">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Cliente */}
      {showEditClient && selectedClient && canEdit && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Cliente</h3>
              <form className="space-y-4" onSubmit={handleEditClient}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                  <input type="text" className="input-field mt-1" value={clientForm.name} onChange={e => setClientForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" className="input-field mt-1" value={clientForm.email} onChange={e => setClientForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <input type="tel" className="input-field mt-1" value={clientForm.phone} onChange={e => setClientForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección</label>
                  <textarea className="input-field mt-1" rows={3} value={clientForm.address} onChange={e => setClientForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                {clientFormError && <div className="text-red-600 text-sm">{clientFormError}</div>}
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => { setShowEditClient(false); setSelectedClient(null); resetClientForm(); }} className="btn-secondary">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary">Actualizar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes; 