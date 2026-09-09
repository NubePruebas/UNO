# Publicar Kroma en Render (sin tarjeta)

El código ya está en GitHub: https://github.com/NubePruebas/UNO  
Front y back salen **juntos** en un solo link.

Copia esta guía en una pestaña y abre Render en otra.

---

## Antes de empezar

- **No piden tarjeta** para el plan Free.
- Cada juego = **un Web Service** en la misma cuenta. Puedes ir creando más conforme los termines (Kroma hoy, los otros después). Hobby deja hasta 25 servicios.
- El Free **se duerme** a los ~15 minutos sin visitas. El siguiente click tarda ~30–60 s. No se “apaga para siempre”.
- **No** agregues la variable `VITE_API_URL`.
- **No** crees Postgres ni Redis. Kroma no los necesita.

---

## Paso 1 — Cuenta

1. Entra a [https://render.com](https://render.com)
2. **Get Started** / **Sign in** con **GitHub**.
3. Autoriza a Render a ver tus repos (al menos `UNO`).
4. Si pregunta plan, elige **Hobby** / Free. **No** pongas método de pago.

---

## Paso 2 — Web Service de Kroma

1. Dashboard → **New +** → **Web Service**.
2. **Build and deploy from a Git repository** → conecta GitHub si no está.
3. Elige el repo **`NubePruebas/UNO`**.
4. Llena exactamente esto:

| Campo | Qué poner |
| --- | --- |
| Name | `kroma` |
| Language | **Node** |
| Branch | `main` |
| Region | **Oregon** (o la que te ofrezca en EE.UU.) |
| Root Directory | (vacío) |
| Build Command | `npm run build` |
| Start Command | `npm start` |
| Instance type | **Free** |

5. **Environment** (opcional): solo si no detecta Node 20:

| Key | Value |
| --- | --- |
| `NODE_VERSION` | `20` |

No pongas `VITE_API_URL`.

6. **Deploy Web Service**.

---

## Paso 3 — Esperar y probar

1. Abre **Logs**. El build instala cliente + servidor (unos minutos).
2. Cuando diga que está live, copia el URL (tipo `https://kroma.onrender.com` o `https://kroma-xxxx.onrender.com`).
3. Prueba:

- `https://TU-URL/health` → `"servicio":"kroma"`
- `https://TU-URL` → portada de Kroma
- Crea una sala y juega una carta

Si el primer click tarda, es el despertar del Free. Luego corre normal.

---

## Paso 4 — Página de juegos

Botón **Jugar Kroma** → ese URL de Render.  
No hace falta un segundo link de backend.

---

## Los otros ~10 juegos (más adelante)

Misma cuenta de Render. Cuando un juego esté listo:

1. Sube ese proyecto a **su propio repo** de GitHub.
2. En Render: **New + → Web Service** → ese repo.
3. Misma receta: `npm run build` / `npm start` / **Free** (si el proyecto está armado igual que Kroma: un `package.json` en la raíz).
4. Cada uno te da **su propio URL**. En tu página de juegos, un botón por juego.

No hace falta hacer los 10 hoy. Kroma es el primero.

Si varios están “despiertos” mucho tiempo, Render tiene **750 horas al mes** compartidas. Los que están dormidos **no** gastan horas. Para una página de juegos con visitas de vez en cuando alcanza.

---

## Si algo falla

| Qué ves | Qué hacer |
| --- | --- |
| Pide tarjeta | Estás eligiendo un plan de pago. Vuelve y marca **Free** |
| Build rojo | Copia el log (Build) |
| URL no abre | Espera a que el deploy ponga Live; el primer click puede tardar 1 min |
| La página carga pero no hay salas | No pongas `VITE_API_URL`; el puerto lo pone Render solo (`PORT`) |
| “Free hours exhausted” | Se acabaron las 750 h del mes; espera al 1 del mes siguiente o deja que duerman |
