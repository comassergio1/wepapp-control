#!/bin/bash

# Script para desplegar WepApp Control en producción
# Autor: Sistema de Despliegue
# Fecha: $(date)

echo "🚀 Desplegando WepApp Control en producción..."
echo "============================================="

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
else
    echo -e "${RED}❌ Error: No se encontró hostinger-config.json${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Configuración de despliegue:${NC}"
echo "   - Host: $SSH_HOST:$SSH_PORT"
echo "   - Usuario: $SSH_USER"
echo "   - Ruta: $SSH_PATH"
echo "   - Dominio: $DOMAIN"

# Función para ejecutar comando SSH
run_ssh() {
    local command="$1"
    ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "$command"
}

# Función para hacer backup
create_backup() {
    echo -e "${BLUE}💾 Creando backup...${NC}"
    
    local backup_dir="$SSH_PATH/backups"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_name="backup_$timestamp"
    
    # Crear directorio de backups si no existe
    run_ssh "mkdir -p $backup_dir"
    
    # Crear backup de la aplicación
    if run_ssh "cd $SSH_PATH && tar -czf $backup_dir/${backup_name}.tar.gz --exclude=node_modules --exclude=backups ."; then
        echo -e "${GREEN}✅ Backup creado: $backup_name.tar.gz${NC}"
        return 0
    else
        echo -e "${RED}❌ Error creando backup${NC}"
        return 1
    fi
}

# Función para construir la aplicación
build_application() {
    echo -e "${BLUE}🔨 Construyendo aplicación...${NC}"
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ Error: No se encontró package.json${NC}"
        exit 1
    fi
    
    # Instalar dependencias si es necesario
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
        npm install
    fi
    
    # Construir la aplicación
    echo -e "${BLUE}🏗️  Construyendo React app...${NC}"
    if npm run build; then
        echo -e "${GREEN}✅ Aplicación construida correctamente${NC}"
        return 0
    else
        echo -e "${RED}❌ Error construyendo la aplicación${NC}"
        return 1
    fi
}

# Función para subir archivos
upload_files() {
    echo -e "${BLUE}📤 Subiendo archivos al servidor...${NC}"
    
    # Crear archivo temporal con los archivos a subir
    local temp_file="deploy_files_$(date +%s).tar.gz"
    
    # Crear archivo con los archivos necesarios
    tar -czf $temp_file \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=*.log \
        --exclude=backups \
        --exclude=uploads \
        .
    
    # Subir archivo
    if scp -P $SSH_PORT $temp_file $SSH_USER@$SSH_HOST:$SSH_PATH/; then
        echo -e "${GREEN}✅ Archivos subidos correctamente${NC}"
        
        # Extraer archivos en el servidor
        if run_ssh "cd $SSH_PATH && tar -xzf $temp_file && rm $temp_file"; then
            echo -e "${GREEN}✅ Archivos extraídos en el servidor${NC}"
            
            # Limpiar archivo temporal local
            rm $temp_file
            
            return 0
        else
            echo -e "${RED}❌ Error extrayendo archivos en el servidor${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Error subiendo archivos${NC}"
        rm $temp_file
        return 1
    fi
}

# Función para instalar dependencias en el servidor
install_dependencies() {
    echo -e "${BLUE}📦 Instalando dependencias en el servidor...${NC}"
    
    if run_ssh "cd $SSH_PATH && npm install --production"; then
        echo -e "${GREEN}✅ Dependencias instaladas${NC}"
        return 0
    else
        echo -e "${RED}❌ Error instalando dependencias${NC}"
        return 1
    fi
}

# Función para reiniciar la aplicación
restart_application() {
    echo -e "${BLUE}🔄 Reiniciando aplicación...${NC}"
    
    # Verificar si PM2 está instalado
    if ! run_ssh "which pm2" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  PM2 no está instalado. Instalando...${NC}"
        run_ssh "npm install -g pm2"
    fi
    
    # Reiniciar aplicación
    if run_ssh "cd $SSH_PATH && pm2 restart wepapp-control"; then
        echo -e "${GREEN}✅ Aplicación reiniciada${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Aplicación no estaba corriendo. Iniciando...${NC}"
        if run_ssh "cd $SSH_PATH && pm2 start ecosystem.config.js"; then
            echo -e "${GREEN}✅ Aplicación iniciada${NC}"
            return 0
        else
            echo -e "${RED}❌ Error iniciando aplicación${NC}"
            return 1
        fi
    fi
}

# Función para verificar el despliegue
verify_deployment() {
    echo -e "${BLUE}🔍 Verificando despliegue...${NC}"
    
    # Esperar un momento para que la aplicación se inicie
    sleep 5
    
    # Verificar estado de PM2
    echo -e "${BLUE}📊 Estado de PM2:${NC}"
    run_ssh "pm2 status"
    
    # Verificar que la aplicación responde
    echo -e "${BLUE}🌐 Verificando respuesta de la aplicación...${NC}"
    if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200\|302"; then
        echo -e "${GREEN}✅ Aplicación responde correctamente${NC}"
    else
        echo -e "${YELLOW}⚠️  La aplicación puede tardar unos minutos en estar disponible${NC}"
    fi
    
    # Mostrar logs recientes
    echo -e "${BLUE}📝 Logs recientes:${NC}"
    run_ssh "pm2 logs wepapp-control --lines 10"
}

# Función para mostrar información final
show_deployment_info() {
    echo ""
    echo -e "${GREEN}🎉 Despliegue completado${NC}"
    echo "============================================="
    echo -e "${BLUE}🔗 URLs de acceso:${NC}"
    echo "   - Aplicación: https://$DOMAIN"
    echo "   - API: https://$DOMAIN/api"
    echo ""
    echo -e "${BLUE}📊 Monitoreo:${NC}"
    echo "   - Estado: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 status'"
    echo "   - Logs: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 logs wepapp-control'"
    echo ""
    echo -e "${BLUE}🛠️  Gestión:${NC}"
    echo "   - Reiniciar: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 restart wepapp-control'"
    echo "   - Detener: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 stop wepapp-control'"
    echo "   - Iniciar: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'pm2 start wepapp-control'"
}

# Función principal
main() {
    echo -e "${BLUE}🚀 Iniciando despliegue...${NC}"
    
    # Crear backup
    if ! create_backup; then
        echo -e "${RED}❌ Error creando backup. Abortando despliegue.${NC}"
        exit 1
    fi
    
    # Construir aplicación
    if ! build_application; then
        echo -e "${RED}❌ Error construyendo aplicación. Abortando despliegue.${NC}"
        exit 1
    fi
    
    # Subir archivos
    if ! upload_files; then
        echo -e "${RED}❌ Error subiendo archivos. Abortando despliegue.${NC}"
        exit 1
    fi
    
    # Instalar dependencias
    if ! install_dependencies; then
        echo -e "${RED}❌ Error instalando dependencias. Abortando despliegue.${NC}"
        exit 1
    fi
    
    # Reiniciar aplicación
    if ! restart_application; then
        echo -e "${RED}❌ Error reiniciando aplicación. Abortando despliegue.${NC}"
        exit 1
    fi
    
    # Verificar despliegue
    verify_deployment
    
    # Mostrar información final
    show_deployment_info
}

# Ejecutar función principal
main 