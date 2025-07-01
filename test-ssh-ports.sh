#!/bin/bash

echo "🔍 Probando conexiones SSH en diferentes puertos..."

USER="u564887081"
HOST="82.29.86.165"
PORTS=(22 2222 222 2200 2201 2202)

echo "👤 Usuario: $USER"
echo "🌐 Host: $HOST"
echo ""

for port in "${PORTS[@]}"; do
    echo -n "🔗 Probando puerto $port... "
    
    # Probar conexión SSH con timeout
    if timeout 5 ssh -o ConnectTimeout=5 -o BatchMode=yes -p $port $USER@$HOST "echo 'OK'" 2>/dev/null; then
        echo "✅ CONEXIÓN EXITOSA"
        echo "🎯 Puerto SSH encontrado: $port"
        echo ""
        echo "📝 Actualiza tu hostinger-config.json con:"
        echo "   \"port\": $port"
        exit 0
    else
        echo "❌ Falló"
    fi
done

echo ""
echo "❌ No se pudo conectar en ningún puerto"
echo ""
echo "📋 Posibles soluciones:"
echo "1. Verifica que SSH esté habilitado en tu panel de Hostinger"
echo "2. Verifica que no haya restricciones de firewall"
echo "3. Intenta usar el método manual de despliegue"
echo ""
echo "🔧 Método manual recomendado:"
echo "   - Sube wepapp-control-production.zip al panel de Hostinger"
echo "   - Usa la terminal integrada para instalar dependencias" 