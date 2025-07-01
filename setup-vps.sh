#!/bin/bash

# Script para configurar VPS con WepApp Control
# Autor: Sistema de Despliegue
# Fecha: $(date)

echo "🚀 Configurando VPS para WepApp Control..."
echo "=========================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Este script debe ejecutarse como root${NC}"
    echo -e "${YELLOW}💡 Ejecuta: sudo bash setup-vps.sh${NC}"
    exit 1
fi

# Función para actualizar sistema
update_system() {
    echo -e "${BLUE}🔄 Actualizando sistema...${NC}"
    
    apt update
    apt upgrade -y
    
    # Instalar herramientas básicas
    apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    
    echo -e "${GREEN}✅ Sistema actualizado${NC}"
}

# Función para instalar Node.js
install_nodejs() {
    echo -e "${BLUE}📦 Instalando Node.js...${NC}"
    
    # Verificar si Node.js ya está instalado
    if command -v node &> /dev/null; then
        local version=$(node --version)
        echo -e "${YELLOW}⚠️  Node.js ya está instalado: $version${NC}"
        return 0
    fi
    
    # Instalar Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
    
    # Verificar instalación
    if command -v node &> /dev/null; then
        local version=$(node --version)
        local npm_version=$(npm --version)
        echo -e "${GREEN}✅ Node.js instalado: $version${NC}"
        echo -e "${GREEN}✅ npm instalado: $npm_version${NC}"
        return 0
    else
        echo -e "${RED}❌ Error instalando Node.js${NC}"
        return 1
    fi
}

# Función para instalar PM2
install_pm2() {
    echo -e "${BLUE}📦 Instalando PM2...${NC}"
    
    # Verificar si PM2 ya está instalado
    if command -v pm2 &> /dev/null; then
        echo -e "${YELLOW}⚠️  PM2 ya está instalado${NC}"
        return 0
    fi
    
    # Instalar PM2 globalmente
    npm install -g pm2
    
    # Verificar instalación
    if command -v pm2 &> /dev/null; then
        echo -e "${GREEN}✅ PM2 instalado correctamente${NC}"
        return 0
    else
        echo -e "${RED}❌ Error instalando PM2${NC}"
        return 1
    fi
}

# Función para instalar nginx
install_nginx() {
    echo -e "${BLUE}🌐 Instalando nginx...${NC}"
    
    # Verificar si nginx ya está instalado
    if command -v nginx &> /dev/null; then
        echo -e "${YELLOW}⚠️  nginx ya está instalado${NC}"
        return 0
    fi
    
    # Instalar nginx
    apt install -y nginx
    
    # Iniciar y habilitar nginx
    systemctl start nginx
    systemctl enable nginx
    
    # Configurar firewall
    ufw allow 'Nginx Full'
    
    echo -e "${GREEN}✅ nginx instalado y configurado${NC}"
}

# Función para crear usuario de aplicación
create_app_user() {
    echo -e "${BLUE}👤 Creando usuario de aplicación...${NC}"
    
    local username="wepapp"
    
    # Verificar si el usuario ya existe
    if id "$username" &>/dev/null; then
        echo -e "${YELLOW}⚠️  Usuario $username ya existe${NC}"
        return 0
    fi
    
    # Crear usuario
    useradd -m -s /bin/bash $username
    usermod -aG sudo $username
    
    # Configurar contraseña (opcional)
    echo -e "${YELLOW}💡 Configurando contraseña para usuario $username...${NC}"
    passwd $username
    
    echo -e "${GREEN}✅ Usuario $username creado${NC}"
}

# Función para configurar directorios
setup_directories() {
    echo -e "${BLUE}📁 Configurando directorios...${NC}"
    
    local app_dir="/home/wepapp/wepapp-control"
    
    # Crear directorio de aplicación
    mkdir -p $app_dir
    chown wepapp:wepapp $app_dir
    
    # Crear directorio de logs
    mkdir -p /var/log/wepapp-control
    chown wepapp:wepapp /var/log/wepapp-control
    
    # Crear directorio de uploads
    mkdir -p /home/wepapp/uploads
    chown wepapp:wepapp /home/wepapp/uploads
    
    echo -e "${GREEN}✅ Directorios configurados${NC}"
}

