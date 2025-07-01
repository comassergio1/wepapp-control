# 🚀 Configuración de Producción - WepApp Control

Esta guía te ayudará a configurar tu aplicación WepApp Control para que esté siempre online y escalable en Hostinger.

## 📋 Requisitos Previos

- ✅ Cuenta en Hostinger con Node.js habilitado
- ✅ Acceso SSH configurado
- ✅ Dominio configurado (phoenixconsultora.online)
- ✅ Archivos subidos al servidor

## 🔧 Configuración Inicial

### 1. Configurar PM2 (Gestor de Procesos)

PM2 es esencial para mantener tu aplicación corriendo 24/7. Ejecuta:

```bash
cd wepapp-control
./setup-production.sh
```

Este script:
- ✅ Instala PM2 en el servidor
- ✅ Configura la aplicación para iniciar automáticamente
- ✅ Verifica que todo esté funcionando
- ✅ Muestra las URLs de acceso

### 2. Verificar Configuración

```bash
./monitor-production.sh
```

Este comando verifica:
- 📊 Estado de PM2
- 🔌 Puertos en uso
- 🌐 Conectividad web
- 🗄️ Base de datos
- 📝 Logs del sistema
- 💻 Uso de recursos

## 🚀 Despliegue de Actualizaciones

### Despliegue Automático

Para desplegar actualizaciones de forma segura:

```bash
cd wepapp-control
./deploy-production.sh
```

Este script:
- 💾 Crea backup automático
- 🔨 Construye la aplicación
- 📤 Sube archivos al servidor
- 📦 Instala dependencias
- 🔄 Reinicia la aplicación
- ✅ Verifica el despliegue

### Despliegue Manual

Si prefieres control manual:

```bash
# 1. Construir aplicación
npm run build

# 2. Subir archivos (reemplaza con tus credenciales)
scp -P 65002 -r build/* u564887081@82.29.86.165:/home/u564887081/public_html/

# 3. Conectar por SSH y reiniciar
ssh -p 65002 u564887081@82.29.86.165
cd /home/u564887081/public_html
pm2 restart wepapp-control
```

## 📊 Monitoreo y Gestión

### Monitoreo Continuo

```bash
./monitor-production.sh continuous
```

Muestra estado en tiempo real actualizado cada 30 segundos.

### Comandos Útiles

```bash
# Ver estado de PM2
ssh -p 65002 u564887081@82.29.86.165 'pm2 status'

# Ver logs en tiempo real
ssh -p 65002 u564887081@82.29.86.165 'pm2 logs wepapp-control'

# Reiniciar aplicación
ssh -p 65002 u564887081@82.29.86.165 'pm2 restart wepapp-control'

# Detener aplicación
ssh -p 65002 u564887081@82.29.86.165 'pm2 stop wepapp-control'

# Iniciar aplicación
ssh -p 65002 u564887081@82.29.86.165 'pm2 start wepapp-control'
```

## 🔗 URLs de Acceso

- **Aplicación Principal**: https://phoenixconsultora.online
- **API Backend**: https://phoenixconsultora.online/api
- **Panel de Control**: https://phoenixconsultora.online/dashboard

## 🛠️ Solución de Problemas

### La aplicación no responde

1. **Verificar PM2**:
   ```bash
   ssh -p 65002 u564887081@82.29.86.165 'pm2 status'
   ```

2. **Revisar logs**:
   ```bash
   ssh -p 65002 u564887081@82.29.86.165 'pm2 logs wepapp-control'
   ```

3. **Reiniciar aplicación**:
   ```bash
   ssh -p 65002 u564887081@82.29.86.165 'pm2 restart wepapp-control'
   ```

### Error de base de datos

1. **Verificar archivo de BD**:
   ```bash
   ssh -p 65002 u564887081@82.29.86.165 'ls -la /home/u564887081/public_html/database/'
   ```

2. **Recrear base de datos**:
   ```bash
   ssh -p 65002 u564887081@82.29.86.165 'cd /home/u564887081/public_html && node database/setup.js'
   ```

### Problemas de puertos

1. **Verificar puerto en uso**:
   ```bash
   ssh -p 65002 u564887081@82.29.86.165 'netstat -tuln | grep :3000'
   ```

2. **Verificar configuración de Hostinger**:
   - Asegúrate de que Node.js esté habilitado en tu plan
   - Verifica que el puerto 3000 esté configurado correctamente

## 📈 Escalabilidad

### Optimizaciones Recomendadas

1. **Caché de Base de Datos**:
   - Considera usar Redis para caché
   - Optimiza consultas SQL

2. **CDN para Archivos Estáticos**:
   - Usa Cloudflare o similar
   - Optimiza imágenes y CSS/JS

3. **Monitoreo Avanzado**:
   - Configura alertas por email
   - Usa herramientas como UptimeRobot

### Backup Automático

Los backups se crean automáticamente en:
```
/home/u564887081/public_html/backups/
```

Para restaurar un backup:
```bash
ssh -p 65002 u564887081@82.29.86.165 'cd /home/u564887081/public_html && tar -xzf backups/backup_YYYYMMDD_HHMMSS.tar.gz'
```

## 🔒 Seguridad

### Recomendaciones

1. **Contraseñas Fuertes**: Cambia las contraseñas por defecto
2. **HTTPS**: Ya configurado en Hostinger
3. **Logs**: Revisa regularmente los logs de acceso
4. **Actualizaciones**: Mantén Node.js y dependencias actualizadas

### Variables de Entorno

Configura estas variables en tu servidor:
```bash
NODE_ENV=production
PORT=3000
DB_PATH=/home/u564887081/public_html/database/wepapp_control.db
```

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs**: `./monitor-production.sh`
2. **Verifica el estado**: `ssh -p 65002 u564887081@82.29.86.165 'pm2 status'`
3. **Reinicia la aplicación**: `ssh -p 65002 u564887081@82.29.86.165 'pm2 restart wepapp-control'`

## 🎯 Resumen de Comandos Principales

```bash
# Configuración inicial
./setup-production.sh

# Desplegar actualizaciones
./deploy-production.sh

# Monitorear estado
./monitor-production.sh

# Monitoreo continuo
./monitor-production.sh continuous

# Verificar puertos locales
./check-ports.sh

# Abrir puertos (solo desarrollo local)
./open-ports.sh
```

¡Tu aplicación ahora estará siempre online y escalable! 🚀 