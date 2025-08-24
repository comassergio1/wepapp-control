import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Product, Account, Payment, InventoryMovement, User } from '../types';
import { useAuth } from './AuthContext';

// Configuración de la API
const API_BASE_URL = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost'
  ? '/api' 
  : 'http://localhost:3001/api';

interface DataContextType {
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  updatePayment: (payment: Payment) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  movements: InventoryMovement[];
  addMovement: (movement: Omit<InventoryMovement, 'id' | 'date'>) => Promise<void>;
  updateMovement: (movement: InventoryMovement) => Promise<void>;
  deleteMovement: (id: string) => Promise<void>;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData debe usarse dentro de DataProvider');
  return ctx;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Función helper para hacer llamadas a la API
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log('🌐 API Call:', fullUrl);
    console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
    console.log('🌍 Hostname:', window.location.hostname);
    
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      // Si el backend devuelve un error con mensaje, lo lanzamos como objeto
      if (data && data.error) {
        throw data;
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return data;
  };

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return; // No cargar datos si no hay usuario autenticado
      
      setLoading(true);
      setError(null);
      
      try {
        // Cargar clientes - filtrar por revendedor si no es administrador
        const clientsEndpoint = user.role === 'admin' ? '/clients' : `/clients?revendedorId=${user.id}`;
        const clientsData = await apiCall(clientsEndpoint);
        setClients(clientsData.map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          revendedorId: c.revendedor_id.toString(),
          revendedorName: c.revendedor_name,
          createdAt: new Date(c.created_at),
          updatedAt: new Date(c.updated_at),
          isActive: c.is_active === 1
        })));

        // Cargar productos
        const productsData = await apiCall('/products');
        setProducts(productsData.map((p: any) => ({
          id: p.id.toString(),
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          category: p.category,
          location: p.location || 'Central',
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at)
        })));

        // Cargar cuentas - filtrar por revendedor si no es administrador
        const accountsEndpoint = user.role === 'admin' ? '/accounts' : `/accounts?revendedorId=${user.id}`;
        const accountsData = await apiCall(accountsEndpoint);
        setAccounts(accountsData.map((a: any) => ({
          id: a.id.toString(),
          clientId: a.client_id.toString(),
          clientName: a.client_name,
          productId: a.product_id.toString(),
          productName: a.product_name,
          totalAmount: a.total_amount,
          paidAmount: a.paid_amount,
          remainingAmount: a.remaining_amount,
          deliveryAmount: a.delivery_amount,
          installmentAmount: a.installment_amount,
          totalInstallments: a.total_installments,
          paidInstallments: a.paid_installments,
          startDate: new Date(a.start_date),
          dueDate: new Date(a.due_date),
          status: a.status,
          isActive: a.is_active === 1,
          revendedorId: a.revendedor_id.toString(),
          revendedorName: a.revendedor_name,
          createdAt: new Date(a.created_at)
        })));

        // Cargar pagos
        const paymentsData = await apiCall('/payments');
        setPayments(paymentsData.map((p: any) => ({
          id: p.id.toString(),
          accountId: p.account_id.toString(),
          amount: p.amount,
          installmentNumber: p.installment_number,
          paymentDate: new Date(p.payment_date),
          paymentMethod: p.payment_method,
          receiptImage: p.receipt_image || '',
          notes: p.notes || '',
          userId: p.user_id.toString(),
          userName: p.user_name,
          createdAt: new Date(p.created_at)
        })));

        // Cargar movimientos
        const movementsData = await apiCall('/inventory-movements');
        setMovements(movementsData.map((m: any) => ({
          id: m.id.toString(),
          productId: m.product_id.toString(),
          productName: m.product_name,
          type: m.type,
          quantity: m.quantity,
          previousStock: m.previous_stock,
          newStock: m.new_stock,
          userId: m.user_id.toString(),
          userName: m.user_name,
          date: new Date(m.date),
          notes: m.notes || '',
          fromLocation: m.from_location || '',
          toLocation: m.to_location || ''
        })));

        // Cargar usuarios - solo administradores pueden ver todos los usuarios
        if (user.role === 'admin') {
          const usersData = await apiCall('/users');
          setUsers(usersData.map((u: any) => ({
            id: u.id.toString(),
            name: u.name,
            email: u.email,
            role: u.role,
            password: '', // No enviamos la contraseña al frontend
            createdAt: new Date(u.created_at),
            isActive: u.is_active === 1
          })));
        } else {
          setUsers([]); // Revendedores no ven usuarios
        }

      } catch (err) {
        setError('Error al cargar los datos. Verifica que el servidor esté corriendo.');
        console.error('Error cargando datos:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user]); // Dependencia en user para recargar cuando cambie el usuario

  // Clientes
  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      // Si no es administrador, usar el ID del usuario logueado como revendedorId
      const clientToSend = user?.role === 'admin' ? clientData : {
        ...clientData,
        revendedorId: user?.id || ''
      };

      const newClient = await apiCall('/clients', {
        method: 'POST',
        body: JSON.stringify(clientToSend)
      });
      
      // Mapear la respuesta del backend al formato esperado por el frontend
      const mappedClient: Client = {
        id: newClient.id.toString(),
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
        revendedorId: newClient.revendedorId || clientToSend.revendedorId,
        revendedorName: clientData.revendedorName,
        createdAt: new Date(),
        isActive: clientData.isActive
      };
      
      setClients(prev => [mappedClient, ...prev]);
    } catch (err: any) {
      if (err && err.error) throw err;
      setError('Error al agregar cliente');
      throw err;
    }
  };

  const updateClient = async (client: Client) => {
    try {
      await apiCall(`/clients/${client.id}`, {
        method: 'PUT',
        body: JSON.stringify(client)
      });
      
      // Mapear la respuesta del backend al formato esperado por el frontend
      const mappedClient: Client = {
        ...client
      };
      
      setClients(prev => prev.map(c => c.id === client.id ? mappedClient : c));
    } catch (err) {
      setError('Error al actualizar cliente');
      throw err;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await apiCall(`/clients/${id}`, { method: 'DELETE' });
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError('Error al eliminar cliente');
      throw err;
    }
  };

  // Productos
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newProduct = await apiCall('/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
      
      // Mapear la respuesta del backend al formato esperado por el frontend
      const mappedProduct: Product = {
        id: newProduct.id.toString(),
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        stock: newProduct.stock,
        category: newProduct.category,
        location: newProduct.location || 'Central',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setProducts(prev => [mappedProduct, ...prev]);
    } catch (err) {
      setError('Error al agregar producto');
      throw err;
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      await apiCall(`/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify(product)
      });
      
      // Mapear la respuesta del backend al formato esperado por el frontend
      const mappedProduct: Product = {
        ...product,
        updatedAt: new Date()
      };
      
      setProducts(prev => prev.map(p => p.id === product.id ? mappedProduct : p));
    } catch (err) {
      setError('Error al actualizar producto');
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await apiCall(`/products/${id}`, { method: 'DELETE' });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError('Error al eliminar producto');
      throw err;
    }
  };

  // Cuentas
  const addAccount = async (accountData: Omit<Account, 'id' | 'createdAt'>) => {
    try {
      // Si no es administrador, usar el ID del usuario logueado como revendedorId
      const accountToSend = user?.role === 'admin' ? accountData : {
        ...accountData,
        revendedorId: user?.id || ''
      };

      const newAccount = await apiCall('/accounts', {
        method: 'POST',
        body: JSON.stringify(accountToSend)
      });
      
      // Mapear la respuesta del backend al formato esperado por el frontend
      const mappedAccount: Account = {
        id: newAccount.id.toString(),
        clientId: newAccount.client_id.toString(),
        clientName: newAccount.client_name,
        productId: newAccount.product_id.toString(),
        productName: newAccount.product_name,
        totalAmount: newAccount.total_amount,
        paidAmount: newAccount.paid_amount,
        remainingAmount: newAccount.remaining_amount,
        deliveryAmount: newAccount.delivery_amount,
        installmentAmount: newAccount.installment_amount,
        totalInstallments: newAccount.total_installments,
        paidInstallments: newAccount.paid_installments,
        startDate: new Date(newAccount.start_date),
        dueDate: new Date(newAccount.due_date),
        status: newAccount.status,
        isActive: newAccount.is_active === 1,
        revendedorId: newAccount.revendedor_id.toString(),
        revendedorName: newAccount.revendedor_name,
        createdAt: new Date(newAccount.created_at)
      };
      
      setAccounts(prev => [mappedAccount, ...prev]);
    } catch (err) {
      setError('Error al agregar cuenta');
      throw err;
    }
  };

  const updateAccount = async (account: Account) => {
    try {
      await apiCall(`/accounts/${account.id}`, {
        method: 'PUT',
        body: JSON.stringify(account)
      });
      
      // Mapear la respuesta del backend al formato esperado por el frontend
      const mappedAccount: Account = {
        ...account
      };
      
      setAccounts(prev => prev.map(a => a.id === account.id ? mappedAccount : a));
    } catch (err) {
      setError('Error al actualizar cuenta');
      throw err;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await apiCall(`/accounts/${id}`, { method: 'DELETE' });
      setAccounts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError('Error al eliminar cuenta');
      throw err;
    }
  };

  // Pagos
  const addPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
    try {
      // Usar el ID del usuario logueado como userId
      const paymentToSend = {
        ...paymentData,
        userId: user?.id || ''
      };

      const newPayment = await apiCall('/payments', {
        method: 'POST',
        body: JSON.stringify(paymentToSend)
      });
      
      // Mapear la respuesta del backend al formato esperado por el frontend
      const mappedPayment: Payment = {
        id: newPayment.id.toString(),
        accountId: newPayment.accountId.toString(),
        amount: newPayment.amount,
        installmentNumber: newPayment.installmentNumber,
        paymentDate: new Date(),
        paymentMethod: paymentData.paymentMethod,
        receiptImage: paymentData.receiptImage || '',
        notes: paymentData.notes || '',
        userId: paymentData.userId,
        userName: paymentData.userName,
        createdAt: new Date()
      };
      
      setPayments(prev => [mappedPayment, ...prev]);
      
      // Refrescar la cuenta asociada
      const updatedAccount = await apiCall(`/accounts/${mappedPayment.accountId}`);
      if (updatedAccount && updatedAccount.id) {
        const a = updatedAccount;
        const mappedAccount = {
          id: a.id.toString(),
          clientId: a.client_id.toString(),
          clientName: a.client_name,
          productId: a.product_id.toString(),
          productName: a.product_name,
          totalAmount: a.total_amount,
          paidAmount: a.paid_amount,
          remainingAmount: a.remaining_amount,
          deliveryAmount: a.delivery_amount,
          installmentAmount: a.installment_amount,
          totalInstallments: a.total_installments,
          paidInstallments: a.paid_installments,
          startDate: new Date(a.start_date),
          dueDate: new Date(a.due_date),
          status: a.status,
          isActive: a.is_active === 1,
          revendedorId: a.revendedor_id.toString(),
          revendedorName: a.revendedor_name,
          createdAt: new Date(a.created_at)
        };
        setAccounts(prev => prev.map(acc => acc.id === mappedAccount.id ? mappedAccount : acc));
      }
    } catch (err) {
      setError('Error al agregar pago');
      throw err;
    }
  };
  
  const updatePayment = async (payment: Payment) => {
    try {
      await apiCall(`/payments/${payment.id}`, {
        method: 'PUT',
        body: JSON.stringify(payment)
      });
      
      // Mapear la respuesta del backend al formato esperado por el frontend
      const mappedPayment: Payment = {
        ...payment
      };
      
      setPayments(prev => prev.map(p => p.id === payment.id ? mappedPayment : p));
      // Refrescar la cuenta asociada
      const updatedAccount = await apiCall(`/accounts/${mappedPayment.accountId}`);
      if (updatedAccount && updatedAccount.id) {
        const a = updatedAccount;
        const mappedAccount = {
          id: a.id.toString(),
          clientId: a.client_id.toString(),
          clientName: a.client_name,
          productId: a.product_id.toString(),
          productName: a.product_name,
          totalAmount: a.total_amount,
          paidAmount: a.paid_amount,
          remainingAmount: a.remaining_amount,
          deliveryAmount: a.delivery_amount,
          installmentAmount: a.installment_amount,
          totalInstallments: a.total_installments,
          paidInstallments: a.paid_installments,
          startDate: new Date(a.start_date),
          dueDate: new Date(a.due_date),
          status: a.status,
          isActive: a.is_active === 1,
          revendedorId: a.revendedor_id.toString(),
          revendedorName: a.revendedor_name,
          createdAt: new Date(a.created_at)
        };
        setAccounts(prev => prev.map(acc => acc.id === mappedAccount.id ? mappedAccount : acc));
      }
    } catch (err) {
      setError('Error al actualizar pago');
      throw err;
    }
  };

  const deletePayment = async (id: string) => {
    try {
      // Obtener el pago antes de eliminarlo para saber la cuenta
      const paymentToDelete = payments.find(p => p.id === id);
      await apiCall(`/payments/${id}`, { method: 'DELETE' });
      setPayments(prev => prev.filter(p => p.id !== id));
      // Refrescar la cuenta asociada
      if (paymentToDelete) {
        const updatedAccount = await apiCall(`/accounts/${paymentToDelete.accountId}`);
        if (updatedAccount && updatedAccount.id) {
          const a = updatedAccount;
          const mappedAccount = {
            id: a.id.toString(),
            clientId: a.client_id.toString(),
            clientName: a.client_name,
            productId: a.product_id.toString(),
            productName: a.product_name,
            totalAmount: a.total_amount,
            paidAmount: a.paid_amount,
            remainingAmount: a.remaining_amount,
            deliveryAmount: a.delivery_amount,
            installmentAmount: a.installment_amount,
            totalInstallments: a.total_installments,
            paidInstallments: a.paid_installments,
            startDate: new Date(a.start_date),
            dueDate: new Date(a.due_date),
            status: a.status,
            isActive: a.is_active === 1,
            revendedorId: a.revendedor_id.toString(),
            revendedorName: a.revendedor_name,
            createdAt: new Date(a.created_at)
          };
          setAccounts(prev => prev.map(acc => acc.id === mappedAccount.id ? mappedAccount : acc));
        }
      }
    } catch (err) {
      setError('Error al eliminar pago');
      throw err;
    }
  };

  // Movimientos
  const addMovement = async (movementData: Omit<InventoryMovement, 'id' | 'date'>) => {
    try {
      // Usar el ID del usuario logueado como userId
      const movementToSend = {
        ...movementData,
        userId: user?.id || ''
      };

      const newMovement = await apiCall('/inventory-movements', {
        method: 'POST',
        body: JSON.stringify(movementToSend)
      });
      
      // Mapear la respuesta del backend al formato esperado por el frontend
      const mappedMovement: InventoryMovement = {
        id: newMovement.id.toString(),
        productId: newMovement.product_id.toString(),
        productName: newMovement.product_name,
        type: newMovement.type,
        quantity: newMovement.quantity,
        previousStock: newMovement.previous_stock,
        newStock: newMovement.new_stock,
        userId: newMovement.user_id.toString(),
        userName: newMovement.user_name,
        date: new Date(newMovement.date),
        notes: newMovement.notes || '',
        fromLocation: newMovement.from_location || '',
        toLocation: newMovement.to_location || ''
      };
      
      setMovements(prev => [mappedMovement, ...prev]);
    } catch (err) {
      setError('Error al agregar movimiento');
      throw err;
    }
  };

  const updateMovement = async (movement: InventoryMovement) => {
    try {
      const updatedMovement = await apiCall(`/inventory-movements/${movement.id}`, {
        method: 'PUT',
        body: JSON.stringify(movement)
      });
      
      // Mapear la respuesta del backend al formato esperado por el frontend
      const mappedMovement: InventoryMovement = {
        id: updatedMovement.id.toString(),
        productId: updatedMovement.product_id.toString(),
        productName: updatedMovement.product_name,
        type: updatedMovement.type,
        quantity: updatedMovement.quantity,
        previousStock: updatedMovement.previous_stock,
        newStock: updatedMovement.new_stock,
        userId: updatedMovement.user_id.toString(),
        userName: updatedMovement.user_name,
        date: new Date(updatedMovement.date),
        notes: updatedMovement.notes || '',
        fromLocation: updatedMovement.from_location || '',
        toLocation: updatedMovement.to_location || ''
      };
      
      setMovements(prev => prev.map(m => m.id === movement.id ? mappedMovement : m));
    } catch (err) {
      setError('Error al actualizar movimiento');
      throw err;
    }
  };

  const deleteMovement = async (id: string) => {
    try {
      await apiCall(`/inventory-movements/${id}`, { method: 'DELETE' });
      setMovements(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      setError('Error al eliminar movimiento');
      throw err;
    }
  };

  // Usuarios
  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    try {
      const newUser = await apiCall('/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      // Mapear la respuesta del backend al formato esperado por el frontend
      const mappedUser: User = {
        id: newUser.id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        password: '', // No enviamos la contraseña al frontend
        createdAt: new Date(),
        isActive: true
      };
      
      setUsers(prev => [mappedUser, ...prev]);
    } catch (err) {
      setError('Error al agregar usuario');
      throw err;
    }
  };

  const updateUser = async (user: User) => {
    try {
      await apiCall(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(user)
      });
      
      // Mapear la respuesta del backend al formato esperado por el frontend
      const mappedUser: User = {
        ...user
      };
      
      setUsers(prev => prev.map(u => u.id === user.id ? mappedUser : u));
    } catch (err) {
      setError('Error al actualizar usuario');
      throw err;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await apiCall(`/users/${id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      setError('Error al eliminar usuario');
      throw err;
    }
  };

  return (
    <DataContext.Provider value={{
      clients, addClient, updateClient, deleteClient,
      products, addProduct, updateProduct, deleteProduct,
      accounts, addAccount, updateAccount, deleteAccount,
      payments, addPayment, updatePayment, deletePayment,
      movements, addMovement, updateMovement, deleteMovement,
      users, addUser, updateUser, deleteUser,
      loading, error
    }}>
      {children}
    </DataContext.Provider>
  );
}; 