# Kroma

Juego de cartas de colores. Partidas a 500 puntos, mesa en vivo, bots, chat y salas con código.

No está afiliado a Mattel ni a ninguna marca comercial de cartas.

## Publicar en Render (recomendado)

Ahí se quedan el **cliente y el servidor juntos**, 24/7, y te dan un link HTTPS para tu página de juegos.

1. Sube el código a GitHub (este repo).
2. Entra a [https://render.com](https://render.com) y crea una cuenta (puedes entrar con GitHub).
3. **New + → Web Service →** elige el repo `UNO` (o el que tenga Kroma).
4. Configura:
   - **Language:** Node
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Instance:** Free
5. **Deploy**. Espera a que termine (unos minutos).
6. Render te da un link tipo:

   `https://kroma-xxxx.onrender.com`

Ese es el que pegas en tu página de juegos.  
Prueba también: `https://kroma-xxxx.onrender.com/health`

El plan gratis se duerme si nadie entra un rato; el primer click puede tardar ~30 s. Para que no se duerma, usa el plan de pago (Starter).

## Qué poner en tu página de juegos

Un botón **Jugar Kroma** que abra:

`https://kroma-xxxx.onrender.com`

No hace falta un link aparte de “backend”. El front y el back van en esa misma URL.

## Desarrollo local

```
npm run dev
```

Cliente: http://localhost:5174 — servidor: 3010.

## Qué incluye

- Mesa oval, mano en abanico, cartas al descarte
- Grito **Kroma** al quedarte con una carta
- Multijugador + bots fácil / medio / difícil
- Partida rápida vs 1, 2 o 3 bots
- QR y PIN para reanudar
- Puntos hasta 500; la siguiente ronda arranca sola
- Chat, timer de 60 s, tutorial
- Modo daltónico y sonido

Tests: `npm test`
