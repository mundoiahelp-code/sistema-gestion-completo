@echo off
echo ========================================
echo   INSTALACION BACKEND - SISTEMA GESTION
echo ========================================
echo.

echo [1/5] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: No se pudieron instalar las dependencias
    pause
    exit /b 1
)
echo OK - Dependencias instaladas
echo.

echo [2/5] Verificando archivo .env...
if not exist .env (
    echo Creando archivo .env desde .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANTE: Edita el archivo .env con tus credenciales de PostgreSQL
    echo Presiona cualquier tecla cuando hayas editado el .env...
    pause
)
echo OK - Archivo .env configurado
echo.

echo [3/5] Generando cliente de Prisma...
call npm run prisma:generate
if %errorlevel% neq 0 (
    echo ERROR: No se pudo generar el cliente de Prisma
    pause
    exit /b 1
)
echo OK - Cliente de Prisma generado
echo.

echo [4/5] Ejecutando migraciones de base de datos...
call npm run prisma:migrate
if %errorlevel% neq 0 (
    echo ERROR: No se pudieron ejecutar las migraciones
    echo Verifica que PostgreSQL este corriendo y las credenciales en .env sean correctas
    pause
    exit /b 1
)
echo OK - Migraciones ejecutadas
echo.

echo [5/5] Cargando datos de prueba...
call npm run seed
if %errorlevel% neq 0 (
    echo ADVERTENCIA: No se pudieron cargar los datos de prueba
    echo Puedes continuar sin ellos
)
echo OK - Datos de prueba cargados
echo.

echo ========================================
echo   INSTALACION COMPLETADA!
echo ========================================
echo.
echo Usuarios de prueba:
echo   Admin:    admin@sistema.com / admin123
echo   Manager:  manager@sistema.com / manager123
echo   Vendedor: vendedor@sistema.com / seller123
echo.
echo Para iniciar el servidor ejecuta:
echo   npm run dev
echo.
pause
