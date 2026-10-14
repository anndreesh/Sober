# Sober · un día a la vez

Aplicación de bienestar personal para registrar hábitos, reflexiones, impulsos y avances. El frontend está hecho con React, TypeScript y Vite; la API usa FastAPI, SQLAlchemy y PostgreSQL.

## Ejecutar en local

1. Copia `.env.example` a `.env` y configura `SECRET_KEY` y `DATABASE_URL`.
2. Inicia PostgreSQL con `docker compose up -d postgres` o usa otra base PostgreSQL.
3. En una terminal, instala e inicia la API:

   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

4. En otra terminal, instala e inicia el frontend:

   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

La API escucha en `http://localhost:8000`; la interfaz en `http://localhost:5173`.

## Despliegue

La configuración del repositorio está preparada para Vercel y Render:

- **Supabase:** crea un proyecto PostgreSQL y copia la cadena **Session pooler** de `Connect`. Como Render puede necesitar IPv4, Session pooler evita depender de la conexión directa IPv6. Cambia el prefijo a `postgresql+psycopg://` antes de pegarla como `DATABASE_URL` en Render.
- **Render:** crea un Blueprint desde este repositorio y confirma el servicio `sober-api`. Render pedirá `DATABASE_URL`; pega ahí la cadena de Supabase. El archivo define `SECRET_KEY` generado, comando de inicio y chequeo en `/health`.
- **Vercel:** importa el repositorio desde GitHub, establece la raíz del proyecto en `frontend` y configura `VITE_API_URL` con la URL HTTPS del servicio Render, sin `/` al final. `frontend/vercel.json` instala y construye la app, y envía las rutas de React al `index.html`.
- Cuando ambos estén desplegados, verifica `https://<api-render>/health`, crea una cuenta en la URL de Vercel e inicia sesión.

El backend guarda las cuentas y sus contraseñas con hash. Por ahora, hábitos, diario e impulsos se guardan en IndexedDB del navegador y no se sincronizan entre dispositivos ni con Supabase. Para sincronizarlos hace falta completar sus endpoints y modelos de usuario antes de activar esa función.

## Comprobaciones locales

```bash
cd frontend && npm run build && npm run lint
cd ../backend && pytest
```
