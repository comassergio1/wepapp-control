#!/bin/bash

# Script corregido para configurar WepApp Control en producción (Hostinger)
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

# Configuración hardcodeada
SSH_USER="u564887081"
SSH_HOST="82.29.86.165"
SSH_PORT="65002"
SSH_PATH="/home/u564887081/public_html"
DOMAIN="phoenixconsultora.online"
APP_PORT="3000"

echo -e "${BLUE}📋 Configuración:${NC}"
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

# Función para verificar Node.js y npm
check_node_availability() {
    echo -e "${BLUE}🔍 Verificando Node.js y npm...${NC}"
    
    # Verificar Node.js
    if run_ssh "which node" >/dev/null 2>&1; then
        local node_version=$(run_ssh "node --version")
        echo -e "${GREEN}✅ Node.js disponible: $node_version${NC}"
    else
        echo -e "${RED}❌ Node.js no está disponible${NC}"
        return 1
    fi
    
    # Verificar npm
    if run_ssh "which npm" >/dev/null 2>&1; then
        local npm_version=$(run_ssh "npm --version")
        echo -e "${GREEN}✅ npm disponible: $npm_version${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  npm no está disponible, intentando alternativas...${NC}"
        return 1
    fi
}

# Función para instalar PM2 usando diferentes métodos
install_pm2() {
    echo -e "${BLUE}📦 Instalando PM2 en el servidor...${NC}"
    
    # Verificar si PM2 ya está instalado
    if run_ssh "which pm2" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  PM2 ya está instalado${NC}"
        return 0
    fi
    
    # Método 1: Usar npm si está disponible
    if run_ssh "which npm" >/dev/null 2>&1; then
        echo -e "${BLUE}📦 Instalando PM2 con npm...${NC}"
        if run_ssh "npm install -g pm2"; then
            echo -e "${GREEN}✅ PM2 instalado correctamente con npm${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  Error con npm, intentando método alternativo...${NC}"
        fi
    fi
    
    # Método 2: Usar npx si está disponible
    if run_ssh "which npx" >/dev/null 2>&1; then
        echo -e "${BLUE}📦 Instalando PM2 con npx...${NC}"
        if run_ssh "npx pm2 --version" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ PM2 disponible a través de npx${NC}"
            return 0
        fi
    fi
    
    # Método 3: Instalación manual con curl
    echo -e "${BLUE}📦 Instalando PM2 manualmente...${NC}"
    if run_ssh "curl -fsSL https://get.pm2.io/install.sh | bash"; then
        echo -e "${GREEN}✅ PM2 instalado manualmente${NC}"
        return 0
    fi
    
    # Método 4: Usar screen como alternativa
    echo -e "${YELLOW}⚠️  No se pudo instalar PM2, usando screen como alternativa...${NC}"
    if run_ssh "which screen" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Screen disponible como alternativa${NC}"
        return 0
    else
        echo -e "${RED}❌ No se encontró PM2 ni screen${NC}"
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

# Función para configurar PM2 o screen
setup_process_manager() {
    echo -e "${BLUE}⚙️  Configurando gestor de procesos...${NC}"
    
    # Detener proceso existente si existe
    run_ssh "pm2 stop wepapp-control 2>/dev/null || true"
    run_ssh "pm2 delete wepapp-control 2>/dev/null || true"
    
    # Intentar usar PM2
    if run_ssh "which pm2" >/dev/null 2>&1; then
        echo -e "${BLUE}🚀 Iniciando con PM2...${NC}"
        if run_ssh "cd $SSH_PATH && pm2 start ecosystem.config.js"; then
            echo -e "${GREEN}✅ PM2 configurado correctamente${NC}"
            
            # Guardar configuración de PM2
            run_ssh "pm2 save"
            
            # Configurar PM2 para iniciar automáticamente
            run_ssh "pm2 startup"
            
            return 0
        else
            echo -e "${YELLOW}⚠️  Error con PM2, intentando screen...${NC}"
        fi
    fi
    
    # Usar screen como alternativa
    if run_ssh "which screen" >/dev/null 2>&1; then
        echo -e "${BLUE}🚀 Iniciando con screen...${NC}"
        
        # Detener sesión existente si existe
        run_ssh "screen -S wepapp-control -X quit 2>/dev/null || true"
        
        # Crear nueva sesión
        if run_ssh "cd $SSH_PATH && screen -dmS wepapp-control node server/index.js"; then
            echo -e "${GREEN}✅ Aplicación iniciada con screen${NC}"
            
            # Crear script de inicio automático
            run_ssh "cat > $SSH_PATH/start-app.sh << 'EOF'
#!/bin/bash
cd $SSH_PATH
screen -dmS wepapp-control node server/index.js
EOF"
            run_ssh "chmod +x $SSH_PATH/start-app.sh"
            
            return 0
        else
            echo -e "${RED}❌ Error iniciando con screen${NC}"
            return 1
        fi
    fi
    
    echo -e "${RED}❌ No se pudo configurar gestor de procesos${NC}"
    return 1
}

# Función para verificar el estado
check_status() {
    echo -e "${BLUE}🔍 Verificando estado de la aplicación...${NC}"
    
    # Verificar estado de PM2
    if run_ssh "which pm2" >/dev/null 2>&1; then
        echo -e "${BLUE}📊 Estado de PM2:${NC}"
        run_ssh "pm2 status"
    fi
    
    # Verificar estado de screen
    if run_ssh "which screen" >/dev/null 2>&1; then
        echo -e "${BLUE}📊 Estado de screen:${NC}"
        run_ssh "screen -list | grep wepapp-control || echo 'No hay sesión de screen activa'"
    fi
    
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
    if run_ssh "which pm2" >/dev/null 2>&1; then
        echo "   - Estado PM2: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 status'"
        echo "   - Logs: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 logs wepapp-control'"
        echo "   - Reiniciar: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 restart wepapp-control'"
    else
        echo "   - Estado Screen: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'screen -list'"
        echo "   - Conectar: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'screen -r wepapp-control'"
        echo "   - Reiniciar: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'cd $SSH_PATH && ./start-app.sh'"
    fi
    echo ""
    echo -e "${BLUE}🛠️  Comandos útiles:${NC}"
    echo "   - SSH: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
    echo "   - Directorio: cd $SSH_PATH"
}

# Función principal
main() {
    echo -e "${BLUE}🚀 Iniciando configuración de producción...${NC}"
    
    # Verificar conexión SSH
    if ! check_ssh_connection; then
        echo -e "${RED}❌ No se pudo establecer conexión SSH${NC}"
        exit 1
    fi
    
    # Verificar Node.js y npm
    if ! check_node_availability; then
        echo -e "${YELLOW}⚠️  Node.js disponible pero npm no. Continuando con alternativas...${NC}"
    fi
    
    # Instalar PM2 o alternativa
    if ! install_pm2; then
        echo -e "${RED}❌ Error instalando gestor de procesos${NC}"
        exit 1
    fi
    
    # Configurar aplicación
    setup_application
    
    # Configurar gestor de procesos
    if ! setup_process_manager; then
        echo -e "${RED}❌ Error configurando gestor de procesos${NC}"
        exit 1
    fi
    
    # Verificar estado
    check_status
    
    # Mostrar información de acceso
    show_access_info
}

# Ejecutar función principal
main 