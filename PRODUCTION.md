# Mapa Sonoro - Production Deployment Guide

## Auto-Initialized Garage S3

Para **producción en Coolify**, usa `docker-compose.prod.yml` que incluye auto-inicialización de Garage.

### Diferencias vs Desarrollo

| Aspecto | Desarrollo (`docker-compose.yml`) | Producción (`docker-compose.prod.yml`) |
|---------|-----------------------------------|---------------------------------------|
| Garage Image | `dxflrs/garage:v2.2.0` | Custom build con auto-init |
| Inicialización | Manual (comandos `garage layout`) | **Automática** al primer inicio |
| Configuración | Interactiva | Variables de entorno |

---

## Deploy en Coolify

### 1. Variables de entorno requeridas

```env
# Database
POSTGRES_USER=soundmap
POSTGRES_PASSWORD=strong_password_here
POSTGRES_DB=soundmap

# Garage S3
GARAGE_CAPACITY=50G              # Capacidad del nodo
GARAGE_ZONE=coolify-prod         # Zona del cluster
GARAGE_ADMIN_TOKEN=a1b2c3d4...   # Token del archivo admin_token

# App
S3_ACCESS_KEY=GK...              # Generado después del primer inicio
S3_SECRET_KEY=...                # Generado después del primer inicio
```

### 2. Primer despliegue

```bash
# Build de la imagen custom de Garage
docker compose -f docker-compose.prod.yml build garage

# Iniciar servicios
docker compose -f docker-compose.prod.yml up -d
```

**El script de auto-init hará:**
1. ✅ Detectar el Node ID automáticamente
2. ✅ Asignar rol con capacidad configurada
3. ✅ Aplicar layout version 1
4. ✅ Marcar cluster como "Healthy"

### 3. Crear claves S3 (solo primera vez)

```bash
docker exec soundmap-garage /garage key create soundmap-app
```

Copia las claves generadas y actualiza las variables de entorno en Coolify.

---

## Desarrollo Local

Para desarrollo local, sigue usando `docker-compose.yml` (configuración manual más transparente para debugging).

---

## Ventajas del Auto-Init

- ✅ **Zero-touch deployment** en Coolify
- ✅ **Idempotente** - no rompe si ya está configurado
- ✅ **Configurable** via ENV vars (`GARAGE_CAPACITY`, `GARAGE_ZONE`)
- ✅ **Healthcheck mejorado** con `start_period: 30s`
