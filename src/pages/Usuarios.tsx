import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { User } from '../types';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const Usuarios: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { users, addUser, updateUser, deleteUser, loading, error } = useData();
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showViewUser, setShowViewUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'revendedor' as 'admin' | 'revendedor',
  });
  const [userFormError, setUserFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = currentUser?.role === 'admin';

  const resetUserForm = () => {
    setUserForm({ name: '', email: '', password: '', role: 'revendedor' });
    setUserFormError('');
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowViewUser(true);
  };

  const handleAddUser = () => {
    resetUserForm();
    setShowAddUser(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setShowEditUser(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert('No puedes eliminar tu propia cuenta');
      return;
    }
    
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        await deleteUser(userId);
      } catch (err) {
        alert('Error al eliminar el usuario');
      }
    }
  };

  const toggleUserStatus = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert('No puedes desactivar tu propia cuenta');
      return;
    }
    
    const user = users.find(u => u.id === userId);
    if (user) {
      try {
        await updateUser({ ...user, isActive: !user.isActive });
      } catch (err) {
        alert('Error al cambiar el estado del usuario');
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'revendedor':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'revendedor':
        return 'Revendedor';
      default:
        return 'Desconocido';
    }
  };

  const validateUserForm = (isEdit = false) => {
    if (!userForm.name.trim() || !userForm.email.trim() || (!isEdit && !userForm.password.trim()) || !userForm.role.trim()) {
      setUserFormError('Todos los campos son obligatorios.');
      return false;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(userForm.email)) {
      setUserFormError('El email no es válido.');
      return false;
    }
    if (!isEdit && userForm.password.length < 6) {
      setUserFormError('La contraseña debe tener al menos 6 caracteres.');
      return false;
    }
    setUserFormError('');
    return true;
  };

  const handleSubmitAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUserForm()) return;
    
    setIsSubmitting(true);
    try {
      await addUser({
        name: userForm.name,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role,
        isActive: true
      });
      
      setShowAddUser(false);
      resetUserForm();
    } catch (err) {
      setUserFormError('Error al agregar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUserForm(true) || !selectedUser) return;
    
    setIsSubmitting(true);
    try {
      await updateUser({
        ...selectedUser,
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        password: userForm.password || selectedUser.password
      });
      
      setShowEditUser(false);
      setSelectedUser(null);
      resetUserForm();
    } catch (err) {
      setUserFormError('Error al actualizar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Usuarios</h1>
          <p className="mt-1 text-sm text-gray-500">Gestiona los usuarios del sistema y sus permisos</p>
        </div>
        <button
          onClick={handleAddUser}
          className="btn-primary inline-flex items-center justify-center sm:justify-start px-2 sm:px-4 py-2 w-auto self-start"
        >
          <PlusIcon className="h-5 w-5 sm:mr-2" />
          <span className="hidden sm:inline">Agregar Usuario</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar usuarios por nombre, email o rol..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
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
              {filteredUsers.map((user) => (
                <tr key={user.id} className={user.id === currentUser?.id ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                          {user.id === currentUser?.id && (
                            <span className="ml-2 text-xs text-blue-600">(Tú)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    {canEdit && user.id !== currentUser?.id && (
                      <button
                        className="ml-2"
                        onClick={() => toggleUserStatus(user.id)}
                        title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        {user.isActive ? (
                          <XCircleIcon className="h-5 w-5 text-red-600 hover:text-red-900" />
                        ) : (
                          <CheckCircleIcon className="h-5 w-5 text-green-600 hover:text-green-900" />
                        )}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewUser(user)}
                        className="text-blue-600 hover:text-blue-900 flex items-center justify-center h-8 w-8 p-0 mx-auto"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-primary-600 hover:text-primary-900 flex items-center justify-center h-8 w-8 p-0 mx-auto"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 flex items-center justify-center h-8 w-8 p-0 mx-auto"
                        disabled={user.id === currentUser?.id}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ver Usuario */}
      {showViewUser && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detalle del Usuario</h3>
              <div className="space-y-2">
                <div><span className="font-semibold">Nombre:</span> {selectedUser.name}</div>
                <div><span className="font-semibold">Email:</span> {selectedUser.email}</div>
                <div><span className="font-semibold">Rol:</span> {getRoleText(selectedUser.role)}</div>
                <div><span className="font-semibold">Estado:</span> {selectedUser.isActive ? 'Activo' : 'Inactivo'}</div>
                <div><span className="font-semibold">Fecha de alta:</span> {selectedUser.createdAt.toLocaleDateString()}</div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={() => setShowViewUser(false)} className="btn-secondary">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Usuario */}
      {showAddUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Usuario</h3>
              <form className="space-y-4" onSubmit={handleSubmitAddUser}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                  <input type="text" className="input-field mt-1" value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" className="input-field mt-1" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                  <input type="password" className="input-field mt-1" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rol</label>
                  <select className="input-field mt-1" value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value as 'admin' | 'revendedor' }))} required>
                    <option value="revendedor">Revendedor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                {userFormError && <div className="text-red-600 text-sm">{userFormError}</div>}
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => { setShowAddUser(false); resetUserForm(); }} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {showEditUser && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Usuario</h3>
              <form className="space-y-4" onSubmit={handleSubmitEditUser}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                  <input type="text" className="input-field mt-1" value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" className="input-field mt-1" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nueva Contraseña (opcional)</label>
                  <input type="password" className="input-field mt-1" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder="Dejar vacío para mantener la actual" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rol</label>
                  <select className="input-field mt-1" value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value as 'admin' | 'revendedor' }))} required>
                    <option value="revendedor">Revendedor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                {userFormError && <div className="text-red-600 text-sm">{userFormError}</div>}
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => { setShowEditUser(false); setSelectedUser(null); resetUserForm(); }} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>Actualizar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios; 