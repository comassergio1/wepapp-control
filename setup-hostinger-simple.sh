#!/bin/bash

# Script simple para Hostinger - Sin PM2, solo Node.js directo
# Autor: Sistema de Despliegue
# Fecha: $(date)

echo "🚀 Configurando WepApp Control para Hostinger..."
echo "================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
SSH_USER="u564887081"
SSH_HOST="82.29.86.165"
SSH_PORT="65002"
SSH_PATH="/home/u564887081/public_html"
DOMAIN="phoenixconsultora.online"

echo -e "${BLUE}📋 Configuración:${NC}"
echo "   - Usuario SSH: $SSH_USER"
echo "   - Host: $SSH_HOST"
echo "   - Puerto SSH: $SSH_PORT"
echo "   - Ruta: $SSH_PATH"
echo "   - Dominio: $DOMAIN"

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

# Función para verificar herramientas disponibles
check_tools() {
    echo -e "${BLUE}🔍 Verificando herramientas disponibles...${NC}"
    
    # Verificar Node.js
    if run_ssh "which node" >/dev/null 2>&1; then
        local node_version=$(run_ssh "node --version")
        echo -e "${GREEN}✅ Node.js: $node_version${NC}"
    else
        echo -e "${RED}❌ Node.js no disponible${NC}"
        return 1
    fi
    
    # Verificar npm
    if run_ssh "which npm" >/dev/null 2>&1; then
        local npm_version=$(run_ssh "npm --version")
        echo -e "${GREEN}✅ npm: $npm_version${NC}"
    else
        echo -e "${YELLOW}⚠️  npm no disponible${NC}"
    fi
    
    # Verificar screen
    if run_ssh "which screen" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ screen disponible${NC}"
    else
        echo -e "${YELLOW}⚠️  screen no disponible${NC}"
    fi
    
    # Verificar nohup
    if run_ssh "which nohup" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ nohup disponible${NC}"
    else
        echo -e "${YELLOW}⚠️  nohup no disponible${NC}"
    fi
    
    return 0
}

# Función para configurar la aplicación
setup_application() {
    echo -e "${BLUE}🔧 Configurando aplicación...${NC}"
    
    # Crear directorio de logs
    run_ssh "mkdir -p $SSH_PATH/logs"
    
    # Crear directorio de uploads
    run_ssh "mkdir -p $SSH_PATH/uploads/comprobantes"
    
    # Verificar base de datos
    if ! run_ssh "test -f $SSH_PATH/database/wepapp_control.db"; then
        echo -e "${YELLOW}⚠️  Configurando base de datos...${NC}"
        run_ssh "cd $SSH_PATH && node database/setup.js"
    else
        echo -e "${GREEN}✅ Base de datos existe${NC}"
    fi
    
    echo -e "${GREEN}✅ Aplicación configurada${NC}"
}

# Función para crear script de inicio
create_startup_script() {
    echo -e "${BLUE}📝 Creando script de inicio...${NC}"
    
    # Crear script de inicio
    run_ssh "cat > $SSH_PATH/start-server.sh << 'EOF'
#!/bin/bash
cd $SSH_PATH

# Detener proceso anterior si existe
pkill -f 'node server/index.js' 2>/dev/null || true

# Iniciar servidor en background
nohup node server/index.js > logs/server.log 2>&1 &

# Guardar PID
echo \$! > logs/server.pid

echo 'Servidor iniciado con PID:' \$(cat logs/server.pid)
EOF"
    
    # Hacer ejecutable
    run_ssh "chmod +x $SSH_PATH/start-server.sh"
    
    # Crear script de parada
    run_ssh "cat > $SSH_PATH/stop-server.sh << 'EOF'
#!/bin/bash
cd $SSH_PATH

if [ -f logs/server.pid ]; then
    PID=\$(cat logs/server.pid)
    if kill -0 \$PID 2>/dev/null; then
        kill \$PID
        echo 'Servidor detenido (PID: '\$PID')'
    else
        echo 'Servidor no estaba corriendo'
    fi
    rm -f logs/server.pid
else
    echo 'No se encontró PID del servidor'
fi

# También matar por nombre por si acaso
pkill -f 'node server/index.js' 2>/dev/null || true
EOF"
    
    # Hacer ejecutable
    run_ssh "chmod +x $SSH_PATH/stop-server.sh"
    
    # Crear script de reinicio
    run_ssh "cat > $SSH_PATH/restart-server.sh << 'EOF'
#!/bin/bash
cd $SSH_PATH
./stop-server.sh
sleep 2
./start-server.sh
EOF"
    
    # Hacer ejecutable
    run_ssh "chmod +x $SSH_PATH/restart-server.sh"
    
    echo -e "${GREEN}✅ Scripts de gestión creados${NC}"
}

