import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Account, Payment, Product, InventoryMovement } from '../types';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  CreditCardIcon,
  UserIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLocation } from 'react-router-dom';

const Cuentas: React.FC = () => {
  const { user } = useAuth();
  const { clients, products, accounts, payments, deleteAccount, addAccount, updateAccount, addPayment, updatePayment, deletePayment, updateProduct, addMovement, loading, error } = useData();
  const { formatCurrency } = useCurrency();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'accounts' | 'payments'>('accounts');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showViewAccount, setShowViewAccount] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [showViewPayment, setShowViewPayment] = useState(false);
  const [showEditPayment, setShowEditPayment] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [accountForm, setAccountForm] = useState({
    clientId: '',
    productId: '',
    totalAmount: '',
    deliveryAmount: '',
    installmentAmount: '',
    totalInstallments: ''
  });
  const [accountFormError, setAccountFormError] = useState('');
  const [paymentForm, setPaymentForm] = useState({
    accountId: '',
    amount: '',
    installmentNumber: '',
    paymentMethod: '',
    notes: '',
  });
  const [paymentFormError, setPaymentFormError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptType, setReceiptType] = useState<'image' | 'pdf' | null>(null);

  // Verificar si viene desde la calculadora
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('addAccount') === 'true') {
      const pendingData = localStorage.getItem('pendingAccountData');
      if (pendingData) {
        try {
          const data = JSON.parse(pendingData);
          setAccountForm({
            clientId: '',
            productId: data.productId,
            totalAmount: data.totalAmount.toString(),
            deliveryAmount: data.deliveryAmount.toString(),
            installmentAmount: data.installmentAmount.toString(),
            totalInstallments: data.totalInstallments.toString()
          });
          setShowAddAccount(true);
          // Limpiar los datos del localStorage
          localStorage.removeItem('pendingAccountData');
        } catch (error) {
          console.error('Error al parsear datos de la calculadora:', error);
        }
      }
    }
  }, [location.search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando cuentas...</p>
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

  // Filtrado de cuentas y pagos según el usuario logueado
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = (account.clientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (account.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    // Obtener el cliente asociado a esta cuenta
    const client = clients.find(c => c.id === account.clientId);
    
    // Solo mostrar cuentas de clientes activos
    if (!client || !client.isActive) return false;
    
    if (user?.role === 'admin') return matchesSearch;
    return account.revendedorId === user?.id && matchesSearch;
  });
  
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = (payment.paymentMethod?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const account = accounts.find(a => a.id === payment.accountId);
    
    if (user?.role === 'admin') return matchesSearch;
    // Para revendedores: mostrar pagos de sus cuentas, sin importar quién los registró
    return account && account.revendedorId === user?.id && matchesSearch;
  });

  // Filtrar clientes y productos según el usuario
  const availableClients = user?.role === 'admin'
    ? clients.filter(c => c.isActive) // Solo clientes activos
    : clients.filter(c => c.revendedorId === user?.id && c.isActive); // Solo clientes activos del revendedor
  const availableProducts = products.filter(p => p.stock > 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'completed':
        return 'Completada';
      case 'overdue':
        return 'Vencida';
      default:
        return 'Desconocida';
    }
  };

  const resetAccountForm = () => {
    setAccountForm({ clientId: '', productId: '', totalAmount: '', installmentAmount: '', totalInstallments: '', deliveryAmount: '0' });
    setAccountFormError('');
  };
  
  const resetPaymentForm = () => {
    setPaymentForm({ accountId: '', amount: '', installmentNumber: '', paymentMethod: '', notes: '' });
    setPaymentFormError('');
  };

  const handleViewAccount = (account: Account) => {
    setSelectedAccount(account);
    setShowViewAccount(true);
  };
  
  const handleEditAccount = (account: Account) => {
    if (user?.role !== 'admin') {
      alert('Solo los administradores pueden editar cuentas.');
      return;
    }
    setSelectedAccount(account);
    setAccountForm({
      clientId: account.clientId,
      productId: account.productId,
      totalAmount: account.totalAmount.toString(),
      installmentAmount: account.installmentAmount.toString(),
      totalInstallments: account.totalInstallments.toString(),
      deliveryAmount: account.deliveryAmount.toString(),
    });
    setShowEditAccount(true);
  };
  
  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowViewPayment(true);
  };
  
  const handleEditPayment = (payment: Payment) => {
    if (user?.role !== 'admin') {
      alert('Solo los administradores pueden editar pagos.');
      return;
    }
    setSelectedPayment(payment);
    setPaymentForm({
      accountId: payment.accountId,
      amount: payment.amount.toString(),
      installmentNumber: payment.installmentNumber.toString(),
      paymentMethod: payment.paymentMethod,
      notes: payment.notes || '',
    });
    setShowEditPayment(true);
  };

  const handleDeletePayment = async (payment: Payment) => {
    if (user?.role !== 'admin') {
      alert('Solo los administradores pueden eliminar pagos.');
      return;
    }
    
    if (window.confirm(`¿Estás seguro de que quieres eliminar el pago de ${formatCurrency(payment.amount)} de la cuota #${payment.installmentNumber}?`)) {
      try {
        await deletePayment(payment.id);
        alert('Pago eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar pago:', error);
        alert('Error al eliminar pago');
      }
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    if (user?.role !== 'admin') {
      alert('Solo los administradores pueden eliminar cuentas.');
      return;
    }
    if (window.confirm(`¿Estás seguro de que quieres eliminar la cuenta de ${account.clientName} para el producto ${account.productName}?`)) {
      try {
        await deleteAccount(account.id);
        alert('Cuenta eliminada correctamente');
      } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        alert('Error al eliminar cuenta');
      }
    }
  };

  const validateAccountForm = () => {
    if (!accountForm.clientId || !accountForm.productId || !accountForm.totalAmount.trim() || !accountForm.installmentAmount.trim() || !accountForm.totalInstallments.trim()) {
      setAccountFormError('Todos los campos son obligatorios.');
      return false;
    }
    if (isNaN(Number(accountForm.totalAmount)) || isNaN(Number(accountForm.installmentAmount)) || isNaN(Number(accountForm.totalInstallments))) {
      setAccountFormError('Los montos deben ser números válidos.');
      return false;
    }
    
    const deliveryAmount = Number(accountForm.deliveryAmount) || 0;
    const totalAmount = Number(accountForm.totalAmount);
    
    if (deliveryAmount > totalAmount) {
      setAccountFormError('El monto de entrega no puede ser mayor al monto total.');
      return false;
    }
    
    setAccountFormError('');
    return true;
  };

  const validatePaymentForm = () => {
    if (!paymentForm.accountId || !paymentForm.amount.trim() || !paymentForm.installmentNumber.trim() || !paymentForm.paymentMethod.trim()) {
      setPaymentFormError('Todos los campos son obligatorios.');
      return false;
    }
    if (isNaN(Number(paymentForm.amount)) || isNaN(Number(paymentForm.installmentNumber))) {
      setPaymentFormError('Monto y número de cuota deben ser números válidos.');
      return false;
    }
    setPaymentFormError('');
    return true;
  };

  const handleSubmitAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAccountForm()) return;

    const selectedClient = clients.find(c => c.id === accountForm.clientId);
    const selectedProduct = products.find(p => p.id === accountForm.productId);

    if (!selectedClient || !selectedProduct) {
      setAccountFormError('Cliente o producto no encontrado.');
      return;
    }

    // Verificar que el producto tenga stock disponible
    if (selectedProduct.stock <= 0) {
      setAccountFormError('El producto seleccionado no tiene stock disponible.');
      return;
    }

    const deliveryAmount = Number(accountForm.deliveryAmount) || 0;
    const totalAmount = Number(accountForm.totalAmount);
    const paidAmount = deliveryAmount;
    const remainingAmount = totalAmount - paidAmount;

    const newAccount: Omit<Account, 'id' | 'createdAt'> = {
      clientId: accountForm.clientId,
      clientName: selectedClient.name,
      productId: accountForm.productId,
      productName: selectedProduct.name,
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      remainingAmount: remainingAmount,
      deliveryAmount: deliveryAmount,
      installmentAmount: Number(accountForm.installmentAmount),
      totalInstallments: Number(accountForm.totalInstallments),
      paidInstallments: deliveryAmount > 0 ? 1 : 0,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
      status: 'active',
      isActive: true,
      revendedorId: user?.id || '2',
      revendedorName: user?.name || 'Revendedor'
    };
    
    try {
      await addAccount(newAccount);
      setShowAddAccount(false);
      resetAccountForm();
    } catch (error) {
      console.error('Error al agregar cuenta:', error);
      setAccountFormError('Error al agregar cuenta. Inténtalo de nuevo.');
    }
  };

  const handleSubmitEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'admin') {
      alert('Solo los administradores pueden editar cuentas.');
      return;
    }
    if (!validateAccountForm() || !selectedAccount) return;
    
    const selectedClient = clients.find(c => c.id === accountForm.clientId);
    const selectedProduct = products.find(p => p.id === accountForm.productId);

    if (!selectedClient || !selectedProduct) {
      setAccountFormError('Cliente o producto no encontrado.');
      return;
    }

    // Verificar que el producto tenga stock disponible (solo si se cambió el producto)
    if (selectedAccount.productId !== selectedProduct.id && selectedProduct.stock <= 0) {
      setAccountFormError('El producto seleccionado no tiene stock disponible.');
      return;
    }

    const deliveryAmount = Number(accountForm.deliveryAmount) || 0;
    const totalAmount = Number(accountForm.totalAmount);
    const paidAmount = deliveryAmount;
    const remainingAmount = totalAmount - paidAmount;

    const updatedAccount: Account = {
      ...selectedAccount,
      clientId: accountForm.clientId,
      clientName: selectedClient.name,
      productId: accountForm.productId,
      productName: selectedProduct.name,
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      remainingAmount: remainingAmount,
      deliveryAmount: deliveryAmount,
      installmentAmount: Number(accountForm.installmentAmount),
      totalInstallments: Number(accountForm.totalInstallments),
      paidInstallments: deliveryAmount > 0 ? 1 : 0,
    };
    
    try {
      await updateAccount(updatedAccount);
      setShowEditAccount(false);
      setSelectedAccount(null);
      resetAccountForm();
    } catch (error) {
      console.error('Error al actualizar cuenta:', error);
      setAccountFormError('Error al actualizar cuenta. Inténtalo de nuevo.');
    }
  };

  const handleSubmitAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePaymentForm()) return;

    const selectedAccount = accounts.find(a => a.id === paymentForm.accountId);
    if (!selectedAccount) {
      setPaymentFormError('Cuenta no encontrada.');
      return;
    }

    const newPayment: Omit<Payment, 'id' | 'createdAt'> = {
      accountId: paymentForm.accountId,
      amount: Number(paymentForm.amount),
      installmentNumber: Number(paymentForm.installmentNumber),
      paymentDate: new Date(),
      paymentMethod: paymentForm.paymentMethod,
      receiptImage: '',
      notes: paymentForm.notes,
      userId: user?.id || '2',
      userName: user?.name || 'Revendedor'
    };
    
    try {
      await addPayment(newPayment);
      setShowAddPayment(false);
      resetPaymentForm();
    } catch (error) {
      console.error('Error al agregar pago:', error);
      setPaymentFormError('Error al agregar pago. Inténtalo de nuevo.');
    }
  };

  const handleSubmitEditPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'admin') {
      alert('Solo los administradores pueden editar pagos.');
      return;
    }
    if (!validatePaymentForm() || !selectedPayment) return;
    
    const updatedPayment: Payment = {
      ...selectedPayment,
      accountId: paymentForm.accountId,
      amount: Number(paymentForm.amount),
      installmentNumber: Number(paymentForm.installmentNumber),
      paymentMethod: paymentForm.paymentMethod,
      notes: paymentForm.notes,
    };
    
    try {
      await updatePayment(updatedPayment);
      setShowEditPayment(false);
      setSelectedPayment(null);
      resetPaymentForm();
    } catch (error) {
      console.error('Error al actualizar pago:', error);
      setPaymentFormError('Error al actualizar pago. Inténtalo de nuevo.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Cuentas
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las cuentas de clientes y registra pagos
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:space-x-3">
          <button
            onClick={() => setShowAddAccount(true)}
            className="btn-primary flex items-center justify-center sm:justify-start px-2 sm:px-4 py-2"
          >
            <PlusIcon className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Nueva Cuenta</span>
          </button>
          <button
            onClick={() => setShowAddPayment(true)}
            className="btn-secondary flex items-center justify-center sm:justify-start px-2 sm:px-4 py-2"
          >
            <CreditCardIcon className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Registrar Pago</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'accounts'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cuentas de Clientes
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payments'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Historial de Pagos
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={activeTab === 'accounts' ? "Buscar cuentas..." : "Buscar pagos..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Content */}
      {activeTab === 'accounts' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cuotas
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
                {filteredAccounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {account.clientName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Revendedor: {account.revendedorName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(account.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {formatCurrency(account.paidAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(account.remainingAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.paidInstallments}/{account.totalInstallments}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(account.status)}`}>
                        {getStatusText(account.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => handleViewAccount(account)} className="text-blue-600 hover:text-blue-900"><EyeIcon className="h-4 w-4" /></button>
                        {user?.role === 'admin' && (
                          <>
                            <button onClick={() => handleEditAccount(account)} className="text-primary-600 hover:text-primary-900"><PencilIcon className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteAccount(account)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-4 w-4" /></button>
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
      )}

      {activeTab === 'payments' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cuota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comprobante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => {
                  const account = accounts.find(a => a.id === payment.accountId);
                  return (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.paymentDate.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {account?.clientName || 'Cliente no encontrado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{payment.installmentNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.userName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {payment.receiptImage ? (
                          <button
                            title="Ver comprobante"
                            onClick={() => {
                              setReceiptUrl(payment.receiptImage || '');
                              if ((payment.receiptImage || '').endsWith('.pdf')) setReceiptType('pdf');
                              else setReceiptType('image');
                              setShowReceiptModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <DocumentIcon className="h-5 w-5 mx-auto" />
                          </button>
                        ) : (
                          <span className="text-gray-400" title="Sin comprobante">
                            <DocumentIcon className="h-5 w-5 mx-auto opacity-30" />
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button onClick={() => handleViewPayment(payment)} className="text-blue-600 hover:text-blue-900"><EyeIcon className="h-4 w-4" /></button>
                          {user?.role === 'admin' && (
                            <>
                              <button onClick={() => handleEditPayment(payment)} className="text-primary-600 hover:text-primary-900"><PencilIcon className="h-4 w-4" /></button>
                              <button onClick={() => handleDeletePayment(payment)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-4 w-4" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddAccount && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nueva Cuenta</h3>
              <form className="space-y-4" onSubmit={handleSubmitAddAccount}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cliente</label>
                  <select className="input-field mt-1" value={accountForm.clientId} onChange={e => setAccountForm(f => ({ ...f, clientId: e.target.value }))}>
                    <option value="">Seleccionar cliente</option>
                    {availableClients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Producto</label>
                  <select className="input-field mt-1" value={accountForm.productId} onChange={e => setAccountForm(f => ({ ...f, productId: e.target.value }))}>
                    <option value="">Seleccionar producto</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monto Total</label>
                  <input type="number" className="input-field mt-1" value={accountForm.totalAmount} onChange={e => setAccountForm(f => ({ ...f, totalAmount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monto de Cuota</label>
                  <input type="number" className="input-field mt-1" value={accountForm.installmentAmount} onChange={e => setAccountForm(f => ({ ...f, installmentAmount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cantidad de Cuotas</label>
                  <input type="number" className="input-field mt-1" value={accountForm.totalInstallments} onChange={e => setAccountForm(f => ({ ...f, totalInstallments: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monto de Entrega</label>
                  <input type="number" className="input-field mt-1" value={accountForm.deliveryAmount} onChange={e => setAccountForm(f => ({ ...f, deliveryAmount: e.target.value }))} />
                </div>
                {accountFormError && <div className="text-red-600 text-sm">{accountFormError}</div>}
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => { setShowAddAccount(false); resetAccountForm(); }} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAddPayment && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Registrar Pago</h3>
              <form className="space-y-4" onSubmit={handleSubmitAddPayment} encType="multipart/form-data">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cuenta</label>
                  <select className="input-field mt-1" value={paymentForm.accountId} onChange={e => setPaymentForm(f => ({ ...f, accountId: e.target.value }))}>
                    <option value="">Seleccionar cuenta</option>
                    {filteredAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.clientName} - {a.productName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monto</label>
                  <input type="number" className="input-field mt-1" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">N° de Cuota</label>
                  <input type="number" className="input-field mt-1" value={paymentForm.installmentNumber} onChange={e => setPaymentForm(f => ({ ...f, installmentNumber: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
                  <input type="text" className="input-field mt-1" value={paymentForm.paymentMethod} onChange={e => setPaymentForm(f => ({ ...f, paymentMethod: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notas</label>
                  <textarea className="input-field mt-1" rows={2} value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                {/* Mejora visual para subir comprobante */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comprobante (opcional)</label>
                  <div
                    className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition"
                    onClick={() => document.getElementById('input-comprobante')?.click()}
                    tabIndex={0}
                    onKeyPress={e => { if (e.key === 'Enter') document.getElementById('input-comprobante')?.click(); }}
                    role="button"
                    aria-label="Subir comprobante"
                  >
                    <DocumentIcon className="h-8 w-8 text-blue-400 mb-2" />
                    <span className="text-blue-700 font-medium">Haz clic o presiona Enter para seleccionar un archivo</span>
                    <span className="text-xs text-gray-500 mt-1">Formatos permitidos: imagen o PDF. Tamaño máximo: 5MB.</span>
                    <input
                      id="input-comprobante"
                      type="file"
                      name="receipt"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {file && (
                      <div className="mt-3 flex items-center space-x-2 bg-blue-50 rounded px-2 py-1">
                        <DocumentIcon className="h-5 w-5 text-blue-400" />
                        <span className="text-xs text-blue-800 truncate max-w-[120px]">{file.name}</span>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 text-xs ml-2"
                          onClick={e => { e.stopPropagation(); setFile(null); }}
                          aria-label="Quitar archivo"
                        >
                          Quitar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {paymentFormError && <div className="text-red-600 text-sm">{paymentFormError}</div>}
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => { setShowAddPayment(false); resetPaymentForm(); }} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">Registrar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modals de vista y edición (placeholder) */}
      {showViewAccount && selectedAccount && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detalles de Cuenta</h3>
              
              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 border-b pb-2">Información General</h4>
                  <div><strong>Cliente:</strong> {selectedAccount.clientName}</div>
                  <div><strong>Producto:</strong> {selectedAccount.productName}</div>
                  <div><strong>Revendedor:</strong> {selectedAccount.revendedorName}</div>
                  <div><strong>Fecha de Inicio:</strong> {selectedAccount.startDate.toLocaleDateString()}</div>
                  <div><strong>Fecha de Vencimiento:</strong> {selectedAccount.dueDate.toLocaleDateString()}</div>
                  <div><strong>Estado:</strong> 
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAccount.status)}`}>
                      {getStatusText(selectedAccount.status)}
                    </span>
                  </div>
                  <div><strong>Estado de Cuenta:</strong> 
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedAccount.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedAccount.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 border-b pb-2">Información Financiera</h4>
                  <div><strong>Monto Total:</strong> {formatCurrency(selectedAccount.totalAmount)}</div>
                  <div><strong>Monto de Entrega:</strong> {formatCurrency(selectedAccount.deliveryAmount)}</div>
                  <div><strong>Monto Pagado:</strong> {formatCurrency(selectedAccount.paidAmount)}</div>
                  <div><strong>Monto Restante:</strong> {formatCurrency(selectedAccount.remainingAmount)}</div>
                  <div><strong>Monto por Cuota:</strong> {formatCurrency(selectedAccount.installmentAmount)}</div>
                  <div><strong>Cuotas Pagadas:</strong> {selectedAccount.paidInstallments}/{selectedAccount.totalInstallments}</div>
                  <div><strong>Progreso:</strong> 
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${(selectedAccount.paidAmount / selectedAccount.totalAmount) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {Math.round((selectedAccount.paidAmount / selectedAccount.totalAmount) * 100)}% completado
                    </span>
                  </div>
                </div>
              </div>

              {/* Historial de Pagos */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 border-b pb-2 mb-4">Historial de Cuotas Pagadas</h4>
                {(() => {
                  const accountPayments = payments.filter(p => p.accountId === selectedAccount.id);
                  if (accountPayments.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <CreditCardIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No se han registrado pagos para esta cuenta</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cuota #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Monto
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Método
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Usuario
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Comprobante
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {accountPayments
                            .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                            .map((payment) => (
                            <tr key={payment.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {payment.paymentDate.toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  #{payment.installmentNumber}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">
                                {formatCurrency(payment.amount)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {payment.paymentMethod}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {payment.userName}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {payment.receiptImage ? (
                                  <button
                                    title="Ver comprobante"
                                    onClick={() => {
                                      setReceiptUrl(payment.receiptImage || '');
                                      if ((payment.receiptImage || '').endsWith('.pdf')) setReceiptType('pdf');
                                      else setReceiptType('image');
                                      setShowReceiptModal(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <DocumentIcon className="h-5 w-5 mx-auto" />
                                  </button>
                                ) : (
                                  <span className="text-gray-400" title="Sin comprobante">
                                    <DocumentIcon className="h-5 w-5 mx-auto opacity-30" />
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Resumen de Pagos */}
              {(() => {
                const accountPayments = payments.filter(p => p.accountId === selectedAccount.id);
                if (accountPayments.length > 0) {
                  const totalPaid = accountPayments.reduce((sum, p) => sum + p.amount, 0);
                  const averagePayment = totalPaid / accountPayments.length;
                  
                  return (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{accountPayments.length}</div>
                        <div className="text-sm text-gray-600">Pagos Realizados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
                        <div className="text-sm text-gray-600">Total Pagado</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{formatCurrency(averagePayment)}</div>
                        <div className="text-sm text-gray-600">Promedio por Pago</div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex justify-end mt-6">
                <button onClick={() => setShowViewAccount(false)} className="btn-secondary">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditAccount && selectedAccount && user?.role === 'admin' && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Cuenta</h3>
              <form className="space-y-4" onSubmit={handleSubmitEditAccount}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cliente</label>
                  <select className="input-field mt-1" value={accountForm.clientId} onChange={e => setAccountForm(f => ({ ...f, clientId: e.target.value }))}>
                    <option value="">Seleccionar cliente</option>
                    {availableClients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Producto</label>
                  <select className="input-field mt-1" value={accountForm.productId} onChange={e => setAccountForm(f => ({ ...f, productId: e.target.value }))}>
                    <option value="">Seleccionar producto</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monto Total</label>
                  <input type="number" className="input-field mt-1" value={accountForm.totalAmount} onChange={e => setAccountForm(f => ({ ...f, totalAmount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monto de Cuota</label>
                  <input type="number" className="input-field mt-1" value={accountForm.installmentAmount} onChange={e => setAccountForm(f => ({ ...f, installmentAmount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cantidad de Cuotas</label>
                  <input type="number" className="input-field mt-1" value={accountForm.totalInstallments} onChange={e => setAccountForm(f => ({ ...f, totalInstallments: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monto de Entrega</label>
                  <input type="number" className="input-field mt-1" value={accountForm.deliveryAmount} onChange={e => setAccountForm(f => ({ ...f, deliveryAmount: e.target.value }))} />
                </div>
                {accountFormError && <div className="text-red-600 text-sm">{accountFormError}</div>}
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => { setShowEditAccount(false); setSelectedAccount(null); resetAccountForm(); }} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showViewPayment && selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detalles de Pago</h3>
              <div className="space-y-3">
                <div><strong>Monto:</strong> {formatCurrency(selectedPayment.amount)}</div>
                <div><strong>Cuota:</strong> #{selectedPayment.installmentNumber}</div>
                <div><strong>Método:</strong> {selectedPayment.paymentMethod}</div>
                <div><strong>Fecha:</strong> {selectedPayment.paymentDate.toLocaleDateString()}</div>
                <div><strong>Usuario:</strong> {selectedPayment.userName}</div>
                {selectedPayment.notes && <div><strong>Notas:</strong> {selectedPayment.notes}</div>}
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={() => setShowViewPayment(false)} className="btn-secondary">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditPayment && selectedPayment && user?.role === 'admin' && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Pago</h3>
              <form className="space-y-4" onSubmit={handleSubmitEditPayment}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cuenta</label>
                  <select className="input-field mt-1" value={paymentForm.accountId} onChange={e => setPaymentForm(f => ({ ...f, accountId: e.target.value }))}>
                    <option value="">Seleccionar cuenta</option>
                    {filteredAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.clientName} - {a.productName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monto</label>
                  <input type="number" className="input-field mt-1" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">N° de Cuota</label>
                  <input type="number" className="input-field mt-1" value={paymentForm.installmentNumber} onChange={e => setPaymentForm(f => ({ ...f, installmentNumber: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
                  <input type="text" className="input-field mt-1" value={paymentForm.paymentMethod} onChange={e => setPaymentForm(f => ({ ...f, paymentMethod: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notas</label>
                  <textarea className="input-field mt-1" rows={2} value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                {paymentFormError && <div className="text-red-600 text-sm">{paymentFormError}</div>}
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => { setShowEditPayment(false); setSelectedPayment(null); resetPaymentForm(); }} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showReceiptModal && receiptUrl && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Comprobante de Pago</h3>
              <div className="flex justify-center items-center min-h-[300px]">
                {receiptType === 'image' ? (
                  <img src={receiptUrl} alt="Comprobante" className="max-h-96 max-w-full rounded shadow" />
                ) : (
                  <iframe src={receiptUrl} title="Comprobante PDF" className="w-full h-96 rounded shadow" />
                )}
              </div>
              <div className="flex justify-end mt-6">
                <a href={receiptUrl} download target="_blank" rel="noopener noreferrer" className="btn-primary mr-2">Descargar</a>
                <button onClick={() => setShowReceiptModal(false)} className="btn-secondary">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cuentas;