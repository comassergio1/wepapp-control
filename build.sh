#!/bin/bash

echo "🚀 Construyendo aplicación para producción..."

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Construir la aplicación React
echo "🔨 Construyendo aplicación React..."
npm run build

# Crear directorio de uploads si no existe
echo "📁 Creando directorio de uploads..."
mkdir -p uploads

# Copiar archivos necesarios
echo "📋 Copiando archivos..."
cp -r database build/
cp -r server build/
cp production.env build/.env

# Crear archivo de inicio
echo "⚡ Creando archivo de inicio..."
cat > build/start.js << 'EOF'
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

echo "✅ Build completado en el directorio 'build'"
echo "📦 Contenido del build:"
ls -la build/ 