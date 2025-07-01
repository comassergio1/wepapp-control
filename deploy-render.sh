#!/bin/bash

# 🚀 Script de Despliegue para Render.com
# Autor: WepApp Control
# Fecha: $(date)

echo "🚀 Iniciando despliegue en Render.com..."
echo "========================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Asegúrate de estar en el directorio wepapp-control"
    exit 1
fi

print_status "Verificando configuración..."

# Verificar archivos necesarios
required_files=("render.yaml" "server/index.js" "package.json")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Archivo requerido no encontrado: $file"
        exit 1
    fi
done

print_success "Todos los archivos de configuración están presentes"

# Verificar si git está inicializado
if [ ! -d ".git" ]; then
    print_warning "Git no está inicializado. Inicializando..."
    git init
    git add .
    git commit -m "Configuración inicial para Render"
    print_success "Git inicializado"
else
    print_status "Git ya está inicializado"
fi

# Verificar dependencias
print_status "Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    print_warning "node_modules no encontrado. Instalando dependencias..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencias instaladas correctamente"
    else
        print_error "Error instalando dependencias"
        exit 1
    fi
else
    print_success "Dependencias ya están instaladas"
fi

# Probar build localmente
print_status "Probando build localmente..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Build exitoso"
else
    print_error "Error en el build. Revisa los errores arriba"
    exit 1
fi

# Verificar que el servidor puede iniciar
print_status "Probando inicio del servidor..."
print_warning "Omitiendo prueba del servidor en macOS (timeout no disponible)"
print_status "El servidor se probará durante el despliegue en Render"

echo ""
echo "🎉 ¡Todo listo para desplegar en Render!"
echo "========================================"
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. 🌐 Ve a https://render.com"
echo "2. 📝 Regístrate con tu cuenta de GitHub"
echo "3. ➕ Click en 'New +' → 'Web Service'"
echo "4. 🔗 Conecta tu repositorio de GitHub"
echo "5. ⚙️  Configura:"
echo "   - Name: wepapp-control"
echo "   - Environment: Node"
echo "   - Build Command: npm install && npm run build"
echo "   - Start Command: npm start"
echo "   - Plan: Free"
echo "6. 🔧 Variables de entorno:"
echo "   - NODE_ENV = production"
echo "   - PORT = 10000"
echo "7. 🚀 Click en 'Create Web Service'"
echo ""
echo "⏱️  El despliegue tomará 5-10 minutos"
echo "🌍 Tu app estará disponible en: https://wepapp-control.onrender.com"
echo ""
echo "📚 Para más detalles, consulta: RENDER-SETUP.md"
echo ""
print_success "¡Configuración completada exitosamente!" 