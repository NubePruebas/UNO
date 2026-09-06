import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GestorSalas } from './salas';
import { ipLan } from './publico';
import { PUERTO } from './types';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ estado: 'ok', servicio: 'uno-lan', version: '1.1.0' });
});

app.get('/api/lan', (_req, res) => {
  res.json({
    ip: ipLan(),
    puertoApi: PUERTO,
    puertoJuego: 5174,
  });
});

const dist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const gestor = new GestorSalas(io);
io.on('connection', (socket) => gestor.conectar(socket));

httpServer.listen(PUERTO, '0.0.0.0', () => {
  const ip = ipLan() ?? 'localhost';
  console.log(`Uno LAN backend en http://localhost:${PUERTO}`);
  console.log(`En la red local: http://${ip}:${PUERTO}`);
});
