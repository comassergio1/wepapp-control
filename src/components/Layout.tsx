import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  CubeIcon,
  UserGroupIcon,
  CreditCardIcon,
  UsersIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalculatorIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['admin', 'revendedor'] },
    { name: 'Inventario', href: '/inventario', icon: CubeIcon, roles: ['admin', 'revendedor'] },
    { name: 'Cuentas', href: '/cuentas', icon: CreditCardIcon, roles: ['admin', 'revendedor'] },
    { name: 'Clientes', href: '/clientes', icon: UserGroupIcon, roles: ['admin', 'revendedor'] },
    { name: 'Calculadora', href: '/calculadora', icon: CalculatorIcon, roles: ['admin', 'revendedor'] },
    { name: 'Usuarios', href: '/usuarios', icon: UsersIcon, roles: ['admin'] },
    { name: 'Importar/Exportar', href: '/import-export', icon: ArrowUpTrayIcon, roles: ['admin'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || '')
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar móvil - desde la derecha */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white ml-auto">
          <div className="absolute top-0 left-0 -ml-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <img src="https://i.postimg.cc/zXGd0h5L/POMELO.png" alt="Logo Pomelo" className="w-full h-auto object-contain" />
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      isActive
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={`mr-4 flex-shrink-0 h-6 w-6 ${
                        isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          {/* Footer móvil con información del usuario y botón de cerrar sesión */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={() => {
                handleLogout();
                setSidebarOpen(false);
              }}
              className="ml-auto flex-shrink-0 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <img src="https://i.postimg.cc/zXGd0h5L/POMELO.png" alt="Logo Pomelo" className="w-full h-auto object-contain" />
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {filteredNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 flex-shrink-0 h-6 w-6 ${
                          isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto flex-shrink-0 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header móvil con logo y botón de menú */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <img src="https://i.postimg.cc/wx0ycy0b/LOGO-SOLO.png" alt="Logo Pomelo" className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">POMELO</h1>
              <p className="text-xs text-gray-500">Gestión de ventas</p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center h-10 w-10 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
        
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
          
          {/* Footer - DESACTIVADO TEMPORALMENTE */}
          {/*
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center mb-4">
                    <BuildingOfficeIcon className="h-8 w-8 text-primary-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">Consultora Empresarial</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Especialistas en soluciones integrales para el crecimiento empresarial. 
                    Ofrecemos servicios de consultoría, desarrollo de software y gestión de proyectos 
                    para optimizar los procesos de su organización.
                  </p>
                  <div className="flex space-x-4">
                    <span className="text-xs text-gray-500">© 2024 Consultora Empresarial. Todos los derechos reservados.</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Servicios</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>Consultoría Empresarial</li>
                    <li>Desarrollo de Software</li>
                    <li>Gestión de Proyectos</li>
                    <li>Optimización de Procesos</li>
                    <li>Análisis de Datos</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Contacto</h4>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>+54 11 1234-5678</span>
                    </div>
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>info@consultora.com</span>
                    </div>
                    <div className="flex items-start">
                      <MapPinIcon className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                      <span>Av. Corrientes 1234<br />CABA, Argentina</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </footer>
          */}
        </main>
      </div>
    </div>
  );
};

export default Layout; 