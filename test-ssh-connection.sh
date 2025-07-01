#!/bin/bash

echo "🔍 Probando conexiones SSH a servidores de Hostinger..."

# Lista de posibles servidores SSH de Hostinger
SERVERS=(
    "srv123.hostinger.com"
    "srv124.hostinger.com"
    "srv125.hostinger.com"
    "srv126.hostinger.com"
    "srv127.hostinger.com"
    "srv128.hostinger.com"
    "srv129.hostinger.com"
    "srv130.hostinger.com"
    "server123.hostinger.com"
    "server124.hostinger.com"
    "server125.hostinger.com"
    "phoenixconsultora.online"
)

USER="u564887081"

echo "👤 Usuario: $USER"
echo ""

for server in "${SERVERS[@]}"; do
    echo -n "🔗 Probando $server... "
    
    # Probar conexión SSH con timeout
    if timeout 5 ssh -o ConnectTimeout=5 -o BatchMode=yes $USER@$server "echo 'OK'" 2>/dev/null; then
        echo "✅ CONEXIÓN EXITOSA"
        echo "🎯 Servidor SSH encontrado: $server"
        echo ""
        echo "📝 Actualiza tu hostinger-config.json con:"
        echo "   \"host\": \"$server\""
        exit 0
    else
        echo "❌ Falló"
    fi
done

echo ""
echo "❌ No se pudo encontrar el servidor SSH correcto"
echo ""
echo "📋 Verifica en tu panel de Hostinger:"
echo "1. Ve a 'Herramientas' → 'SSH'"
echo "2. Busca el campo 'Host/Servidor'"
echo "3. Copia ese valor exacto"
echo ""
echo "🔧 También puedes probar con la IP directa si la tienes" 