#!/bin/bash

echo "🚀 Desplegando WepApp Control en Hostinger..."

# Verificar si existe el archivo de configuración
if [ ! -f "hostinger-config.json" ]; then
    echo "❌ Error: No se encontró hostinger-config.json"
    echo "📝 Crea el archivo con tus credenciales de Hostinger"
    exit 1
fi

# Leer configuración
SSH_USER=$(node -e "console.log(require('./hostinger-config.json').ssh.user)")
SSH_HOST=$(node -e "console.log(require('./hostinger-config.json').ssh.host)")
SSH_PORT=$(node -e "console.log(require('./hostinger-config.json').ssh.port)")
SSH_PATH=$(node -e "console.log(require('./hostinger-config.json').ssh.path)")
DOMAIN=$(node -e "console.log(require('./hostinger-config.json').domain)")

# Verificar si las credenciales están configuradas
if [ "$SSH_USER" = "TU_USUARIO_AQUI" ]; then
    echo "❌ ERROR: Debes configurar tus credenciales en hostinger-config.json"
    echo "📝 Edita el archivo y reemplaza 'TU_USUARIO_AQUI' con tu usuario real"
    exit 1
fi

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
rsync -avz --delete -e "ssh -p $SSH_PORT" deployment/ $SSH_USER@$SSH_HOST:$SSH_PATH/

if [ $? -ne 0 ]; then
    echo "❌ Error subiendo archivos"
    echo "🔍 Verifica las credenciales SSH en hostinger-config.json"
    exit 1
fi

echo "🔧 Ejecutando instalación remota..."
ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'EOF'
    cd /home/u564887081/public_html
    chmod +x install.sh
    ./install.sh
    
    # Verificar que la aplicación esté corriendo
    echo "🔍 Verificando estado de la aplicación..."
    if pgrep -f "node.*index.js" > /dev/null; then
        echo "✅ Aplicación corriendo"
    else
        echo "⚠️  Aplicación no está corriendo"
        echo "🚀 Iniciando aplicación..."
        nohup node start.js > logs/app.log 2>&1 &
    fi
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
echo "🔧 Comandos útiles:"
echo "   Ver logs: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'tail -f $SSH_PATH/logs/app.log'"
echo "   Reiniciar: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'cd $SSH_PATH && pkill -f node && nohup node start.js > logs/app.log 2>&1 &'" 