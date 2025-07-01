import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useCurrency } from '../contexts/CurrencyContext';
import {
  CubeIcon,
  UserGroupIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { clients, products, accounts, payments, movements } = useData();
  const { currency, setCurrency, formatCurrency, dolarBlue, loadingDolar } = useCurrency();
  const navigate = useNavigate();

  // Filtrar datos según el rol del usuario
  const userClients = user?.role === 'admin' 
    ? clients 
    : clients.filter(c => c.revendedorId === user?.id);
  
  const userAccounts = user?.role === 'admin' 
    ? accounts 
    : accounts.filter(a => a.revendedorId === user?.id);
  
  const userPayments = user?.role === 'admin' 
    ? payments 
    : payments.filter(p => {
      const account = accounts.find(a => a.id === p.accountId);
      return account && account.revendedorId === user?.id;
    });

  // Calcular estadísticas reales
  const activeClients = userClients.filter(c => c.isActive).length;
  const inactiveClients = userClients.filter(c => !c.isActive).length;
  const activeAccounts = userAccounts.filter(a => a.isActive).length;
  const completedAccounts = userAccounts.filter(a => a.status === 'completed').length;
  const totalProducts = products.length;
  const productsWithStock = products.filter(p => p.stock > 0).length;
  
  // Calcular ingresos del mes actual
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyPayments = userPayments.filter(p => {
    const paymentDate = new Date(p.paymentDate);
    return paymentDate.getMonth() === currentMonth && 
           paymentDate.getFullYear() === currentYear;
  });

  // Sumar montos de entrega de cuentas creadas este mes
  const monthlyDeliveries = userAccounts.filter(a => {
    const createdAt = new Date(a.createdAt);
    return createdAt.getMonth() === currentMonth &&
           createdAt.getFullYear() === currentYear;
  }).reduce((sum, a) => sum + (a.deliveryAmount || 0), 0);

  const monthlyIncome = monthlyPayments.reduce((sum, p) => sum + p.amount, 0) + monthlyDeliveries;

  const stats = [
    {
      name: user?.role === 'admin' ? 'Productos en Stock' : 'Productos Disponibles',
      value: user?.role === 'admin' ? productsWithStock.toString() : productsWithStock.toString(),
      change: user?.role === 'admin' ? `${totalProducts} total` : 'disponibles',
      changeType: 'positive',
      icon: CubeIcon,
      color: 'bg-blue-500'
    },
    {
      name: user?.role === 'admin' ? 'Clientes Activos' : 'Mis Clientes Activos',
      value: activeClients.toString(),
      change: `${inactiveClients} inactivos`,
      changeType: inactiveClients > 0 ? 'warning' : 'positive',
      icon: UserGroupIcon,
      color: 'bg-green-500'
    },
    {
      name: user?.role === 'admin' ? 'Cuentas Activas' : 'Mis Cuentas Activas',
      value: activeAccounts.toString(),
      change: `${completedAccounts} completadas`,
      changeType: 'positive',
      icon: CreditCardIcon,
      color: 'bg-purple-500'
    },
    {
      name: user?.role === 'admin' ? 'Ingresos del Mes' : 'Mis Ingresos del Mes',
      value: formatCurrency(monthlyIncome),
      change: `${monthlyPayments.length} pagos`,
      changeType: 'positive',
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500'
    }
  ];

  // Construir actividad reciente real
  const recentActivities: any[] = [];

  // Pagos recientes
  userPayments.forEach((p) => {
    const account = accounts.find(a => a.id === p.accountId);
    if (!account) return;
    recentActivities.push({
      id: `payment-${p.id}`,
      type: 'payment',
      message: `Pago recibido de ${account.clientName} (${formatCurrency(p.amount)})`,
      time: new Date(p.paymentDate),
      status: 'success',
    });
  });

  // Nuevos clientes
  userClients.forEach((c) => {
    recentActivities.push({
      id: `client-${c.id}`,
      type: 'client',
      message: `Nuevo cliente registrado: ${c.name}`,
      time: new Date(c.createdAt),
      status: 'info',
    });
  });

  // Nuevas cuentas (ventas)
  userAccounts.forEach((a) => {
    const client = clients.find(c => c.id === a.clientId);
    recentActivities.push({
      id: `account-${a.id}`,
      type: 'account',
      message: `Nueva venta: ${client ? client.name : 'Cliente'} (${formatCurrency(a.totalAmount)})`,
      time: new Date(a.createdAt),
      status: 'info',
    });
    // Cuentas vencidas
    if (a.status === 'overdue') {
      recentActivities.push({
        id: `overdue-${a.id}`,
        type: 'overdue',
        message: `Cuenta vencida: ${client ? client.name : 'Cliente'}`,
        time: new Date(a.dueDate),
        status: 'warning',
      });
    }
  });

  // Movimientos de inventario (solo admin)
  if (user?.role === 'admin' && Array.isArray(movements)) {
    movements.forEach((m: any) => {
      const product = products.find(p => p.id === m.productId);
      recentActivities.push({
        id: `movement-${m.id}`,
        type: 'inventory',
        message: `${m.type === 'ingreso' ? 'Ingreso' : m.type === 'egreso' ? 'Egreso' : m.type === 'traslado' ? 'Traslado' : 'Desvío'} de ${m.quantity} ${product ? product.name : ''}`,
        time: new Date(m.date),
        status: 'info',
      });
    });
  }

  // Ordenar por fecha descendente y limitar a 10
  recentActivities.sort((a, b) => (b.time as Date).getTime() - (a.time as Date).getTime());
  const recentActivitiesToShow = recentActivities.slice(0, 10).map((a) => ({ ...a, time: timeAgo(a.time as Date) }));

  // Función para mostrar tiempo relativo
  function timeAgo(date: Date) {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // en segundos
    if (diff < 60) return 'Hace unos segundos';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} días`;
  }

  return (
    <div className="space-y-6">
      {/* Selector de divisa */}
      <div className="flex justify-end items-center">
        <div className="text-right">
          <div className="inline-flex rounded-md shadow-sm bg-white border border-gray-200">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-semibold rounded-l-md focus:outline-none transition-colors ${currency === 'ARS' ? 'bg-[#FBA518] text-white' : 'bg-white text-[#FBA518] hover:bg-[#FBA518]/10'}`}
              onClick={() => setCurrency('ARS')}
              aria-pressed={currency === 'ARS'}
            >
              ARS
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-semibold rounded-r-md focus:outline-none transition-colors border-l border-gray-200 ${currency === 'USD' ? 'bg-[#FBA518] text-white' : 'bg-white text-[#FBA518] hover:bg-[#FBA518]/10'}`}
              onClick={() => setCurrency('USD')}
              aria-pressed={currency === 'USD'}
            >
              USD
            </button>
          </div>
          {/* Valor del dólar blue */}
          <div className="mt-1 text-xs text-gray-500">
            {loadingDolar ? (
              <span className="text-gray-400">Actualizando dólar blue...</span>
            ) : (
              <span>Dólar blue: ${dolarBlue.toLocaleString('es-AR')} ARS</span>
            )}
          </div>
        </div>
      </div>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {user?.role === 'admin' 
            ? `Bienvenido de vuelta, ${user?.name}. Aquí tienes un resumen de tu negocio.`
            : `Bienvenido de vuelta, ${user?.name}. Aquí tienes un resumen de tus ventas y clientes.`
          }
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div
                      className={`font-semibold text-gray-900 break-words max-w-xs overflow-x-auto ${
                        stat.name.includes('Ingresos')
                          ? stat.value.replace(/[^0-9]/g, '').length > 8
                            ? 'text-sm'
                            : stat.value.replace(/[^0-9]/g, '').length > 6
                              ? 'text-base'
                              : 'text-2xl'
                          : 'text-2xl'
                      }`}
                      style={{ wordBreak: 'break-all' }}
                    >
                      {stat.value}
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acciones Rápidas primero en móvil, segundo en desktop */}
        <div className="card order-1 lg:order-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Acciones Rápidas
          </h3>
          <div className="space-y-3">
            {user?.role === 'admin' && (
              <button className="w-full flex items-center justify-between p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => navigate('/inventario')}
              >
                <div className="flex items-center">
                  <CubeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Registrar Ingreso de Productos
                  </span>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-gray-400" />
              </button>
            )}
            <button className="w-full flex items-center justify-between p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => navigate('/clientes')}
            >
              <div className="flex items-center">
                <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm font-medium text-gray-900">
                  {user?.role === 'admin' ? 'Agregar Nuevo Cliente' : 'Agregar Mi Cliente'}
                </span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => navigate('/cuentas')}
            >
              <div className="flex items-center">
                <CreditCardIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm font-medium text-gray-900">
                  {user?.role === 'admin' ? 'Registrar Pago' : 'Registrar Mi Pago'}
                </span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => navigate('/cuentas?vencidas=1')}
            >
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm font-medium text-gray-900">
                  {user?.role === 'admin' ? 'Ver Cuentas Vencidas' : 'Ver Mis Cuentas Vencidas'}
                </span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => navigate('/calculadora')}
            >
              <div className="flex items-center">
                <CalculatorIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm font-medium text-gray-900">
                  Calcular Cuotas de Productos
                </span>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
        {/* Actividad Reciente segundo en móvil, primero en desktop */}
        <div className="card order-2 lg:order-1">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Actividad Reciente
          </h3>
          <div className="space-y-4">
            {recentActivitiesToShow.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-400' :
                  activity.status === 'warning' ? 'bg-yellow-400' :
                  'bg-blue-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 