# Función para iniciar la aplicación
start_application() {
    echo -e "${BLUE}🚀 Iniciando aplicación...${NC}"
    
    # Detener proceso anterior si existe
    run_ssh "cd $SSH_PATH && ./stop-server.sh 2>/dev/null || true"
    
    # Iniciar aplicación
    if run_ssh "cd $SSH_PATH && ./start-server.sh"; then
        echo -e "${GREEN}✅ Aplicación iniciada${NC}"
        return 0
    else
        echo -e "${RED}❌ Error iniciando aplicación${NC}"
        return 1
    fi
}

# Función para verificar estado
check_status() {
    echo -e "${BLUE}🔍 Verificando estado...${NC}"
    
    # Verificar si el proceso está corriendo
    if run_ssh "cd $SSH_PATH && test -f logs/server.pid && kill -0 \$(cat logs/server.pid) 2>/dev/null"; then
        local pid=$(run_ssh "cd $SSH_PATH && cat logs/server.pid")
        echo -e "${GREEN}✅ Aplicación corriendo (PID: $pid)${NC}"
    else
        echo -e "${YELLOW}⚠️  Aplicación no está corriendo${NC}"
    fi
    
    # Verificar puertos
    echo -e "${BLUE}🔌 Verificando puertos...${NC}"
    run_ssh "netstat -tuln | grep :3000 || echo 'Puerto 3000 no está en uso'"
    
    # Verificar logs
    echo -e "${BLUE}📝 Últimas líneas de log:${NC}"
    run_ssh "tail -10 $SSH_PATH/logs/server.log 2>/dev/null || echo 'No hay logs disponibles'"
}

# Función para mostrar información
show_info() {
    echo ""
    echo -e "${GREEN}🎉 Configuración completada${NC}"
    echo "================================================"
    echo -e "${BLUE}🔗 URLs de acceso:${NC}"
    echo "   - Aplicación: https://$DOMAIN"
    echo "   - API: https://$DOMAIN/api"
    echo ""
    echo -e "${BLUE}🛠️  Comandos de gestión:${NC}"
    echo "   - Iniciar: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'cd $SSH_PATH && ./start-server.sh'"
    echo "   - Detener: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'cd $SSH_PATH && ./stop-server.sh'"
    echo "   - Reiniciar: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'cd $SSH_PATH && ./restart-server.sh'"
    echo "   - Estado: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'cd $SSH_PATH && ps aux | grep node'"
    echo "   - Logs: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'tail -f $SSH_PATH/logs/server.log'"
    echo ""
    echo -e "${BLUE}📊 Monitoreo:${NC}"
    echo "   - SSH: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
    echo "   - Directorio: cd $SSH_PATH"
    echo ""
    echo -e "${YELLOW}💡 Nota: Esta configuración usa nohup para mantener la app corriendo${NC}"
    echo "   - La aplicación se reiniciará automáticamente si el servidor se reinicia"
    echo "   - Usa los scripts de gestión para controlar la aplicación"
}

# Función principal
main() {
    echo -e "${BLUE}🚀 Iniciando configuración para Hostinger...${NC}"
    
    # Verificar conexión SSH
    if ! check_ssh_connection; then
        echo -e "${RED}❌ No se pudo establecer conexión SSH${NC}"
        exit 1
    fi
    
    # Verificar herramientas
    if ! check_tools; then
        echo -e "${RED}❌ Herramientas insuficientes${NC}"
        exit 1
    fi
    
    # Configurar aplicación
    setup_application
    
    # Crear scripts de gestión
    create_startup_script
    
    # Iniciar aplicación
    if ! start_application; then
        echo -e "${RED}❌ Error iniciando aplicación${NC}"
        exit 1
    fi
    
    # Verificar estado
    check_status
    
    # Mostrar información
    show_info
}

# Ejecutar función principal
main 