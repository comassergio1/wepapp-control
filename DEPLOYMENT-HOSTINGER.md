# 🚀 Deployment en Hostinger - WepApp Control

## 📋 Requisitos Previos

### 1. **Credenciales SSH de Hostinger**
- **Usuario SSH**: (ej: `u123456789`)
- **Contraseña SSH**: (tu contraseña de Hostinger)
- **Host**: `phoenixconsultora.online` o `srv123.hostinger.com`

### 2. **Panel de Hostinger**
- Acceso al panel de control
- Node.js habilitado (versión 18.x o superior)

## 🔧 Configuración

### Paso 1: Obtener Credenciales SSH
1. Ve a tu **Panel de Hostinger**
2. Busca **"Herramientas"** → **"SSH"**
3. Anota:
   - **Host/Servidor**
   - **Usuario**
   - **Contraseña**
   - **Puerto** (normalmente 22)

### Paso 2: Configurar Script
1. Edita `setup-hostinger.sh`
2. Reemplaza `TU_USUARIO_AQUI` con tu usuario real
3. Ejecuta:
   ```bash
   chmod +x setup-hostinger.sh
   ./setup-hostinger.sh
   ```

## 🌐 Configuración del Dominio

### En el Panel de Hostinger:
1. Ve a **"Dominios"** → **"phoenixconsultora.online"**
2. Configura el **DNS** para que apunte a tu hosting
3. Habilita **SSL/HTTPS**

### Configuración de Node.js:
1. Ve a **"Herramientas"** → **"Node.js"**
2. Habilita Node.js
3. Selecciona versión **18.x** o superior
4. Configura el **puerto 3000**

## 📁 Estructura del Servidor

```
/home/TU_USUARIO/public_html/
├── build/                 # Archivos de React
├── server/               # Backend Node.js
├── database/             # Base de datos SQLite
├── uploads/              # Archivos subidos
├── package.json          # Dependencias
└── install.sh           # Script de instalación
```

## 🔐 Acceso a la Aplicación

### Credenciales por Defecto:
- **Email**: `admin@empresa.com`
- **Contraseña**: `admin123`

### URL de Acceso:
- **Producción**: `https://phoenixconsultora.online`

## 🛠️ Comandos Útiles

### Verificar Estado:
```bash
ssh TU_USUARIO@phoenixconsultora.online
cd public_html
node --version
npm --version
```

### Reiniciar Aplicación:
```bash
ssh TU_USUARIO@phoenixconsultora.online
cd public_html
pkill -f "node.*index.js"
npm start
```

### Ver Logs:
```bash
ssh TU_USUARIO@phoenixconsultora.online
cd public_html/logs
tail -f app.log
```

## 🔄 Actualizaciones

Para actualizar la aplicación:
1. Ejecuta `./setup-hostinger.sh` nuevamente
2. Los archivos se actualizarán automáticamente
3. La aplicación se reiniciará

## 🆘 Solución de Problemas

### Error: "Cannot find module"
- Ejecuta: `npm install --production`

### Error: "Port already in use"
- Verifica que no haya otra aplicación corriendo
- Cambia el puerto en `production.env`

### Error: "Permission denied"
- Verifica permisos: `chmod 755 database/ uploads/`

## 📞 Soporte

Si tienes problemas:
1. Verifica las credenciales SSH
2. Confirma que Node.js esté habilitado
3. Revisa los logs en `public_html/logs/` 