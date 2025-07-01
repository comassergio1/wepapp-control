#!/bin/bash

# Script para abrir puertos necesarios para WepApp Control
# Autor: Sistema de Despliegue
# Fecha: $(date)

echo "🔓 Abriendo puertos para WepApp Control..."
echo "=========================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para verificar si el comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Función para verificar si un puerto está abierto
check_port() {
    local port=$1
    if command_exists netstat; then
        netstat -tuln | grep ":$port " >/dev/null 2>&1
    elif command_exists ss; then
        ss -tuln | grep ":$port " >/dev/null 2>&1
    else
        return 1
    fi
}

# Función para abrir puerto con ufw
open_port_ufw() {
    local port=$1
    local description=$2
    
    echo -e "${BLUE}🔧 Configurando puerto $port para $description...${NC}"
    
    if command_exists ufw; then
        if ufw status | grep -q "Status: active"; then
            if ufw status | grep -q "$port"; then
                echo -e "${YELLOW}⚠️  Puerto $port ya está abierto en UFW${NC}"
            else
                ufw allow $port/tcp
                echo -e "${GREEN}✅ Puerto $port abierto en UFW${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  UFW no está activo. Activando...${NC}"
            ufw --force enable
            ufw allow $port/tcp
            echo -e "${GREEN}✅ UFW activado y puerto $port abierto${NC}"
        fi
    else
        echo -e "${RED}❌ UFW no está instalado${NC}"
        return 1
    fi
}

# Función para abrir puerto con iptables
open_port_iptables() {
    local port=$1
    local description=$2
    
    echo -e "${BLUE}🔧 Configurando puerto $port para $description con iptables...${NC}"
    
    if command_exists iptables; then
        # Verificar si la regla ya existe
        if iptables -C INPUT -p tcp --dport $port -j ACCEPT 2>/dev/null; then
            echo -e "${YELLOW}⚠️  Puerto $port ya está abierto en iptables${NC}"
        else
            iptables -A INPUT -p tcp --dport $port -j ACCEPT
            echo -e "${GREEN}✅ Puerto $port abierto en iptables${NC}"
        fi
    else
        echo -e "${RED}❌ iptables no está disponible${NC}"
        return 1
    fi
}

# Función para verificar puerto en macOS
open_port_macos() {
    local port=$1
    local description=$2
    
    echo -e "${BLUE}🔧 Configurando puerto $port para $description en macOS...${NC}"
    
    # Verificar si el puerto ya está abierto
    if lsof -i :$port >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Puerto $port ya está en uso${NC}"
    else
        echo -e "${GREEN}✅ Puerto $port está disponible en macOS${NC}"
    fi
}

# Detectar el sistema operativo
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${BLUE}🍎 Detectado macOS${NC}"
    SYSTEM="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo -e "${BLUE}🐧 Detectado Linux${NC}"
    SYSTEM="linux"
else
    echo -e "${RED}❌ Sistema operativo no soportado: $OSTYPE${NC}"
    exit 1
fi

# Puertos a abrir (compatible con bash estándar)
PORTS_3000="Aplicación React (Producción)"
PORTS_3001="Servidor Express (Desarrollo)"
PORTS_65002="SSH (Hostinger)"

echo ""
echo "📋 Puertos a configurar:"
echo "   - Puerto 3000: $PORTS_3000"
echo "   - Puerto 3001: $PORTS_3001"
echo "   - Puerto 65002: $PORTS_65002"
echo ""

# Abrir puertos según el sistema operativo
if [[ "$SYSTEM" == "linux" ]]; then
    echo -e "${BLUE}🔧 Configurando firewall en Linux...${NC}"
    
    # Intentar con UFW primero
    if command_exists ufw; then
        echo -e "${GREEN}✅ UFW detectado${NC}"
        open_port_ufw 3000 "$PORTS_3000"
        open_port_ufw 3001 "$PORTS_3001"
        open_port_ufw 65002 "$PORTS_65002"
    # Fallback a iptables
    elif command_exists iptables; then
        echo -e "${GREEN}✅ iptables detectado${NC}"
        open_port_iptables 3000 "$PORTS_3000"
        open_port_iptables 3001 "$PORTS_3001"
        open_port_iptables 65002 "$PORTS_65002"
    else
        echo -e "${RED}❌ No se encontró firewall configurado${NC}"
        echo -e "${YELLOW}💡 Instala UFW: sudo apt-get install ufw${NC}"
    fi
    
elif [[ "$SYSTEM" == "macos" ]]; then
    echo -e "${BLUE}🔧 Configurando puertos en macOS...${NC}"
    
    open_port_macos 3000 "$PORTS_3000"
    open_port_macos 3001 "$PORTS_3001"
    open_port_macos 65002 "$PORTS_65002"
    
    echo -e "${YELLOW}💡 En macOS, los puertos se abren automáticamente cuando la aplicación los usa${NC}"
fi

echo ""
echo -e "${GREEN}🔍 Verificando puertos...${NC}"
echo "=========================================="

# Verificar estado de los puertos
if check_port 3000; then
    echo -e "${GREEN}✅ Puerto 3000 está abierto${NC}"
else
    echo -e "${YELLOW}⚠️  Puerto 3000 no está activo (puede estar bien si la app no está corriendo)${NC}"
fi

if check_port 3001; then
    echo -e "${GREEN}✅ Puerto 3001 está abierto${NC}"
else
    echo -e "${YELLOW}⚠️  Puerto 3001 no está activo (puede estar bien si la app no está corriendo)${NC}"
fi

if check_port 65002; then
    echo -e "${GREEN}✅ Puerto 65002 está abierto${NC}"
else
    echo -e "${YELLOW}⚠️  Puerto 65002 no está activo (puede estar bien si la app no está corriendo)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Configuración de puertos completada${NC}"
echo ""
echo -e "${BLUE}📝 Información adicional:${NC}"
echo "   - Puerto 3000: Para la aplicación en producción"
echo "   - Puerto 3001: Para el servidor de desarrollo"
echo "   - Puerto 65002: Para conexiones SSH a Hostinger"
echo ""
echo -e "${YELLOW}💡 Para iniciar la aplicación:${NC}"
echo "   - Desarrollo: npm run dev"
echo "   - Producción: npm run server"
echo ""
echo -e "${BLUE}🔗 URLs de acceso:${NC}"
echo "   - Local: http://localhost:3000"
echo "   - Servidor: http://localhost:3001"
echo "   - Hostinger: https://phoenixconsultora.online" 