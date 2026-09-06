# Uno LAN

Juego de Uno para varias personas en la misma Wi‑Fi. Partida a **500 puntos**, chat, timer de 1 minuto y reglas de casa.

## Arrancar (dos terminales)

```
cd C:\Uno\server
npm install
npm run dev
```

```
cd C:\Uno\client
npm install
npm run dev
```

- En esta PC: http://localhost:5174
- En el celular: la IP que muestra el lobby (puerto **5174**) o el **QR**.
- Servidor: puerto **3010**.

## Qué hay

- Multijugador LAN + bots fácil / medio / difícil
- Partida rápida vs 1 bot
- Puntos oficiales hasta 500
- Chat, timer de turno (60 s), botón de reglas
- QR, copiar código/link/PIN para reanudar en otro dispositivo
- Reglas de casa: apilar +2/+4, robar hasta poder, jump-in, 7 y 0
- Modo daltónico, sonidos, salir de verdad
- Guardado en `server/data/partidas.json`
"# UNO" 
