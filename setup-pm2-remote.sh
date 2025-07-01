#!/bin/bash
echo "🔧 Configurando PM2 en el servidor..."

cd /home/u564887081/public_html

# Instalar PM2 globalmente
npm install -g pm2

# Crear archivo de configuración PM2
cat > ecosystem.config.js << 'PM2CONFIG'
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
    time: true,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
PM2CONFIG

# Detener procesos existentes
pkill -f "node.*index.js" || true

# Iniciar con PM2
pm2 start ecosystem.config.js

# Guardar configuración PM2
pm2 save

# Configurar PM2 para iniciar automáticamente
pm2 startup

echo "✅ PM2 configurado correctamente"
echo "📋 Comandos útiles:"
echo "   pm2 status          - Ver estado"
echo "   pm2 logs            - Ver logs"
echo "   pm2 restart all     - Reiniciar"
echo "   pm2 stop all        - Detener"
echo "   pm2 delete all      - Eliminar"
