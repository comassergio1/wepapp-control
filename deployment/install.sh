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
