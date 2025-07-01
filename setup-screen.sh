#!/bin/bash

echo "🚀 Configurando Screen para ejecución persistente..."

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

# Crear script de configuración Screen
cat > setup-screen-remote.sh << 'EOF'
#!/bin/bash
echo "🔧 Configurando Screen en el servidor..."

cd /home/u564887081/public_html

# Detener procesos existentes
pkill -f "node.*index.js" || true

# Crear script de inicio
cat > start-app.sh << 'STARTSCRIPT'
#!/bin/bash
cd /home/u564887081/public_html
export NODE_ENV=production
export PORT=3000
node start.js
STARTSCRIPT

chmod +x start-app.sh

# Crear sesión Screen
screen -dmS wepapp-control bash -c './start-app.sh'

echo "✅ Screen configurado correctamente"
echo "📋 Comandos útiles:"
echo "   screen -ls              - Ver sesiones"
echo "   screen -r wepapp-control - Conectar a sesión"
echo "   screen -S wepapp-control -X quit - Detener sesión"
echo "   pkill -f 'node.*index.js' - Detener aplicación"
EOF

chmod +x setup-screen-remote.sh

echo "📤 Subiendo script de configuración..."
rsync -avz -e "ssh -p $SSH_PORT" setup-screen-remote.sh $SSH_USER@$SSH_HOST:$SSH_PATH/

echo "🔧 Ejecutando configuración Screen..."
ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'EOF'
    cd /home/u564887081/public_html
    chmod +x setup-screen-remote.sh
    ./setup-screen-remote.sh
EOF

echo ""
echo "✅ ¡Screen configurado!"
echo "🌐 Tu aplicación ahora se ejecutará en una sesión persistente"
echo "🔄 Continuará ejecutándose aunque cierres la conexión SSH" 