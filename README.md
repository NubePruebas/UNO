# Kroma

Juego de cartas de colores. Partidas a 500 puntos, mesa en vivo, bots, chat y salas con código.

No está afiliado a Mattel ni a ninguna marca comercial de cartas.

## Publicar en Render (sin tarjeta)

Un solo link HTTPS: cliente y servidor juntos. Puedes ir subiendo más juegos en la misma cuenta.

**Guía clic a clic:** [PASOS-RENDER.md](PASOS-RENDER.md)

1. Entra a [https://dashboard.render.com](https://dashboard.render.com) con GitHub (no pongas tarjeta).
2. **New + → Blueprint** → repo `NubePruebas/UNO` → **Apply**.
3. Espera a que quede Live. El URL es tipo `https://kroma-xxxx.onrender.com`.
4. Prueba `/health` y la portada. Ese URL va en tu página de juegos.

Si no ves Blueprint: Web Service, Build `npm run build`, Start `npm start`, instance **Free**. El archivo `render.yaml` ya trae esos valores.

El plan Free se duerme ~15 min sin visitas; el siguiente click tarda un poco.

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