# Función para configurar nginx
setup_nginx() {
    echo -e "${BLUE}🌐 Configurando nginx...${NC}"
    
    # Crear configuración de nginx
    cat > /etc/nginx/sites-available/wepapp-control << 'EOF'
server {
    listen 80;
    server_name phoenixconsultora.online www.phoenixconsultora.online;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Configuración para archivos estáticos
    location /static/ {
        alias /home/wepapp/wepapp-control/build/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Configuración para uploads
    location /uploads/ {
        alias /home/wepapp/uploads/;
        expires 1d;
    }
}
EOF
    
    # Habilitar sitio
    ln -sf /etc/nginx/sites-available/wepapp-control /etc/nginx/sites-enabled/
    
    # Deshabilitar sitio por defecto
    rm -f /etc/nginx/sites-enabled/default
    
    # Verificar configuración
    nginx -t
    
    # Recargar nginx
    systemctl reload nginx
    
    echo -e "${GREEN}✅ nginx configurado${NC}"
}

# Función para configurar SSL con Let's Encrypt
setup_ssl() {
    echo -e "${BLUE}🔒 Configurando SSL...${NC}"
    
    # Instalar certbot
    apt install -y certbot python3-certbot-nginx
    
    # Obtener certificado SSL
    certbot --nginx -d phoenixconsultora.online -d www.phoenixconsultora.online --non-interactive --agree-tos --email admin@phoenixconsultora.online
    
    # Configurar renovación automática
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
    
    echo -e "${GREEN}✅ SSL configurado${NC}"
}

# Función para configurar firewall
setup_firewall() {
    echo -e "${BLUE}🛡️  Configurando firewall...${NC}"
    
    # Habilitar UFW
    ufw --force enable
    
    # Configurar reglas básicas
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw allow 3000/tcp
    
    echo -e "${GREEN}✅ Firewall configurado${NC}"
}

# Función para crear script de despliegue
create_deploy_script() {
    echo -e "${BLUE}📝 Creando script de despliegue...${NC}"
    
    cat > /home/wepapp/deploy.sh << 'EOF'
#!/bin/bash

# Script de despliegue para WepApp Control
# Ejecutar como usuario wepapp

cd /home/wepapp/wepapp-control

# Detener aplicación
pm2 stop wepapp-control 2>/dev/null || true

# Actualizar código (si usas git)
# git pull origin main

# Instalar dependencias
npm install --production

# Construir aplicación
npm run build

# Iniciar aplicación
pm2 start ecosystem.config.js

# Guardar configuración PM2
pm2 save

echo "✅ Despliegue completado"
EOF
    
    chown wepapp:wepapp /home/wepapp/deploy.sh
    chmod +x /home/wepapp/deploy.sh
    
    echo -e "${GREEN}✅ Script de despliegue creado${NC}"
}

# Función para mostrar información final
show_final_info() {
    echo ""
    echo -e "${GREEN}🎉 VPS configurado correctamente${NC}"
    echo "=========================================="
    echo -e "${BLUE}📋 Información del servidor:${NC}"
    echo "   - IP: $(curl -s ifconfig.me)"
    echo "   - Usuario: wepapp"
    echo "   - Directorio: /home/wepapp/wepapp-control"
    echo ""
    echo -e "${BLUE}🛠️  Próximos pasos:${NC}"
    echo "   1. Subir archivos de la aplicación a /home/wepapp/wepapp-control"
    echo "   2. Ejecutar: sudo -u wepapp bash /home/wepapp/deploy.sh"
    echo "   3. Configurar DNS para apuntar a esta IP"
    echo ""
    echo -e "${BLUE}📊 Comandos útiles:${NC}"
    echo "   - Ver estado: pm2 status"
    echo "   - Ver logs: pm2 logs wepapp-control"
    echo "   - Reiniciar: pm2 restart wepapp-control"
    echo "   - Desplegar: sudo -u wepapp bash /home/wepapp/deploy.sh"
    echo ""
    echo -e "${BLUE}🔗 URLs:${NC}"
    echo "   - HTTP: http://$(curl -s ifconfig.me)"
    echo "   - HTTPS: https://phoenixconsultora.online (después de configurar DNS)"
    echo ""
    echo -e "${YELLOW}💡 Recuerda configurar el DNS de tu dominio para apuntar a esta IP${NC}"
}

# Función principal
main() {
    echo -e "${BLUE}🚀 Iniciando configuración del VPS...${NC}"
    
    update_system
    install_nodejs
    install_pm2
    install_nginx
    create_app_user
    setup_directories
    setup_nginx
    setup_firewall
    create_deploy_script
    
    echo -e "${BLUE}🔒 Configurando SSL (opcional)...${NC}"
    echo -e "${YELLOW}💡 Si tienes el dominio configurado, se configurará SSL automáticamente${NC}"
    echo -e "${YELLOW}💡 Si no, puedes ejecutar: sudo certbot --nginx -d tu-dominio.com${NC}"
    
    show_final_info
}

# Ejecutar función principal
main 