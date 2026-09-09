# Kroma

Juego de cartas de colores. Partidas a 500 puntos, mesa en vivo, bots, chat y salas con código.

No está afiliado a Mattel ni a ninguna marca comercial de cartas.

## Publicar (recomendado: Render, sin tarjeta)

Un solo link HTTPS para front y back. Puedes ir subiendo más juegos en la misma cuenta.

La guía clic a clic está en **[PASOS-RENDER.md](PASOS-RENDER.md)**.

Resumen: [render.com](https://render.com) con GitHub → Web Service del repo `UNO` → Build `npm run build`, Start `npm start`, instance **Free**. El URL (`https://kroma-xxxx.onrender.com`) es el de tu página de juegos.

El Free se duerme ~15 min sin visitas; el siguiente click tarda un poco. No piden tarjeta.

## Qué poner en tu página de juegos

Un botón **Jugar Kroma** que abra el URL de Render.  
No hace falta un link aparte de backend.

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
