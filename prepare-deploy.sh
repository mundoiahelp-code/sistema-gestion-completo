#!/bin/bash

echo "🚀 Preparando proyecto para deploy..."
echo ""

# Verificar que estamos en la raíz del proyecto
if [ ! -f "DEPLOY.md" ]; then
    echo "❌ Error: Ejecutá este script desde la raíz del proyecto"
    exit 1
fi

echo "✅ Verificando archivos sensibles..."

# Verificar que no haya archivos sensibles
if [ -f "server/.env" ]; then
    echo "⚠️  ADVERTENCIA: server/.env existe. Asegurate de que esté en .gitignore"
fi

if [ -f "chat-auto/.env" ]; then
    echo "⚠️  ADVERTENCIA: chat-auto/.env existe. Asegurate de que esté en .gitignore"
fi

if [ -f "sistema/.env.local" ]; then
    echo "⚠️  ADVERTENCIA: sistema/.env.local existe. Asegurate de que esté en .gitignore"
fi

echo ""
echo "✅ Verificando dependencias..."

# Verificar que node_modules no se suba
if git ls-files | grep -q "node_modules"; then
    echo "❌ Error: node_modules está trackeado en git!"
    echo "   Ejecutá: git rm -r --cached node_modules"
    exit 1
fi

echo ""
echo "✅ Todo listo para deploy!"
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Commitear cambios:"
echo "   git add ."
echo "   git commit -m 'Preparar para deploy'"
echo ""
echo "2. Pushear a GitHub:"
echo "   git push origin main"
echo ""
echo "3. Seguir la guía en DEPLOY.md"
echo ""
