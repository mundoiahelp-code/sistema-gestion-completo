from PIL import Image
import os

# Rutas
logo_completo = "landing/public/screenshots/logo-clodeb.png"
logo_solo = "landing/public/screenshots/logo-solo-clodeb.png"

# Abrir logos originales
img_completo = Image.open(logo_completo)
img_solo = Image.open(logo_solo)

print(f"Logo completo: {img_completo.size}")
print(f"Logo solo: {img_solo.size}")

# Definir todos los tamaños necesarios basados en los logos viejos
tamaños = {
    # Sistema - favicons
    "sistema/public/favicon.ico": (32, 32),
    "sistema/public/favicons/favicon-16x16.png": (16, 16),
    "sistema/public/favicons/favicon-32x32.png": (32, 32),
    "sistema/public/favicons/apple-touch-icon.png": (180, 180),
    
    # Sistema - logo icon (solo manzana)
    "sistema/public/images/logo-icon.png": (512, 512),  # Alta resolución para que se vea bien
    
    # Sistema - logo completo
    "sistema/public/images/logo.png": (800, 200),  # Proporción para logo completo
    
    # Landing - logos
    "landing/public/screenshots/logo.png": (800, 200),  # Logo completo
    "landing/public/screenshots/logo-dark.png": (512, 512),  # Solo manzana
}

# Redimensionar y guardar
for ruta, tamaño in tamaños.items():
    # Determinar si usar logo completo o solo
    if "icon" in ruta or "favicon" in ruta or "dark" in ruta or "apple-touch" in ruta:
        # Usar logo solo (manzana)
        img = img_solo.copy()
    else:
        # Usar logo completo
        img = img_completo.copy()
    
    # Redimensionar manteniendo aspecto y centrando
    img.thumbnail(tamaño, Image.Resampling.LANCZOS)
    
    # Crear imagen con fondo transparente del tamaño exacto
    nueva_img = Image.new('RGBA', tamaño, (0, 0, 0, 0))
    
    # Centrar la imagen redimensionada
    x = (tamaño[0] - img.size[0]) // 2
    y = (tamaño[1] - img.size[1]) // 2
    nueva_img.paste(img, (x, y), img if img.mode == 'RGBA' else None)
    
    # Crear directorio si no existe
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    
    # Guardar
    if ruta.endswith('.ico'):
        nueva_img.save(ruta, format='ICO', sizes=[(32, 32)])
    else:
        nueva_img.save(ruta, 'PNG')
    
    print(f"✓ Creado: {ruta} ({tamaño[0]}x{tamaño[1]})")

print("\n¡Todos los logos redimensionados correctamente!")
