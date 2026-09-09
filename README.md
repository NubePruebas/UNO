# Kroma

Juego de cartas de colores. Partidas a 500 puntos, mesa en vivo, bots, chat y salas con código.

No está afiliado a Mattel ni a ninguna marca comercial de cartas.

## Publicar (recomendado: Northflank)

Gratis, no se duerme, un solo link HTTPS para front y back.

La guía clic a clic está en **[PASOS-NORTHFLANK.md](PASOS-NORTHFLANK.md)**.

Resumen: cuenta Sandbox en [northflank.com](https://northflank.com) → GitHub (`NubePruebas/UNO`) → proyecto `kroma` → Combined service, Dockerfile, puerto **3010** público HTTP. El URL que te den (tipo `*.code.run`) es el de tu página de juegos.

## Qué poner en tu página de juegos

Un botón **Jugar Kroma** que abra el URL de Northflank.  
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
