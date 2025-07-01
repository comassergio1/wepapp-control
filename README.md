# WepApp Control

Sistema de gestión de ventas con autofinanciamiento y red de revendedores desarrollado en React y Node.js.

## 🚀 Características

- **Gestión de Usuarios**: Administradores y revendedores con roles diferenciados
- **Gestión de Productos**: Control de inventario con movimientos automáticos
- **Gestión de Clientes**: Asociación con revendedores y estados activo/inactivo
- **Sistema de Cuentas**: Autofinanciamiento con control de pagos y cuotas
- **Dashboard Personalizado**: Estadísticas específicas por rol de usuario
- **Base de Datos SQLite**: Persistencia de datos con integridad referencial

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn
- SQLite3 (opcional, se instala automáticamente)

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd wepapp-control
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar la base de datos**
```bash
npm run db:setup
```

4. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

## 🗄️ Base de Datos

### Estructura
- **users**: Usuarios del sistema (admin/revendedor)
- **products**: Catálogo de productos con control de stock
- **clients**: Clientes asociados a revendedores
- **accounts**: Cuentas de autofinanciamiento
- **payments**: Registro de pagos realizados
- **inventory_movements**: Historial de movimientos de inventario

### Características
- ✅ Integridad referencial con foreign keys
- ✅ Triggers automáticos para actualizaciones
- ✅ Índices optimizados para consultas
- ✅ Datos de ejemplo incluidos

### Scripts Disponibles
```bash
npm run db:setup    # Configurar base de datos desde cero
npm run server      # Iniciar solo el servidor backend
npm run dev         # Iniciar servidor + frontend
```

## 👥 Roles de Usuario

### Administrador
- Acceso completo a todas las funcionalidades
- Gestión de inventario (ingresos/egresos)
- Gestión de usuarios
- Reportes globales

### Revendedor
- Gestión de sus clientes y cuentas
- Registro de pagos
- Dashboard personalizado
- Sin acceso a gestión de inventario

## 🔐 Credenciales de Prueba

### Administrador
- **Email**: admin@empresa.com
- **Password**: admin123

### Revendedor
- **Email**: revendedor1@empresa.com
- **Password**: revendedor123

## 📊 Funcionalidades Principales

### Dashboard
- Estadísticas personalizadas por rol
- Acciones rápidas según permisos
- Resumen de ventas y clientes

### Gestión de Clientes
- CRUD completo de clientes
- Estados activo/inactivo
- Asociación automática con revendedor
- Filtrado por revendedor

### Gestión de Productos
- Control de stock automático
- Movimientos de inventario
- Categorización
- Eliminación con confirmación

### Sistema de Cuentas
- Autofinanciamiento con cuotas
- Control de pagos
- Estados: activa, completada, vencida
- Descuento automático de stock

### Gestión de Pagos
- Registro de pagos por cuota
- Métodos de pago
- Actualización automática de montos
- Historial completo

## 🏗️ Arquitectura

### Frontend
- **React 19** con TypeScript
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Context API** para estado global

### Backend
- **Node.js** con Express
- **SQLite3** para base de datos
- **bcryptjs** para encriptación
- **CORS** habilitado

### Base de Datos
- **SQLite** para desarrollo
- Esquema optimizado con índices
- Triggers para integridad de datos
- Migración fácil a PostgreSQL/MySQL

## 🔧 Configuración

### Variables de Entorno
Copiar `env.example` a `.env` y configurar:
```env
DB_PATH=./database/wepapp_control.db
PORT=3001
JWT_SECRET=tu_secret_aqui
```

### Puertos
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

## 📁 Estructura del Proyecto

```
wepapp-control/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── contexts/       # Contextos de React
│   ├── pages/          # Páginas principales
│   ├── types/          # Tipos TypeScript
│   └── ...
├── server/             # Servidor Express
│   └── index.js        # API REST
├── database/           # Base de datos
│   ├── schema.sql      # Esquema de BD
│   ├── seed.sql        # Datos iniciales
│   ├── setup.js        # Script de configuración
│   └── wepapp_control.db
└── ...
```

## 🚀 Despliegue

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm run server
```

## 🔄 Migración de Datos

Para migrar desde datos en memoria a la base de datos:

1. Ejecutar `npm run db:setup`
2. Los datos de ejemplo se cargan automáticamente
3. La aplicación se conecta automáticamente a la BD

## 🛡️ Seguridad

- Contraseñas hasheadas con bcrypt
- Validación de roles en frontend y backend
- CORS configurado
- Sanitización de inputs
- Integridad referencial en BD

## 📈 Próximas Mejoras

- [ ] Autenticación JWT
- [ ] Subida de imágenes para comprobantes
- [ ] Reportes avanzados
- [ ] Notificaciones push
- [ ] Backup automático de BD
- [ ] Migración a PostgreSQL

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

**Desarrollado con ❤️ para gestión de ventas con autofinanciamiento**
