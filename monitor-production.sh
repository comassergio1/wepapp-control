#!/bin/bash

# Script para monitorear WepApp Control en producción
# Autor: Sistema de Despliegue
# Fecha: $(date)

echo "📊 Monitoreando WepApp Control en producción..."
echo "=============================================="

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

# Función para ejecutar comando SSH
run_ssh() {
    local command="$1"
    ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "$command"
}

# Función para verificar estado de PM2
check_pm2_status() {
    echo -e "${BLUE}📊 Estado de PM2:${NC}"
    
    local pm2_status=$(run_ssh "pm2 status --no-daemon" 2>/dev/null)
    
    if echo "$pm2_status" | grep -q "wepapp-control"; then
        if echo "$pm2_status" | grep -q "online"; then
            echo -e "${GREEN}✅ Aplicación corriendo correctamente${NC}"
            echo "$pm2_status" | grep "wepapp-control"
            return 0
        else
            echo -e "${RED}❌ Aplicación no está corriendo${NC}"
            echo "$pm2_status" | grep "wepapp-control"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  Aplicación no encontrada en PM2${NC}"
        return 1
    fi
}

# Función para verificar puertos
check_ports() {
    echo -e "${BLUE}🔌 Verificando puertos:${NC}"
    
    local port_status=$(run_ssh "netstat -tuln | grep :$APP_PORT" 2>/dev/null)
    
    if [ -n "$port_status" ]; then
        echo -e "${GREEN}✅ Puerto $APP_PORT está en uso${NC}"
        echo "$port_status"
        return 0
    else
        echo -e "${RED}❌ Puerto $APP_PORT no está en uso${NC}"
        return 1
    fi
}

# Función para verificar conectividad web
check_web_connectivity() {
    echo -e "${BLUE}🌐 Verificando conectividad web:${NC}"
    
    # Verificar respuesta HTTP
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "302" ]; then
        echo -e "${GREEN}✅ Sitio web responde correctamente (HTTP $http_code)${NC}"
        return 0
    else
        echo -e "${RED}❌ Sitio web no responde correctamente (HTTP $http_code)${NC}"
        return 1
    fi
}

# Función para verificar base de datos
check_database() {
    echo -e "${BLUE}🗄️  Verificando base de datos:${NC}"
    
    if run_ssh "test -f $SSH_PATH/database/wepapp_control.db"; then
        local db_size=$(run_ssh "ls -lh $SSH_PATH/database/wepapp_control.db | awk '{print \$5}'")
        echo -e "${GREEN}✅ Base de datos existe (Tamaño: $db_size)${NC}"
        
        # Verificar que la base de datos es accesible
        if run_ssh "cd $SSH_PATH && node -e \"const sqlite3 = require('sqlite3').verbose(); const db = new sqlite3.Database('database/wepapp_control.db'); db.get('SELECT COUNT(*) as count FROM users', (err, row) => { if (err) { console.log('Error:', err.message); process.exit(1); } else { console.log('Usuarios en BD:', row.count); } db.close(); });\"" 2>/dev/null; then
            echo -e "${GREEN}✅ Base de datos accesible${NC}"
            return 0
        else
            echo -e "${RED}❌ Error accediendo a la base de datos${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Base de datos no encontrada${NC}"
        return 1
    fi
}

# Función para verificar logs
check_logs() {
    echo -e "${BLUE}📝 Verificando logs:${NC}"
    
    local log_file="$SSH_PATH/logs/combined.log"
    
    if run_ssh "test -f $log_file"; then
        local log_size=$(run_ssh "ls -lh $log_file | awk '{print \$5}'")
        echo -e "${GREEN}✅ Archivo de logs existe (Tamaño: $log_size)${NC}"
        
        # Mostrar últimas líneas de log
        echo -e "${BLUE}📋 Últimas 10 líneas de log:${NC}"
        run_ssh "tail -10 $log_file"
        
        # Verificar errores recientes
        local error_count=$(run_ssh "tail -50 $log_file | grep -i error | wc -l")
        if [ "$error_count" -gt 0 ]; then
            echo -e "${YELLOW}⚠️  Se encontraron $error_count errores en los últimos 50 logs${NC}"
        else
            echo -e "${GREEN}✅ No se encontraron errores recientes${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Archivo de logs no encontrado${NC}"
    fi
}

# Función para verificar uso de recursos
check_resources() {
    echo -e "${BLUE}💻 Verificando uso de recursos:${NC}"
    
    # Uso de CPU y memoria del proceso
    local process_info=$(run_ssh "ps aux | grep 'wepapp-control' | grep -v grep" 2>/dev/null)
    
    if [ -n "$process_info" ]; then
        echo -e "${GREEN}✅ Proceso encontrado:${NC}"
        echo "$process_info"
        
        # Uso de memoria del sistema
        local memory_info=$(run_ssh "free -h | grep Mem")
        echo -e "${BLUE}📊 Memoria del sistema:${NC}"
        echo "$memory_info"
        
        # Uso de disco
        local disk_info=$(run_ssh "df -h $SSH_PATH | tail -1")
        echo -e "${BLUE}💾 Uso de disco:${NC}"
        echo "$disk_info"
    else
        echo -e "${RED}❌ Proceso no encontrado${NC}"
    fi
}

# Función para mostrar resumen
show_summary() {
    echo ""
    echo -e "${BLUE}📋 Resumen del monitoreo:${NC}"
    echo "=============================================="
    
    local all_ok=true
    
    # Verificar cada componente
    if ! check_pm2_status >/dev/null 2>&1; then
        all_ok=false
    fi
    
    if ! check_ports >/dev/null 2>&1; then
        all_ok=false
    fi
    
    if ! check_web_connectivity >/dev/null 2>&1; then
        all_ok=false
    fi
    
    if ! check_database >/dev/null 2>&1; then
        all_ok=false
    fi
    
    if [ "$all_ok" = true ]; then
        echo -e "${GREEN}🎉 Todos los sistemas funcionando correctamente${NC}"
    else
        echo -e "${YELLOW}⚠️  Se detectaron problemas en algunos componentes${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}🔗 URLs de acceso:${NC}"
    echo "   - Aplicación: https://$DOMAIN"
    echo "   - API: https://$DOMAIN/api"
    echo ""
    echo -e "${BLUE}🛠️  Comandos de gestión:${NC}"
    echo "   - Reiniciar: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 restart wepapp-control'"
    echo "   - Logs: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 logs wepapp-control'"
    echo "   - Estado: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 status'"
}

# Función para monitoreo continuo
continuous_monitoring() {
    echo -e "${BLUE}🔄 Iniciando monitoreo continuo (Ctrl+C para detener)...${NC}"
    
    while true; do
        clear
        echo "📊 Monitoreo continuo - $(date)"
        echo "=============================================="
        
        check_pm2_status
        echo ""
        check_ports
        echo ""
        check_web_connectivity
        echo ""
        check_resources
        echo ""
        
        echo -e "${YELLOW}⏳ Actualizando en 30 segundos...${NC}"
        sleep 30
    done
}

# Función principal
main() {
    case "${1:-}" in
        "continuous"|"cont"|"c")
            continuous_monitoring
            ;;
        "summary"|"sum"|"s")
            show_summary
            ;;
        *)
            echo -e "${BLUE}🔍 Verificando estado completo...${NC}"
            echo ""
            
            check_pm2_status
            echo ""
            check_ports
            echo ""
            check_web_connectivity
            echo ""
            check_database
            echo ""
            check_logs
            echo ""
            check_resources
            echo ""
            show_summary
            ;;
    esac
}

# Ejecutar función principal
main "$@" 