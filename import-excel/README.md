# 📊 Importación Masiva de Datos - WepApp Control

## 📋 Descripción

Este sistema permite importar datos masivamente desde archivos Excel a la base de datos de WepApp Control.

## 📁 Archivos Generados

### 1. **usuarios.xlsx** - Gestión de Usuarios
- **name**: Nombre completo del usuario
- **email**: Email único del usuario
- **password**: Contraseña en texto plano (se hasheará automáticamente)
- **role**: `admin` o `revendedor`
- **is_active**: `TRUE` o `FALSE`

### 2. **productos.xlsx** - Catálogo de Productos
- **name**: Nombre del producto
- **description**: Descripción detallada
- **price**: Precio en centavos (ej: 1500000 = $15,000.00)
- **stock**: Cantidad disponible
- **category**: Categoría del producto
- **location**: Ubicación del stock
- **is_active**: `TRUE` o `FALSE`

### 3. **clientes.xlsx** - Base de Clientes
- **name**: Nombre completo del cliente
- **email**: Email del cliente
- **phone**: Teléfono de contacto
- **address**: Dirección completa
- **revendedor_id**: ID del revendedor responsable
- **is_active**: `TRUE` o `FALSE`

### 4. **cuentas.xlsx** - Cuentas de Financiamiento
- **client_id**: ID del cliente
- **product_id**: ID del producto
- **total_amount**: Monto total en centavos
- **delivery_amount**: Monto de entrega en centavos
- **installment_amount**: Monto por cuota en centavos
- **total_installments**: Número total de cuotas
- **start_date**: Fecha de inicio (YYYY-MM-DD)
- **due_date**: Fecha de vencimiento (YYYY-MM-DD)
- **status**: `active`, `completed`, o `overdue`
- **revendedor_id**: ID del revendedor
- **is_active**: `TRUE` o `FALSE`

### 5. **pagos.xlsx** - Historial de Pagos
- **account_id**: ID de la cuenta
- **amount**: Monto del pago en centavos
- **installment_number**: Número de cuota
- **payment_date**: Fecha del pago (YYYY-MM-DD)
- **payment_method**: Método de pago
- **notes**: Notas adicionales
- **user_id**: ID del usuario que registró el pago

### 6. **movimientos_inventario.xlsx** - Control de Stock
- **product_id**: ID del producto
- **type**: `ingreso` o `egreso`
- **quantity**: Cantidad movida
- **notes**: Notas del movimiento
- **user_id**: ID del usuario que realizó el movimiento

## 🚀 Instrucciones de Uso

### Paso 1: Preparar los Datos
1. Abre cada archivo Excel en tu aplicación preferida
2. Completa los datos según tus necesidades
3. **IMPORTANTE**: Mantén las columnas en el orden especificado
4. Guarda los archivos en la carpeta `import-excel/`

### Paso 2: Verificar Dependencias
Asegúrate de que:
- Los `revendedor_id` en clientes existan en la tabla usuarios
- Los `client_id` y `product_id` en cuentas existan
- Los `account_id` en pagos existan en la tabla cuentas

### Paso 3: Ejecutar la Importación
```bash
# Desde el directorio principal del proyecto
node import-excel-data.js
```

### Paso 4: Verificar Resultados
- Revisa la consola para ver el progreso
- Verifica los datos en la aplicación web
- Revisa los logs de errores si los hay

## ⚠️ Consideraciones Importantes

### Orden de Importación
El script importa en este orden para respetar las dependencias:
1. **Usuarios** (necesarios para revendedores)
2. **Productos** (necesarios para cuentas)
3. **Clientes** (necesarios para cuentas)
4. **Cuentas** (necesarias para pagos)
5. **Pagos** (dependen de cuentas)
6. **Movimientos de Inventario** (dependen de productos)

### Formato de Fechas
- Usa formato: `YYYY-MM-DD`
- Ejemplo: `2024-01-15`

### Formato de Precios
- Todos los precios van en **centavos**
- Ejemplo: `1500000` = $15,000.00

### Contraseñas
- Las contraseñas se hashean automáticamente
- Usa contraseñas seguras en producción

## 🔧 Personalización

### Agregar Nuevos Campos
1. Modifica el archivo Excel correspondiente
2. Actualiza el script `import-excel-data.js`
3. Agrega la lógica de importación

### Validaciones Personalizadas
Puedes agregar validaciones en el script:
- Verificar formato de emails
- Validar rangos de precios
- Comprobar fechas válidas

## 🆘 Solución de Problemas

### Error: "Archivo no encontrado"
- Verifica que los archivos estén en `import-excel/`
- Revisa que los nombres coincidan exactamente

### Error: "Foreign key constraint failed"
- Verifica que los IDs referenciados existan
- Importa primero las tablas dependientes

### Error: "UNIQUE constraint failed"
- Verifica que no haya duplicados
- Revisa emails únicos en usuarios

### Error: "NOT NULL constraint failed"
- Completa todos los campos obligatorios
- Verifica que no haya filas vacías

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de error en la consola
2. Verifica el formato de los datos
3. Comprueba las dependencias entre tablas
4. Revisa que la base de datos esté accesible 