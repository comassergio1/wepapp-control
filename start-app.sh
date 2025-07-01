#!/bin/bash

# Script para iniciar WepApp Control y verificar puertos
# Autor: Sistema de Despliegue
# Fecha: $(date)

echo "🚀 Iniciando WepApp Control..."
echo "=============================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para verificar si un puerto está en uso
check_port_in_use() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Función para esperar a que un puerto esté disponible
wait_for_port() {
    local port=$1
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}⏳ Esperando a que el puerto $port esté disponible...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if check_port_in_use $port; then
            echo -e "${GREEN}✅ Puerto $port está activo${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ Puerto $port no se activó después de $max_attempts intentos${NC}"
    return 1
}

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No se encontró package.json${NC}"
    echo -e "${YELLOW}💡 Asegúrate de estar en el directorio wepapp-control${NC}"
    exit 1
fi

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules no encontrado. Instalando dependencias...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error instalando dependencias${NC}"
        exit 1
    fi
fi

# Verificar si la base de datos existe
if [ ! -f "database/wepapp_control.db" ]; then
    echo -e "${YELLOW}⚠️  Base de datos no encontrada. Configurando...${NC}"
    npm run db:setup
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error configurando la base de datos${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}🔧 Verificando puertos antes de iniciar...${NC}"

# Verificar si los puertos ya están en uso
if check_port_in_use 3000; then
    echo -e "${YELLOW}⚠️  Puerto 3000 ya está en uso${NC}"
    lsof -i :3000
fi

if check_port_in_use 3001; then
    echo -e "${YELLOW}⚠️  Puerto 3001 ya está en uso${NC}"
    lsof -i :3001
fi

echo ""
echo -e "${BLUE}🎯 Selecciona el modo de ejecución:${NC}"
echo "1) Desarrollo (React + Servidor)"
echo "2) Solo Servidor (Producción)"
echo "3) Solo React (Frontend)"
echo "4) Verificar estado actual"

read -p "Selecciona una opción (1-4): " choice

case $choice in
    1)
        echo -e "${GREEN}🚀 Iniciando en modo desarrollo...${NC}"
        echo -e "${BLUE}📝 Esto iniciará tanto el servidor (puerto 3001) como React (puerto 3000)${NC}"
        
        # Iniciar en modo desarrollo
        npm run dev &
        DEV_PID=$!
        
        echo -e "${BLUE}⏳ Esperando a que los servicios se inicien...${NC}"
        
        # Esperar a que los puertos estén disponibles
        if wait_for_port 3001; then
            echo -e "${GREEN}✅ Servidor iniciado en puerto 3001${NC}"
        fi
        
        if wait_for_port 3000; then
            echo -e "${GREEN}✅ React iniciado en puerto 3000${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}🎉 Aplicación iniciada en modo desarrollo${NC}"
        echo -e "${BLUE}🔗 URLs de acceso:${NC}"
        echo "   - Frontend: http://localhost:3000"
        echo "   - API: http://localhost:3001"
        echo ""
        echo -e "${YELLOW}💡 Para detener: presiona Ctrl+C${NC}"
        
        # Mantener el script corriendo
        wait $DEV_PID
        ;;
        
    2)
        echo -e "${GREEN}🚀 Iniciando solo el servidor...${NC}"
        echo -e "${BLUE}📝 Esto iniciará solo el servidor Express en puerto 3001${NC}"
        
        # Iniciar solo el servidor
        npm run server &
        SERVER_PID=$!
        
        if wait_for_port 3001; then
            echo -e "${GREEN}✅ Servidor iniciado en puerto 3001${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}🎉 Servidor iniciado${NC}"
        echo -e "${BLUE}🔗 URL de acceso:${NC}"
        echo "   - API: http://localhost:3001"
        echo ""
        echo -e "${YELLOW}💡 Para detener: presiona Ctrl+C${NC}"
        
        wait $SERVER_PID
        ;;
        
    3)
        echo -e "${GREEN}🚀 Iniciando solo React...${NC}"
        echo -e "${BLUE}📝 Esto iniciará solo React en puerto 3000${NC}"
        
        # Iniciar solo React
        npm start &
        REACT_PID=$!
        
        if wait_for_port 3000; then
            echo -e "${GREEN}✅ React iniciado en puerto 3000${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}🎉 React iniciado${NC}"
        echo -e "${BLUE}🔗 URL de acceso:${NC}"
        echo "   - Frontend: http://localhost:3000"
        echo ""
        echo -e "${YELLOW}💡 Para detener: presiona Ctrl+C${NC}"
        
        wait $REACT_PID
        ;;
        
    4)
        echo -e "${BLUE}🔍 Verificando estado actual...${NC}"
        echo ""
        
        if check_port_in_use 3000; then
            echo -e "${GREEN}✅ Puerto 3000 está activo${NC}"
            lsof -i :3000
        else
            echo -e "${YELLOW}⚠️  Puerto 3000 no está activo${NC}"
        fi
        
        echo ""
        
        if check_port_in_use 3001; then
            echo -e "${GREEN}✅ Puerto 3001 está activo${NC}"
            lsof -i :3001
        else
            echo -e "${YELLOW}⚠️  Puerto 3001 no está activo${NC}"
        fi
        
        echo ""
        echo -e "${BLUE}📝 Para iniciar la aplicación:${NC}"
        echo "   - Desarrollo: npm run dev"
        echo "   - Solo servidor: npm run server"
        echo "   - Solo React: npm start"
        ;;
        
    *)
        echo -e "${RED}❌ Opción inválida${NC}"
        exit 1
        ;;
esac 