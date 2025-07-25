#!/bin/bash

echo "🚀 Desplegando WepApp Control en servidor SSH..."

# Configuración del servidor
SSH_USER="root"
SSH_HOST="31.97.243.174"
SSH_PORT="22"
SSH_PATH="/var/www/html"
SERVER_PASS="v02x4uqjGjjDUj4Cx/Y4"

echo "✅ Configuración cargada:"
echo "   Usuario: $SSH_USER"
echo "   Host: $SSH_HOST"
echo "   Puerto: $SSH_PORT"
echo "   Ruta: $SSH_PATH"

# Construir la aplicación
echo ""
echo "📦 Construyendo aplicación..."
./build.sh

if [ $? -ne 0 ]; then
    echo "❌ Error en el build"
    exit 1
fi

# Crear directorio temporal para el deployment
echo "📁 Preparando archivos..."
mkdir -p deployment
cp -r build/* deployment/
cp package.production.json deployment/package.json

# Crear script de instalación remota
cat > deployment/install.sh << 'EOF'
#!/bin/bash
echo "🔧 Instalando en el servidor..."

# Instalar Node.js si no está instalado
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install --production

# Crear directorios necesarios
mkdir -p logs
mkdir -p uploads/comprobantes
mkdir -p database

# Configurar permisos
chmod 755 database/
chmod 755 uploads/
chmod 755 uploads/comprobantes/

# Verificar Node.js
echo "📋 Versiones instaladas:"
node --version
npm --version

echo "✅ Instalación completada"
EOF

chmod +x deployment/install.sh

# Crear archivo de inicio
cat > deployment/start.js << 'EOF'
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando aplicación...');

// Iniciar el servidor
const server = spawn('node', ['server/index.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

server.on('error', (error) => {
  console.error('❌ Error iniciando servidor:', error);
});

server.on('exit', (code) => {
  console.log(`📴 Servidor terminado con código: ${code}`);
});
EOF

# Crear script de servicio systemd
cat > deployment/wepapp-control.service << 'EOF'
[Unit]
Description=WepApp Control
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/html
ExecStart=/usr/bin/node start.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

echo "📤 Subiendo archivos al servidor..."
sshpass -p "$SERVER_PASS" rsync -avz --delete -e "ssh -p $SSH_PORT" deployment/ $SSH_USER@$SSH_HOST:$SSH_PATH/

if [ $? -ne 0 ]; then
    echo "❌ Error subiendo archivos"
    echo "🔍 Verifica las credenciales SSH"
    exit 1
fi

echo "🔧 Ejecutando instalación remota..."
sshpass -p "$SERVER_PASS" ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'EOF'
    cd /var/www/html
    chmod +x install.sh
    ./install.sh
    
    # Configurar servicio systemd
    cp wepapp-control.service /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable wepapp-control
    systemctl start wepapp-control
    
    # Verificar que la aplicación esté corriendo
    echo "🔍 Verificando estado de la aplicación..."
    if systemctl is-active --quiet wepapp-control; then
        echo "✅ Aplicación corriendo como servicio"
    else
        echo "⚠️  Aplicación no está corriendo como servicio"
        echo "🚀 Iniciando aplicación manualmente..."
        nohup node start.js > logs/app.log 2>&1 &
    fi
    
    # Mostrar logs
    echo "📋 Últimos logs:"
    tail -n 10 logs/app.log
EOF

echo ""
echo "✅ ¡Despliegue completado!"
echo "🌐 Tu aplicación estará disponible en: http://$SSH_HOST:3000"
echo ""
echo "📋 Comandos útiles:"
echo "   Ver logs: sshpass -p '$SERVER_PASS' ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'tail -f $SSH_PATH/logs/app.log'"
echo "   Reiniciar: sshpass -p '$SERVER_PASS' ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'systemctl restart wepapp-control'"
echo "   Estado: sshpass -p '$SERVER_PASS' ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'systemctl status wepapp-control'" 