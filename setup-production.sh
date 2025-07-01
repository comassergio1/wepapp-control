#!/bin/bash

# Script para configurar WepApp Control en producción (Hostinger)
# Autor: Sistema de Despliegue
# Fecha: $(date)

echo "🚀 Configurando WepApp Control para producción..."
echo "================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Cargar configuración
if [ -f "hostinger-config.json" ]; then
    SSH_USER=$(grep -o '"user": "[^"]*"' hostinger-config.json | cut -d'"' -f4)
    SSH_HOST=$(grep -o '"host": "[^"]*"' hostinger-config.json | cut -d'"' -f4)
    SSH_PORT=$(grep -A2 '"ssh"' hostinger-config.json | grep '"port"' | cut -d' ' -f2 | tr -d ',')
    SSH_PATH=$(grep -o '"path": "[^"]*"' hostinger-config.json | cut -d'"' -f4)
    DOMAIN=$(grep -o '"domain": "[^"]*"' hostinger-config.json | cut -d'"' -f4)
    APP_PORT=$(grep -A2 '"nodejs"' hostinger-config.json | grep '"port"' | cut -d' ' -f2 | tr -d ',')
else
    echo -e "${RED}❌ Error: No se encontró hostinger-config.json${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Configuración detectada:${NC}"
echo "   - Usuario SSH: $SSH_USER"
echo "   - Host: $SSH_HOST"
echo "   - Puerto SSH: $SSH_PORT"
echo "   - Ruta: $SSH_PATH"
echo "   - Dominio: $DOMAIN"
echo "   - Puerto App: $APP_PORT"

# Función para ejecutar comando SSH
run_ssh() {
    local command="$1"
    ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "$command"
}

# Función para verificar conexión SSH
check_ssh_connection() {
    echo -e "${BLUE}🔍 Verificando conexión SSH...${NC}"
    
    if run_ssh "echo 'Conexión SSH exitosa'" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Conexión SSH establecida${NC}"
        return 0
    else
        echo -e "${RED}❌ Error conectando por SSH${NC}"
        return 1
    fi
}

# Función para instalar PM2 en el servidor
install_pm2() {
    echo -e "${BLUE}📦 Instalando PM2 en el servidor...${NC}"
    
    # Verificar si PM2 ya está instalado
    if run_ssh "which pm2" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  PM2 ya está instalado${NC}"
        return 0
    fi
    
    # Instalar PM2 globalmente
    if run_ssh "npm install -g pm2"; then
        echo -e "${GREEN}✅ PM2 instalado correctamente${NC}"
        return 0
    else
        echo -e "${RED}❌ Error instalando PM2${NC}"
        return 1
    fi
}

# Función para configurar la aplicación
setup_application() {
    echo -e "${BLUE}🔧 Configurando aplicación en el servidor...${NC}"
    
    # Crear directorio de logs si no existe
    run_ssh "mkdir -p $SSH_PATH/logs"
    
    # Crear directorio de uploads si no existe
    run_ssh "mkdir -p $SSH_PATH/uploads/comprobantes"
    
    # Verificar que la base de datos existe
    if ! run_ssh "test -f $SSH_PATH/database/wepapp_control.db"; then
        echo -e "${YELLOW}⚠️  Base de datos no encontrada. Configurando...${NC}"
        run_ssh "cd $SSH_PATH && node database/setup.js"
    fi
    
    echo -e "${GREEN}✅ Aplicación configurada${NC}"
}

# Función para configurar PM2
setup_pm2() {
    echo -e "${BLUE}⚙️  Configurando PM2...${NC}"
    
    # Detener proceso existente si existe
    run_ssh "pm2 stop wepapp-control 2>/dev/null || true"
    run_ssh "pm2 delete wepapp-control 2>/dev/null || true"
    
    # Iniciar con PM2
    if run_ssh "cd $SSH_PATH && pm2 start ecosystem.config.js"; then
        echo -e "${GREEN}✅ PM2 configurado correctamente${NC}"
        
        # Guardar configuración de PM2
        run_ssh "pm2 save"
        
        # Configurar PM2 para iniciar automáticamente
        run_ssh "pm2 startup"
        
        return 0
    else
        echo -e "${RED}❌ Error configurando PM2${NC}"
        return 1
    fi
}

# Función para verificar el estado
check_status() {
    echo -e "${BLUE}🔍 Verificando estado de la aplicación...${NC}"
    
    # Verificar estado de PM2
    echo -e "${BLUE}📊 Estado de PM2:${NC}"
    run_ssh "pm2 status"
    
    # Verificar puertos
    echo -e "${BLUE}🔌 Puertos en uso:${NC}"
    run_ssh "netstat -tuln | grep :$APP_PORT || echo 'Puerto $APP_PORT no está en uso'"
    
    # Verificar logs
    echo -e "${BLUE}📝 Últimas líneas de log:${NC}"
    run_ssh "tail -10 $SSH_PATH/logs/combined.log 2>/dev/null || echo 'No hay logs disponibles'"
}

# Función para mostrar URLs de acceso
show_access_info() {
    echo ""
    echo -e "${GREEN}🎉 Configuración completada${NC}"
    echo "================================================"
    echo -e "${BLUE}🔗 URLs de acceso:${NC}"
    echo "   - Aplicación: https://$DOMAIN"
    echo "   - API: https://$DOMAIN/api"
    echo ""
    echo -e "${BLUE}📊 Monitoreo:${NC}"
    echo "   - Estado PM2: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 status'"
    echo "   - Logs: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 logs wepapp-control'"
    echo ""
    echo -e "${BLUE}🛠️  Comandos útiles:${NC}"
    echo "   - Reiniciar: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 restart wepapp-control'"
    echo "   - Detener: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 stop wepapp-control'"
    echo "   - Iniciar: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 start wepapp-control'"
}

# Función principal
main() {
    echo -e "${BLUE}🚀 Iniciando configuración de producción...${NC}"
    
    # Verificar conexión SSH
    if ! check_ssh_connection; then
        echo -e "${RED}❌ No se pudo establecer conexión SSH${NC}"
        echo -e "${YELLOW}💡 Verifica:${NC}"
        echo "   - Credenciales SSH correctas"
        echo "   - Puerto SSH: $SSH_PORT"
        echo "   - Host: $SSH_HOST"
        exit 1
    fi
    
    # Instalar PM2
    if ! install_pm2; then
        echo -e "${RED}❌ Error instalando PM2${NC}"
        exit 1
    fi
    
    # Configurar aplicación
    setup_application
    
    # Configurar PM2
    if ! setup_pm2; then
        echo -e "${RED}❌ Error configurando PM2${NC}"
        exit 1
    fi
    
    # Verificar estado
    check_status
    
    # Mostrar información de acceso
    show_access_info
}

# Ejecutar función principal
main 