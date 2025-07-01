# 📊 Módulo Importar/Exportar - WepApp Control

## 🎯 Descripción

El módulo de Importar/Exportar permite a los administradores gestionar datos masivamente en formato Excel para productos y clientes.

## 🔐 Acceso

- **Solo administradores** pueden acceder a este módulo
- **Ruta**: `/import-export`
- **Icono**: ArrowUpTrayIcon en la navegación

## 🚀 Funcionalidades

### 1. **Exportar Datos**
- Exporta productos o clientes actuales a archivos Excel
- Formato: `productos_export_YYYY-MM-DD.xlsx` o `clientes_export_YYYY-MM-DD.xlsx`
- Incluye todos los campos de la base de datos

### 2. **Descargar Plantillas**
- Plantillas con formato correcto y datos de ejemplo
- Archivos: `plantilla_productos.xlsx` y `plantilla_clientes.xlsx`
- Incluyen headers y una fila de ejemplo

### 3. **Importar Datos**
- Sube archivos Excel (.xlsx, .xls)
- Valida formato y datos
- Actualiza productos/clientes existentes por ID
- Crea nuevos registros si no existe ID

### 4. **Reporte de Resultados**
- Muestra cantidad de operaciones exitosas y errores
- Lista detallada de cada operación
- Indica filas específicas donde ocurrieron errores

## 📋 Formatos de Archivos

### **Productos (productos.xlsx)**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | Number | No | ID del producto (vacío para crear nuevo) |
| name | String | Sí | Nombre del producto |
| description | String | No | Descripción detallada |
| price | Number | Sí | Precio en centavos (ej: 1500000) |
| stock | Number | Sí | Cantidad en stock |
| category | String | No | Categoría del producto |
| location | String | No | Ubicación del stock |
| is_active | String | No | 'TRUE' o 'FALSE' |

### **Clientes (clientes.xlsx)**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | Number | No | ID del cliente (vacío para crear nuevo) |
| name | String | Sí | Nombre completo del cliente |
| email | String | No | Email del cliente |
| phone | String | No | Teléfono de contacto |
| address | String | No | Dirección completa |
| revendedor_id | Number | Sí | ID del revendedor responsable |
| is_active | String | No | 'TRUE' o 'FALSE' |

## 🔧 Funciones del Sistema

### **Importación Inteligente**
- **Actualización**: Si se proporciona un ID válido, actualiza el registro existente
- **Creación**: Si el ID está vacío, crea un nuevo registro
- **Validación**: Verifica campos requeridos y formatos
- **Manejo de Errores**: Continúa procesando aunque algunas filas fallen

### **Exportación Completa**
- Incluye todos los campos de la base de datos
- Formato optimizado para Excel
- Columnas con ancho ajustado automáticamente
- Nombres de archivo con fecha

### **Plantillas Educativas**
- Formato exacto requerido
- Datos de ejemplo realistas
- Headers claros y descriptivos
- Instrucciones incluidas

## 📊 Reporte de Resultados

### **Resumen Visual**
```
✅ Exitosos: 15
❌ Errores: 3
```

### **Detalles de Éxito**
```
✅ Producto actualizado: iPhone 15 Pro (ID: 1)
✅ Producto creado: Samsung Galaxy S24
✅ Cliente actualizado: Juan Pérez (ID: 5)
```

### **Detalles de Errores**
```
❌ Fila 3: Faltan campos requeridos (name, price, stock)
❌ Fila 7: Producto con ID 999 no encontrado
❌ Fila 12: Error: Precio debe ser un número válido
```

## ⚠️ Consideraciones Importantes

### **Formato de Datos**
- **Precios**: Siempre en centavos (1500000 = $15,000.00)
- **Fechas**: No se manejan en este módulo
- **Booleanos**: 'TRUE' o 'FALSE' como texto
- **IDs**: Números enteros válidos

### **Validaciones**
- Campos requeridos no pueden estar vacíos
- IDs deben existir en la base de datos para actualizaciones
- Formatos de datos deben ser correctos
- Emails únicos para usuarios

### **Limitaciones**
- Solo productos y clientes (no cuentas, pagos, etc.)
- No maneja archivos muy grandes (>10MB)
- Requiere conexión al servidor
- Solo administradores pueden acceder

## 🛠️ Implementación Técnica

### **Tecnologías Utilizadas**
- **Frontend**: React + TypeScript
- **Librería Excel**: XLSX.js
- **UI**: Tailwind CSS + Heroicons
- **Estado**: React Context API

### **Archivos Principales**
- `src/pages/ImportExport.tsx` - Componente principal
- `src/contexts/DataContext.tsx` - Funciones de datos
- `src/components/Layout.tsx` - Navegación

### **Funciones Clave**
```typescript
// Exportar
exportProducts() / exportClients()

// Plantillas
downloadProductTemplate() / downloadClientTemplate()

// Importar
importProducts(file) / importClients(file)

// Utilidades
readExcelFile(file) / handleFileSelect(event)
```

## 🚀 Uso del Módulo

### **Paso 1: Acceder**
1. Iniciar sesión como administrador
2. Hacer clic en "Importar/Exportar" en la navegación

### **Paso 2: Exportar Datos Actuales**
1. Seleccionar pestaña "Productos" o "Clientes"
2. Hacer clic en "Exportar Datos"
3. Descargar archivo Excel

### **Paso 3: Descargar Plantilla**
1. Hacer clic en "Descargar Plantilla"
2. Usar como base para nuevos datos

### **Paso 4: Preparar Datos**
1. Abrir plantilla en Excel
2. Completar datos según necesidades
3. Guardar archivo

### **Paso 5: Importar**
1. Hacer clic en "Seleccionar Archivo Excel"
2. Elegir archivo preparado
3. Esperar procesamiento
4. Revisar resultados

## 🔍 Solución de Problemas

### **Error: "Archivo no encontrado"**
- Verificar que el archivo existe
- Comprobar extensión (.xlsx, .xls)
- Revisar permisos de archivo

### **Error: "Faltan campos requeridos"**
- Completar todos los campos obligatorios
- Verificar formato de datos
- Revisar headers del archivo

### **Error: "ID no encontrado"**
- Verificar que el ID existe en la base de datos
- Comprobar formato numérico del ID
- Usar ID vacío para crear nuevos registros

### **Error: "Formato inválido"**
- Verificar tipos de datos
- Comprobar formato de precios (centavos)
- Revisar valores booleanos ('TRUE'/'FALSE')

## 📈 Mejoras Futuras

### **Funcionalidades Planificadas**
- Importar/exportar cuentas y pagos
- Validación en tiempo real
- Vista previa de datos antes de importar
- Historial de importaciones
- Rollback de operaciones

### **Optimizaciones**
- Procesamiento en lotes
- Progreso en tiempo real
- Compresión de archivos grandes
- Cache de plantillas

## 📞 Soporte

Para problemas técnicos:
1. Verificar logs de la consola
2. Comprobar formato de archivos
3. Validar permisos de administrador
4. Revisar conexión al servidor 