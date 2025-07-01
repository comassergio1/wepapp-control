#!/bin/bash

echo "🔍 Verificando estado del despliegue..."

# Leer configuración
SSH_USER=$(node -e "console.log(require('./hostinger-config.json').ssh.user)")
SSH_HOST=$(node -e "console.log(require('./hostinger-config.json').ssh.host)")
SSH_PORT=$(node -e "console.log(require('./hostinger-config.json').ssh.port)")
SSH_PATH=$(node -e "console.log(require('./hostinger-config.json').ssh.path)")

echo "👤 Usuario: $SSH_USER"
echo "🌐 Host: $SSH_HOST"
echo "🔌 Puerto: $SSH_PORT"
echo "📁 Ruta: $SSH_PATH"
echo ""

# Verificar conexión SSH
echo "🔗 Probando conexión SSH..."
if ssh -o ConnectTimeout=10 -p $SSH_PORT $SSH_USER@$SSH_HOST "echo 'Conexión exitosa'" 2>/dev/null; then
    echo "✅ Conexión SSH exitosa"
else
    echo "❌ Error de conexión SSH"
    exit 1
fi

echo ""
echo "📋 Verificando archivos en el servidor..."

# Verificar archivos principales
ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'EOF'
    cd /home/u564887081/public_html
    
    echo "📁 Archivos principales:"
    ls -la | head -10
    
    echo ""
    echo "📦 Verificando package.json:"
    if [ -f "package.json" ]; then
        echo "✅ package.json encontrado"
        cat package.json | grep -E "(name|version|main)"
    else
        echo "❌ package.json no encontrado"
    fi
    
    echo ""
    echo "🗄️ Verificando base de datos:"
    if [ -d "database" ]; then
        echo "✅ Directorio database encontrado"
        ls -la database/
    else
        echo "❌ Directorio database no encontrado"
    fi
    
    echo ""
    echo "⚙️ Verificando servidor:"
    if [ -d "server" ]; then
        echo "✅ Directorio server encontrado"
        ls -la server/
    else
        echo "❌ Directorio server no encontrado"
    fi
    
    echo ""
    echo "🌐 Verificando archivos estáticos:"
    if [ -f "index.html" ]; then
        echo "✅ index.html encontrado"
    else
        echo "❌ index.html no encontrado"
    fi
    
    echo ""
    echo "📊 Verificando Node.js:"
    if command -v node &> /dev/null; then
        echo "✅ Node.js instalado: $(node --version)"
    else
        echo "❌ Node.js no instalado"
    fi
    
    if command -v npm &> /dev/null; then
        echo "✅ npm instalado: $(npm --version)"
    else
        echo "❌ npm no instalado"
    fi
    
    echo ""
    echo "🚀 Verificando proceso de la aplicación:"
    if pgrep -f "node.*index.js" > /dev/null; then
        echo "✅ Aplicación corriendo"
        ps aux | grep "node.*index.js" | grep -v grep
    else
        echo "⚠️ Aplicación no está corriendo"
    fi
    
    echo ""
    echo "📝 Verificando logs:"
    if [ -d "logs" ]; then
        echo "✅ Directorio logs encontrado"
        ls -la logs/
        if [ -f "logs/app.log" ]; then
            echo "📋 Últimas líneas del log:"
            tail -5 logs/app.log
        fi
    else
        echo "❌ Directorio logs no encontrado"
    fi
EOF

echo ""
echo "✅ Verificación completada" 