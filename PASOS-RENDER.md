# Publicar Kroma en Render (sin tarjeta)

El código ya está en GitHub: https://github.com/NubePruebas/UNO  
Este repo trae `render.yaml`: Render lee ese archivo y arma el Web Service solo.

Front y back salen **juntos** en un solo link. No pidas Postgres ni Redis.

Copia esta guía en una pestaña y abre Render en otra.

---

## Antes de empezar

- **No piden tarjeta** en el plan Free.
- Cada juego = un Web Service. Kroma hoy; los demás cuando los termines (hasta 25 en Hobby).
- El Free **se duerme** ~15 min sin visitas. El siguiente click tarda ~30–60 s.
- **No** agregues `VITE_API_URL`.
- Si pregunta plan de pago o tarjeta: cancela y elige **Free**.

---

## Paso 1 — Cuenta

1. Entra a [https://dashboard.render.com](https://dashboard.render.com)
2. **Sign in with GitHub**.
3. Autoriza el repo **`UNO`** (o todos tus repos, si prefieres).
4. Workspace **Hobby**. No agregues método de pago.

---

## Paso 2 — Publicar con el Blueprint (recomendado)

Así Render usa el `render.yaml` del repo (nombre, Node 20, build, start, `/health`, Free).

1. Dashboard → **New +** → **Blueprint**.
2. Conecta GitHub si hace falta.
3. Elige el repo **`NubePruebas/UNO`**, rama **`main`**.
4. Render muestra el servicio **kroma**. Confirma que el plan sea **Free**.
5. **Apply** / **Apply Blueprint**.

Espera el primer deploy (varios minutos). En **Logs** debe terminar en Live.

---

## Paso 2b — Si no ves Blueprint

1. **New +** → **Web Service**.
2. **Build and deploy from a Git repository** → **`NubePruebas/UNO`**.
3. Copia esto:

| Campo | Valor |
| --- | --- |
| Name | `kroma` |
| Language | Node |
| Branch | `main` |
| Region | Oregon |
| Root Directory | (vacío) |
| Build Command | `npm run build` |
| Start Command | `npm start` |
| Instance | **Free** |

4. Environment: `NODE_VERSION` = `20` (si no está). Nada de `VITE_API_URL`.
5. **Deploy Web Service**.

---

## Paso 3 — Probar

Cuando el servicio esté **Live**, copia el URL (`https://kroma.onrender.com` o `https://kroma-xxxx.onrender.com`).

1. `https://TU-URL/health` → `"servicio":"kroma"`
2. `https://TU-URL` → portada de Kroma
3. Crea una sala y juega una carta

El primer click puede tardar si estaba dormido. Luego corre normal.

Settings → **Auto-Deploy** déjalo en **On** (cada `git push` a `main` vuelve a publicar).

---

## Paso 4 — Página de juegos

Un botón **Jugar Kroma** que abra ese URL.  
No hace falta un segundo link de backend. El código de sala y el QR ya usan esa misma dirección.

---

## Los otros juegos (más adelante)

Misma cuenta de Render. Cuando un juego esté listo:

1. Su propio repo en GitHub (con `package.json` raíz, `npm run build` y `npm start`, como Kroma).
2. **New + → Web Service** (o Blueprint si le pones un `render.yaml`).
3. Instance **Free**.
4. Un URL por juego → un botón en tu página.

No subas los 10 hoy. Kroma es el primero.

Render da **750 horas/mes** compartidas. Los servicios dormidos **no** gastan horas.

---

## Si algo falla

| Qué ves | Qué hacer |
| --- | --- |
| Pide tarjeta | Elegiste un plan de pago. Elige **Free** |
| Build rojo | Abre **Logs** del build y copia el error |
| URL no abre | Espera Live; el primer click puede tardar 1 min |
| La página carga pero no hay salas | No pongas `VITE_API_URL` |
| Health check failed | Debe existir `GET /health` (ya está en este repo) |
| Free hours exhausted | Se acabaron las 750 h; espera al mes siguiente |
