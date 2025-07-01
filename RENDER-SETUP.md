# 🚀 Configuración para Render.com

## 📋 Pasos para desplegar en Render

### **1. Preparar el repositorio**

Tu aplicación ya está configurada para Render con:
- ✅ `render.yaml` - Configuración de Render
- ✅ `package.json` - Scripts actualizados
- ✅ `server/index.js` - Servidor configurado para servir React

### **2. Crear repositorio en GitHub**

```bash
# En tu carpeta wepapp-control
git init
git add .
git commit -m "Configuración inicial para Render"
git branch -M main
git remote add origin https://github.com/agustinvillarino/wepapp-control.git
git push -u origin main
```

### **3. Configurar Render.com**

1. **Ir a Render.com**
   - Ve a https://render.com
   - Regístrate con tu cuenta de GitHub

2. **Crear nuevo servicio**
   - Click en "New +"
   - Selecciona "Web Service"
   - Conecta tu repositorio de GitHub

3. **Configurar el servicio**
   - **Name**: `wepapp-control`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

4. **Variables de entorno**
   - `NODE_ENV` = `production`
   - `PORT` = `10000`

### **4. Desplegar**

- Click en "Create Web Service"
- Render comenzará el despliegue automáticamente
- Espera 5-10 minutos para que termine

### **5. Configurar dominio personalizado (opcional)**

1. En tu servicio de Render, ve a "Settings"
2. "Custom Domains"
3. Agrega: `phoenixconsultora.online`
4. Configura DNS en tu proveedor de dominio

## 🔧 Configuración Técnica

### **Archivos importantes:**

- **`render.yaml`**: Configuración de Render
- **`package.json`**: Scripts de build y start
- **`server/index.js`**: Servidor Express + React

### **Estructura del proyecto:**

```
wepapp-control/
├── build/           # Archivos de React (generados)
├── server/          # Servidor Express
├── src/             # Código fuente React
├── database/        # Base de datos SQLite
├── uploads/         # Archivos subidos
├── render.yaml      # Configuración Render
└── package.json     # Dependencias y scripts
```

## 🚀 URLs de Acceso

- **Render**: `https://wepapp-control.onrender.com`
- **Dominio personalizado**: `https://phoenixconsultora.online` (después de configurar)

## 📊 Monitoreo

### **En Render Dashboard:**
- **Logs**: Ver logs en tiempo real
- **Métricas**: CPU, memoria, requests
- **Deployments**: Historial de despliegues

### **Comandos útiles:**
```bash
# Ver logs
# (Desde el dashboard de Render)

# Reiniciar servicio
# (Desde el dashboard de Render)
```

## 🔄 Despliegues Automáticos

- **Auto-deploy**: Activado
- **Trigger**: Push a `main` branch
- **Build time**: ~5-10 minutos

## 🛠️ Solución de Problemas

### **Error: "Build failed"**
- Verifica que `npm install` funcione localmente
- Revisa los logs de build en Render

### **Error: "Application error"**
- Verifica que `npm start` funcione localmente
- Revisa los logs de runtime en Render

### **Error: "Database not found"**
- La base de datos se creará automáticamente
- Verifica permisos de escritura

### **Error: "Port already in use"**
- Render usa puerto 10000 automáticamente
- No necesitas configurar puerto manualmente

## 📈 Escalabilidad

### **Plan Gratuito:**
- ✅ 750 horas/mes
- ✅ 512MB RAM
- ✅ 0.1 CPU
- ❌ Se duerme después de 15 min de inactividad

### **Plan Pago ($7/mes):**
- ✅ Sin límite de horas
- ✅ 1GB RAM
- ✅ 0.5 CPU
- ✅ Siempre activo

## 🔒 Seguridad

- ✅ **HTTPS automático**
- ✅ **Variables de entorno seguras**
- ✅ **Logs privados**
- ✅ **Backups automáticos**

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs** en Render Dashboard
2. **Verifica la configuración** de este README
3. **Prueba localmente** con `npm run build && npm start`
4. **Contacta soporte** de Render si es necesario

## 🎯 Próximos Pasos

1. **Desplegar en Render** (30 min)
2. **Probar la aplicación** (15 min)
3. **Configurar dominio** (opcional, 10 min)
4. **Migrar a VPS** cuando estés listo

¡Tu aplicación estará online en menos de 1 hora! 🚀 