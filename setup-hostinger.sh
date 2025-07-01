#!/bin/bash

echo "🚀 Configurando WepApp Control en Hostinger..."
echo "🌐 Dominio: phoenixconsultora.online"

# Variables de configuración
DOMAIN="phoenixconsultora.online"
REMOTE_USER="TU_USUARIO_AQUI"
REMOTE_HOST="phoenixconsultora.online"
REMOTE_PATH="/home/$REMOTE_USER/public_html"

echo ""
echo "📋 PASOS A SEGUIR:"
echo "1. Reemplaza 'TU_USUARIO_AQUI' con tu usuario real de Hostinger"
echo "2. Ejecuta: chmod +x setup-hostinger.sh"
echo "3. Ejecuta: ./setup-hostinger.sh"
echo ""

# Verificar si las credenciales están configuradas
if [ "$REMOTE_USER" = "TU_USUARIO_AQUI" ]; then
    echo "❌ ERROR: Debes configurar tu usuario de Hostinger en este script"
    echo "📝 Edita el archivo y cambia 'TU_USUARIO_AQUI' por tu usuario real"
    exit 1
fi

echo "✅ Credenciales configuradas"
echo "🔗 Conectando a $REMOTE_HOST..."

# Construir la aplicación
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

# Instalar dependencias
npm install --production

# Crear directorios necesarios
mkdir -p logs
mkdir -p uploads

# Configurar permisos
chmod 755 database/
chmod 644 database/*.db
chmod 755 uploads/

# Verificar Node.js
node --version
npm --version

echo "✅ Instalación completada"
EOF

chmod +x deployment/install.sh

echo "📤 Subiendo archivos al servidor..."
rsync -avz --delete deployment/ $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

if [ $? -ne 0 ]; then
    echo "❌ Error subiendo archivos"
    echo "🔍 Verifica las credenciales SSH"
    exit 1
fi

echo "🔧 Ejecutando instalación remota..."
ssh $REMOTE_USER@$REMOTE_HOST << 'EOF'
    cd /home/$REMOTE_USER/public_html
    chmod +x install.sh
    ./install.sh
EOF

echo ""
echo "✅ ¡Configuración completada!"
echo "🌐 Tu aplicación estará disponible en: https://phoenixconsultora.online"
echo ""
echo "📋 Próximos pasos:"
echo "1. Verifica que Node.js esté habilitado en tu panel de Hostinger"
echo "2. Configura el dominio para que apunte a tu aplicación"
echo "3. Accede con: admin@empresa.com / admin123" 