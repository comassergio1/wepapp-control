# 🔧 Configuración Persistente Manual en Hostinger

## 📋 **Opción 1: Usando PM2 (Recomendado)**

### Paso 1: Acceder a Terminal
1. Ve a tu **Panel de Hostinger**
2. Busca **"Terminal"**
3. Conecta al servidor

### Paso 2: Instalar PM2
```bash
cd public_html
npm install -g pm2
```

### Paso 3: Configurar PM2
```bash
# Crear archivo de configuración
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'wepapp-control',
    script: 'start.js',
    cwd: '/home/u564887081/public_html',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Detener procesos existentes
pkill -f "node.*index.js" || true

# Iniciar con PM2
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

### Paso 4: Verificar
```bash
pm2 status
pm2 logs
```

## 📋 **Opción 2: Usando Screen**

### Paso 1: Crear Sesión Screen
```bash
cd public_html

# Detener procesos existentes
pkill -f "node.*index.js" || true

# Crear sesión Screen
screen -dmS wepapp-control bash -c 'cd /home/u564887081/public_html && NODE_ENV=production PORT=3000 node start.js'
```

### Paso 2: Verificar
```bash
screen -ls
```

## 📋 **Opción 3: Usando nohup**

### Paso 1: Ejecutar con nohup
```bash
cd public_html

# Detener procesos existentes
pkill -f "node.*index.js" || true

# Ejecutar con nohup
nohup node start.js > logs/app.log 2>&1 &
```

### Paso 2: Verificar
```bash
ps aux | grep node
tail -f logs/app.log
```

## 🛠️ **Comandos Útiles**

### Para PM2:
```bash
pm2 status          # Ver estado
pm2 logs            # Ver logs
pm2 restart all     # Reiniciar
pm2 stop all        # Detener
pm2 delete all      # Eliminar
```

### Para Screen:
```bash
screen -ls              # Ver sesiones
screen -r wepapp-control # Conectar a sesión
screen -S wepapp-control -X quit # Detener sesión
```

### Para nohup:
```bash
ps aux | grep node      # Ver procesos
pkill -f "node.*index.js" # Detener aplicación
tail -f logs/app.log    # Ver logs
```

## 🔄 **Reinicio Automático**

### Con PM2:
- Se reinicia automáticamente si se cae
- Persiste entre reinicios del servidor

### Con Screen:
- Continúa ejecutándose aunque cierres SSH
- No se reinicia automáticamente si se cae

### Con nohup:
- Continúa ejecutándose aunque cierres SSH
- No se reinicia automáticamente si se cae

## 🎯 **Recomendación**

**Usa PM2** porque:
- ✅ Reinicio automático
- ✅ Monitoreo de procesos
- ✅ Logs organizados
- ✅ Persistencia entre reinicios
- ✅ Fácil gestión 