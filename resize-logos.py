from PIL import Image
import os

def recortar_transparencia(img):
    """Recorta el espacio transparente alrededor de la imagen"""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Obtener el bounding box del contenido no transparente
    bbox = img.getbbox()
    if bbox:
        return img.crop(bbox)
    return img

# Rutas
logo_completo = "landing/public/screenshots/logo-clodeb.png"
logo_solo = "landing/public/screenshots/logo-solo-clodeb.png"

# Abrir logos originales y recortar transparencia
img_completo_original = Image.open(logo_completo)
img_solo_original = Image.open(logo_solo)

# Recortar espacios transparentes
img_completo = recortar_transparencia(img_completo_original)
img_solo = recortar_transparencia(img_solo_original)

print(f"Logo completo original: {img_completo_original.size}")
print(f"Logo completo recortado: {img_completo.size}")
print(f"Logo solo original: {img_solo_original.size}")
print(f"Logo solo recortado: {img_solo.size}")

# Definir todos los tamaños necesarios - MUCHO MÁS GRANDES
tamaños = {
    # Sistema - favicons (más grandes)
    "sistema/public/favicon.ico": (32, 32),
    "sistema/public/favicons/favicon-16x16.png": (16, 16),
    "sistema/public/favicons/favicon-32x32.png": (32, 32),
    "sistema/public/favicons/apple-touch-icon.png": (180, 180),
    
    # Sistema - logo icon (solo manzana) - MÁS GRANDE
    "sistema/public/images/logo-icon.png": (200, 200),  # Más grande para que se vea bien
    
    # Sistema - logo completo - MÁS GRANDE
    "sistema/public/images/logo.png": (400, 100),  # Más grande
    
    # Landing - logos - MÁS GRANDES
    "landing/public/screenshots/logo.png": (600, 150),  # Logo completo más grande
    "landing/public/screenshots/logo-dark.png": (200, 200),  # Solo manzana más grande
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
    
    # Redimensionar para que LLENE el espacio (sin thumbnail, con resize directo)
    # Calcular el ratio para llenar el espacio manteniendo aspecto
    ratio = min(tamaño[0] / img.size[0], tamaño[1] / img.size[1])
    nuevo_tamaño = (int(img.size[0] * ratio * 0.95), int(img.size[1] * ratio * 0.95))  # 95% para un pequeño margen
    
    img_resized = img.resize(nuevo_tamaño, Image.Resampling.LANCZOS)
    
    # Crear imagen con fondo transparente del tamaño exacto
    nueva_img = Image.new('RGBA', tamaño, (0, 0, 0, 0))
    
    # Centrar la imagen redimensionada
    x = (tamaño[0] - img_resized.size[0]) // 2
    y = (tamaño[1] - img_resized.size[1]) // 2
    nueva_img.paste(img_resized, (x, y), img_resized if img_resized.mode == 'RGBA' else None)
    
    # Crear directorio si no existe
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    
    # Guardar
    if ruta.endswith('.ico'):
        nueva_img.save(ruta, format='ICO', sizes=[(32, 32)])
    else:
        nueva_img.save(ruta, 'PNG')
    
    print(f"✓ Creado: {ruta} ({tamaño[0]}x{tamaño[1]}) - contenido: {nuevo_tamaño}")

print("\n¡Todos los logos redimensionados correctamente con máximo tamaño!")
