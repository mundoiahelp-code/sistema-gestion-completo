#!/bin/bash

# Script de verificación pre-commit
# Previene commits con información sensible

echo "🔍 Verificando seguridad antes del commit..."

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

has_errors=0

# 1. Verificar que no se commiteen archivos .env
echo "1️⃣ Verificando archivos .env..."
if git diff --cached --name-only | grep -E "\.env$|\.env\."; then
    echo -e "${RED}❌ ERROR: Intentando commitear archivos .env${NC}"
    echo "   Archivos detectados:"
    git diff --cached --name-only | grep -E "\.env$|\.env\." | sed 's/^/   - /'
    has_errors=1
else
    echo -e "${GREEN}✅ No se encontraron archivos .env${NC}"
fi

# 2. Verificar que no se commiteen bases de datos
echo "2️⃣ Verificando bases de datos..."
if git diff --cached --name-only | grep -E "\.db$|\.sqlite$|\.sqlite3$"; then
    echo -e "${RED}❌ ERROR: Intentando commitear archivos de base de datos${NC}"
    echo "   Archivos detectados:"
    git diff --cached --name-only | grep -E "\.db$|\.sqlite$|\.sqlite3$" | sed 's/^/   - /'
    has_errors=1
else
    echo -e "${GREEN}✅ No se encontraron bases de datos${NC}"
fi

# 3. Verificar que no se commiteen sesiones de WhatsApp
echo "3️⃣ Verificando sesiones de WhatsApp..."
if git diff --cached --name-only | grep -E "\.session\.json$|auth_info/"; then
    echo -e "${RED}❌ ERROR: Intentando commitear sesiones de WhatsApp${NC}"
    echo "   Archivos detectados:"
    git diff --cached --name-only | grep -E "\.session\.json$|auth_info/" | sed 's/^/   - /'
    has_errors=1
else
    echo -e "${GREEN}✅ No se encontraron sesiones de WhatsApp${NC}"
fi

# 4. Buscar claves API en el código
echo "4️⃣ Buscando claves API en el código..."
if git diff --cached | grep -E "sk-ant-api03-[A-Za-z0-9]{100,}|JWT_SECRET.*=.*['\"][^'\"]{32,}"; then
    echo -e "${YELLOW}⚠️  ADVERTENCIA: Posibles claves API en el código${NC}"
    echo "   Revisa manualmente antes de continuar"
    has_errors=1
else
    echo -e "${GREEN}✅ No se encontraron claves API hardcodeadas${NC}"
fi

# 5. Verificar credenciales
echo "5️⃣ Verificando credenciales..."
if git diff --cached --name-only | grep -E "credentials\.json$|\.pem$|\.key$|\.cert$"; then
    echo -e "${RED}❌ ERROR: Intentando commitear archivos de credenciales${NC}"
    echo "   Archivos detectados:"
    git diff --cached --name-only | grep -E "credentials\.json$|\.pem$|\.key$|\.cert$" | sed 's/^/   - /'
    has_errors=1
else
    echo -e "${GREEN}✅ No se encontraron archivos de credenciales${NC}"
fi

echo ""
echo "=================================================="

if [ $has_errors -eq 1 ]; then
    echo -e "${RED}❌ COMMIT BLOQUEADO${NC}"
    echo "   Se detectaron problemas de seguridad"
    echo "   Por favor, corrige los errores antes de commitear"
    echo ""
    echo "💡 Sugerencias:"
    echo "   - Verifica que los archivos sensibles estén en .gitignore"
    echo "   - Usa 'git reset HEAD <archivo>' para quitar archivos del staging"
    echo "   - Revisa el contenido de los archivos antes de commitear"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ VERIFICACIÓN EXITOSA${NC}"
    echo "   No se detectaron problemas de seguridad"
    echo ""
    exit 0
fi
