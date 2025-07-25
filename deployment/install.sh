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
