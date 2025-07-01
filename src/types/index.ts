export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'revendedor';
  password: string;
  createdAt: Date;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'ingreso' | 'egreso' | 'traslado' | 'desvio';
  quantity: number;
  previousStock: number;
  newStock: number;
  userId: string;
  userName: string;
  date: Date;
  notes?: string;
  fromLocation?: string;
  toLocation?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  revendedorId: string;
  revendedorName: string;
  createdAt: Date;
  isActive: boolean;
}

export interface Account {
  id: string;
  clientId: string;
  clientName: string;
  productId: string;
  productName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  deliveryAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  startDate: Date;
  dueDate: Date;
  status: 'active' | 'completed' | 'overdue';
  isActive: boolean;
  revendedorId: string;
  revendedorName: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  accountId: string;
  amount: number;
  installmentNumber: number;
  paymentDate: Date;
  paymentMethod: string;
  receiptImage?: string;
  notes?: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
} 