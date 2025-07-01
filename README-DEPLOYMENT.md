# 🚀 Despliegue en Hostinger - WepApp Control

## 📋 Requisitos Previos

### 1. **Credenciales de Hostinger**
- Acceso al panel de control de Hostinger
- Credenciales SSH habilitadas
- Node.js habilitado (versión 18.x o superior)

### 2. **Dominio Configurado**
- Dominio apuntando al hosting de Hostinger
- SSL/HTTPS habilitado

## 🔧 Configuración Inicial

### Paso 1: Obtener Credenciales SSH
1. Ve a tu **Panel de Hostinger**
2. Busca **"Herramientas"** → **"SSH"**
3. Anota:
   - **Host/Servidor** (ej: `phoenixconsultora.online`)
   - **Usuario SSH** (ej: `u123456789`)
   - **Contraseña SSH**
   - **Puerto** (normalmente 22)

### Paso 2: Configurar Archivo de Credenciales
Edita el archivo `hostinger-config.json`:

```json
{
  "ssh": {
    "user": "TU_USUARIO_REAL",
    "host": "phoenixconsultora.online",
    "port": 22,
    "path": "/home/TU_USUARIO_REAL/public_html"
  },
  "domain": "phoenixconsultora.online",
  "nodejs": {
    "version": "18.x",
    "port": 3000
  }
}
```

**Reemplaza:**
- `TU_USUARIO_REAL` con tu usuario SSH real de Hostinger

## 🚀 Proceso de Despliegue

### Paso 1: Preparar Aplicación
```bash
# Construir la aplicación
./build.sh
```

### Paso 2: Desplegar
```bash
# Dar permisos al script
chmod +x deploy.sh

# Ejecutar despliegue
./deploy.sh
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
├── logs/                 # Logs de la aplicación
├── package.json          # Dependencias
├── start.js             # Script de inicio
└── .htaccess            # Configuración Apache
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

### Ver Logs:
```bash
ssh TU_USUARIO@phoenixconsultora.online
cd public_html/logs
tail -f app.log
```

### Reiniciar Aplicación:
```bash
ssh TU_USUARIO@phoenixconsultora.online
cd public_html
pkill -f "node.*index.js"
nohup node start.js > logs/app.log 2>&1 &
```

### Con PM2 (si está instalado):
```bash
ssh TU_USUARIO@phoenixconsultora.online
cd public_html
pm2 restart wepapp-control
pm2 logs wepapp-control
```

## 🔄 Actualizaciones

Para actualizar la aplicación:
1. Ejecuta `./deploy.sh` nuevamente
2. Los archivos se actualizarán automáticamente
3. La aplicación se reiniciará

## 🆘 Solución de Problemas

### Error: "Cannot find module"
```bash
ssh TU_USUARIO@phoenixconsultora.online
cd public_html
npm install --production
```

### Error: "Port already in use"
```bash
ssh TU_USUARIO@phoenixconsultora.online
cd public_html
pkill -f "node.*index.js"
```

### Error: "Permission denied"
```bash
ssh TU_USUARIO@phoenixconsultora.online
cd public_html
chmod 755 database/ uploads/
chmod 644 database/*.db
```

### Error: "Database locked"
```bash
ssh TU_USUARIO@phoenixconsultora.online
cd public_html
pkill -f "node.*index.js"
rm database/wepapp_control.db-journal
```

## 📞 Soporte

Si tienes problemas:
1. Verifica las credenciales SSH en `hostinger-config.json`
2. Confirma que Node.js esté habilitado en el panel
3. Revisa los logs en `public_html/logs/`
4. Verifica que el dominio esté configurado correctamente 