import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GestorSalas } from './salas';
import { ipLan } from './publico';
import { puertoEscucha } from './types';

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: true }));
app.use(express.json({ limit: '32kb' }));

const PUERTO = puertoEscucha();

app.get('/health', (_req, res) => {
  res.json({ estado: 'ok', servicio: 'kroma', version: '1.2.0' });
});

app.get('/api/lan', (_req, res) => {
  res.json({
    ip: ipLan(),
    puertoApi: PUERTO,
    puertoJuego: PUERTO,
  });
});

let gestorRef: GestorSalas | null = null;
app.get('/api/salas', (_req, res) => {
  res.json({ salas: gestorRef?.lobbies() ?? [] });
});

const dist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '1h', index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(dist, 'index.html'));
  });
} else {
  console.warn('No está client/dist. En producción corre: npm run build');
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true, methods: ['GET', 'POST'] },
  maxHttpBufferSize: 1e4,
  pingTimeout: 20000,
  pingInterval: 25000,
});

const gestor = new GestorSalas(io);
gestorRef = gestor;
io.on('connection', (socket) => gestor.conectar(socket));

httpServer.listen(PUERTO, '0.0.0.0', () => {
  const ip = ipLan() ?? 'localhost';
  console.log(`Kroma en http://localhost:${PUERTO}`);
  console.log(`En la red: http://${ip}:${PUERTO}`);
});
