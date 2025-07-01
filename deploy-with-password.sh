#!/bin/bash

echo "🚀 Desplegando WepApp Control en Hostinger (con contraseña)..."

# Verificar si existe el archivo de configuración
if [ ! -f "hostinger-config.json" ]; then
    echo "❌ Error: No se encontró hostinger-config.json"
    exit 1
fi

# Leer configuración
SSH_USER=$(node -e "console.log(require('./hostinger-config.json').ssh.user)")
SSH_HOST=$(node -e "console.log(require('./hostinger-config.json').ssh.host)")
SSH_PORT=$(node -e "console.log(require('./hostinger-config.json').ssh.port)")
SSH_PATH=$(node -e "console.log(require('./hostinger-config.json').ssh.path)")
DOMAIN=$(node -e "console.log(require('./hostinger-config.json').domain)")

# Contraseña SSH
SSH_PASSWORD="NqUyA&2tGM-$8F*"

echo "✅ Configuración cargada:"
echo "   Usuario: $SSH_USER"
echo "   Host: $SSH_HOST"
echo "   Puerto: $SSH_PORT"
echo "   Ruta: $SSH_PATH"
echo "   Dominio: $DOMAIN"

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
cp hostinger-config.json deployment/

# Crear script de instalación remota
cat > deployment/install.sh << 'EOF'
#!/bin/bash
echo "🔧 Instalando en el servidor..."

# Instalar dependencias
npm install --production

# Crear directorios necesarios
mkdir -p logs
mkdir -p uploads/comprobantes

# Configurar permisos
chmod 755 database/
chmod 644 database/*.db
chmod 755 uploads/
chmod 755 uploads/comprobantes/

# Verificar Node.js
echo "📋 Versiones instaladas:"
node --version
npm --version

echo "✅ Instalación completada"
EOF

chmod +x deployment/install.sh

# Crear archivo .htaccess para redirección
cat > deployment/.htaccess << 'EOF'
RewriteEngine On

# Redirigir todas las peticiones a index.html excepto archivos estáticos
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [QSA,L]

# Configurar headers de seguridad
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
EOF

echo "📤 Subiendo archivos al servidor..."

# Usar expect para manejar la contraseña automáticamente
expect << EOF
spawn rsync -avz --delete -e "ssh -p $SSH_PORT" deployment/ $SSH_USER@$SSH_HOST:$SSH_PATH/
expect "password:"
send "$SSH_PASSWORD\r"
expect eof
EOF

if [ $? -ne 0 ]; then
    echo "❌ Error subiendo archivos"
    exit 1
fi

echo "🔧 Ejecutando instalación remota..."

# Usar expect para la instalación remota
expect << EOF
spawn ssh -p $SSH_PORT $SSH_USER@$SSH_HOST
expect "password:"
send "$SSH_PASSWORD\r"
expect "$ "
send "cd /home/u564887081/public_html\r"
expect "$ "
send "chmod +x install.sh\r"
expect "$ "
send "./install.sh\r"
expect "$ "
send "echo 'Verificando estado de la aplicación...'\r"
expect "$ "
send "if pgrep -f 'node.*index.js' > /dev/null; then echo 'Aplicación corriendo'; else echo 'Iniciando aplicación...'; nohup node start.js > logs/app.log 2>&1 &; fi\r"
expect "$ "
send "exit\r"
expect eof
EOF

echo ""
echo "✅ ¡Despliegue completado!"
echo "🌐 Tu aplicación estará disponible en: https://$DOMAIN"
echo ""
echo "📋 Próximos pasos:"
echo "1. Verifica que Node.js esté habilitado en tu panel de Hostinger"
echo "2. Configura el dominio para que apunte a tu aplicación"
echo "3. Accede con: admin@empresa.com / admin123"
echo ""
echo "🔧 Para verificar el estado:"
echo "   ./check-deployment.sh" 