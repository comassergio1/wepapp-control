#!/bin/bash

echo "🔍 Verificando estado de PM2 y la aplicación..."

# Leer configuración
SSH_USER=$(node -e "console.log(require('./hostinger-config.json').ssh.user)")
SSH_HOST=$(node -e "console.log(require('./hostinger-config.json').ssh.host)")
SSH_PORT=$(node -e "console.log(require('./hostinger-config.json').ssh.port)")
SSH_PATH=$(node -e "console.log(require('./hostinger-config.json').ssh.path)")

echo "✅ Configuración cargada:"
echo "   Usuario: $SSH_USER"
echo "   Host: $SSH_HOST"
echo "   Puerto: $SSH_PORT"
echo "   Ruta: $SSH_PATH"

echo ""
echo "🔐 Se te pedirá la contraseña SSH..."
echo ""

# Verificar estado de PM2
echo "📊 Estado de PM2:"
ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "cd $SSH_PATH && pm2 status"

echo ""
echo "📝 Logs recientes:"
ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "cd $SSH_PATH && pm2 logs --lines 10"

echo ""
echo "🌐 Verificando acceso web..."
echo "   URL: https://phoenixconsultora.online"
echo "   Email: admin@empresa.com"
echo "   Contraseña: admin123"

echo ""
echo "✅ Verificación completada"
echo ""
echo "🔧 Comandos útiles:"
echo "   pm2 status          - Ver estado"
echo "   pm2 logs            - Ver logs"
echo "   pm2 restart all     - Reiniciar"
echo "   pm2 stop all        - Detener" 