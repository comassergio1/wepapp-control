#!/bin/bash

# Script para verificar el estado de los puertos de WepApp Control
# Autor: Sistema de Despliegue
# Fecha: $(date)

echo "🔍 Verificando puertos de WepApp Control..."
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
check_port_status() {
    local port=$1
    local description=$2
    
    echo -e "${BLUE}🔍 Verificando puerto $port ($description)...${NC}"
    
    # Verificar si el puerto está en uso
    if command_exists lsof; then
        if lsof -i :$port >/dev/null 2>&1; then
            local process=$(lsof -i :$port | grep LISTEN | head -1 | awk '{print $1}')
            local pid=$(lsof -i :$port | grep LISTEN | head -1 | awk '{print $2}')
            echo -e "${GREEN}✅ Puerto $port está en uso por $process (PID: $pid)${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  Puerto $port no está en uso${NC}"
            return 1
        fi
    elif command_exists netstat; then
        if netstat -tuln | grep ":$port " >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Puerto $port está abierto${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  Puerto $port no está abierto${NC}"
            return 1
        fi
    elif command_exists ss; then
        if ss -tuln | grep ":$port " >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Puerto $port está abierto${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  Puerto $port no está abierto${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ No se puede verificar el puerto (herramientas no disponibles)${NC}"
        return 1
    fi
}

# Función para verificar firewall en Linux
check_firewall_status() {
    echo -e "${BLUE}🔧 Verificando firewall...${NC}"
    
    if command_exists ufw; then
        echo -e "${GREEN}✅ UFW detectado${NC}"
        ufw status
    elif command_exists iptables; then
        echo -e "${GREEN}✅ iptables detectado${NC}"
        echo -e "${YELLOW}💡 Para ver reglas: sudo iptables -L${NC}"
    else
        echo -e "${YELLOW}⚠️  No se detectó firewall configurado${NC}"
    fi
}

# Función para hacer ping a un host
check_connectivity() {
    local host=$1
    local description=$2
    
    echo -e "${BLUE}🌐 Verificando conectividad con $host ($description)...${NC}"
    
    if ping -c 1 $host >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Conectividad exitosa con $host${NC}"
        return 0
    else
        echo -e "${RED}❌ Sin conectividad con $host${NC}"
        return 1
    fi
}

# Puertos a verificar (compatible con bash estándar)
PORTS_3000="Aplicación React (Producción)"
PORTS_3001="Servidor Express (Desarrollo)"
PORTS_65002="SSH (Hostinger)"

# Hosts a verificar (compatible con bash estándar)
HOSTS_localhost="Servidor local"
HOSTS_phoenixconsultora="Dominio de producción"
HOSTS_hostinger="Servidor Hostinger"

echo ""
echo "📋 Puertos a verificar:"
echo "   - Puerto 3000: $PORTS_3000"
echo "   - Puerto 3001: $PORTS_3001"
echo "   - Puerto 65002: $PORTS_65002"

echo ""
echo "🌐 Hosts a verificar:"
echo "   - localhost: $HOSTS_localhost"
echo "   - phoenixconsultora.online: $HOSTS_phoenixconsultora"
echo "   - 82.29.86.165: $HOSTS_hostinger"

echo ""
echo "=========================================="

# Verificar estado de los puertos
echo -e "${BLUE}🔍 Verificando puertos locales...${NC}"
echo ""

check_port_status 3000 "$PORTS_3000"
echo ""
check_port_status 3001 "$PORTS_3001"
echo ""
check_port_status 65002 "$PORTS_65002"
echo ""

# Verificar conectividad
echo -e "${BLUE}🌐 Verificando conectividad...${NC}"
echo ""

check_connectivity "localhost" "$HOSTS_localhost"
echo ""
check_connectivity "phoenixconsultora.online" "$HOSTS_phoenixconsultora"
echo ""
check_connectivity "82.29.86.165" "$HOSTS_hostinger"
echo ""

# Verificar firewall
echo -e "${BLUE}🔧 Verificando firewall...${NC}"
echo ""
check_firewall_status

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Verificación completada${NC}"
echo ""
echo -e "${BLUE}📝 Resumen:${NC}"
echo "   - Los puertos verdes están activos y funcionando"
echo "   - Los puertos amarillos no están en uso (normal si la app no está corriendo)"
echo "   - Los hosts verdes tienen conectividad"
echo ""
echo -e "${YELLOW}💡 Para iniciar la aplicación:${NC}"
echo "   - Desarrollo: cd wepapp-control && npm run dev"
echo "   - Producción: cd wepapp-control && npm run server"
echo ""
echo -e "${BLUE}🔗 URLs de acceso:${NC}"
echo "   - Local: http://localhost:3000"
echo "   - Servidor: http://localhost:3001"
echo "   - Hostinger: https://phoenixconsultora.online" 