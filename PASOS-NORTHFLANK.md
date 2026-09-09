# Publicar Kroma en Northflank (gratis y no se duerme)

El código ya está en GitHub: https://github.com/NubePruebas/UNO  
Front y back salen **juntos** en un solo link. No subas el cliente a otra página.

Copia esta guía en una pestaña y abre Northflank en otra. Marca cada casilla.

---

## Antes de empezar (léelo una vez)

- Plan: **Developer Sandbox** (gratis). **No** elijas Pay as you go.
- Te van a pedir **tarjeta**. Es para verificar la cuenta. En Sandbox, con **1 solo servicio** y el plan de cómputo más chico, **no te deben cobrar**.
- En Billing, pon una alerta de **1 USD**. Si algún día te sales del sandbox, te avisan.
- **No** crees base de datos, ni un segundo servicio, ni más de 1 instancia.
- **No** agregues la variable `VITE_API_URL`. Si la pones, el juego se rompe.

---

## Paso 1 — Cuenta

1. Entra a [https://northflank.com](https://northflank.com)
2. **Sign up** / **Start for free** con **GitHub**.
3. Cuando pregunte el plan, elige **Developer Sandbox** (Free).
4. Agrega una tarjeta (Visa/Mastercard). Confirma que el plan sigue siendo Sandbox.

---

## Paso 2 — Conectar GitHub

1. En Northflank: menú del equipo → **Git** / **Git integrations**.
2. **Link GitHub**.
3. En GitHub instala la app **Northflank**.
4. Elige tu usuario (**NubePruebas**), no “all repos” si no quieres.
5. Da acceso **solo** al repo **`UNO`**.
6. Guarda. Debes volver a Northflank y ver GitHub conectado.

Si el repo no aparece después: GitHub → Settings → Applications → Northflank → **Configure** → marca `UNO`.

---

## Paso 3 — Proyecto

1. Arriba a la derecha: **Create new** → **Project**.
2. Llena exactamente esto:

| Campo | Qué poner |
| --- | --- |
| Name | `kroma` |
| Region | **US East1** o **US Central** (lo más cerca de México) |

3. **Create project**.

La región ya no se cambia. No elijas Europa.

---

## Paso 4 — Servicio (aquí se publica el juego)

1. Dentro del proyecto: **Create new** → **Service**.
2. Tipo: **Combined** (build + deploy en uno).
3. Copia estos valores:

| Campo | Qué poner |
| --- | --- |
| Name | `kroma` |
| Repository | `NubePruebas/UNO` |
| Branch | `main` |
| Build options | **Dockerfile** |
| Dockerfile path | `/Dockerfile` |
| Docker work directory | `/` |

4. **Environment variables:** no agregues nada.
5. **Networking / Ports:**

| Campo | Qué poner |
| --- | --- |
| Port | `3010` |
| Protocol | **HTTP** |
| Public | **sí** (exponer a internet) |
| Name | `web` |

Si el Dockerfile ya muestra el puerto 3010, déjalo público. No uses TCP.

6. **Resources:** lo más chico que deje el Sandbox (a veces sale como `nf-compute-10`). **1 instancia**. No subas CPU/RAM.
7. **Advanced → Health checks** (si lo ves):

| Campo | Qué poner |
| --- | --- |
| Type | liveness (o el que ofrezca HTTP) |
| Protocol | HTTP |
| Path | `/health` |
| Port | `3010` |

8. **Create service**.

---

## Paso 5 — Esperar el deploy

1. Se abre el dashboard del servicio. El **build** tarda unos minutos (instala Node y arma cliente + servidor).
2. Mira **Build logs**. Tiene que terminar en verde / success.
3. Luego el contenedor pasa a **Running**.
4. En la cabecera del servicio copia el **Public DNS** / URL. Es algo así:

`https://web--kroma--kroma.code.run`

(el texto exacto cambia; usa el que te muestre Northflank)

---

## Paso 6 — Probar

Abre en el navegador:

1. `https://TU-URL/health`  
   Debe verse: `"estado":"ok"` y `"servicio":"kroma"`.
2. `https://TU-URL`  
   Debe abrir la portada de Kroma.
3. Crea una sala, entra, juega una carta. El chat y los turnos tienen que responder al momento.

Ese URL es el que pegas en tu **página de juegos**, en un botón **Jugar Kroma**.  
No hace falta un segundo link de “backend”.

---

## Paso 7 — Dejarlo automático

En el servicio, arriba:

- **CI** = encendido (construye cada `git push` a `main`)
- **CD** = encendido (publica el build nuevo)

A partir de aquí, si actualizas el repo, Northflank vuelve a publicar solo.

---

## Página de juegos

Un botón o un link:

**Jugar Kroma** → `https://TU-URL-DE-NORTHFLANK`

No lo pongas en una subcarpeta (`tudominio.com/kroma/`). Tiene que ser ese URL completo, o un dominio propio apuntando a Northflank (Settings → Domains, después).

---

## Si algo falla

| Qué ves | Qué hacer |
| --- | --- |
| El repo `UNO` no sale en la lista | Paso 2: da acceso al repo en la app de GitHub |
| Build rojo | Abre Build logs y copia el error (casi siempre `npm` o memoria) |
| Running pero “site can’t be reached” | Ports: 3010, HTTP, **público** |
| La página carga pero no entra a la sala | Confirma que el puerto es HTTP (no TCP) y que **no** existe `VITE_API_URL` |
| Pide upgrade / cobro | Estás fuera del Sandbox o creaste otro servicio. Deja **1** servicio y el cómputo más chico |
| Health check rojo | Path `/health`, puerto `3010` |

Cuando tengas el URL público, úsalo en tu página de juegos. Si el log sale rojo, copia el error y lo vemos.
