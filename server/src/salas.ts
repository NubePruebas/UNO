import { Server, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { ejecutarTurnoBot, nombreBot, delayPensar } from './engine/bots';
import {
  acusarUno,
  decirUno,
  forzarTimeoutTurno,
  intercambiarManos,
  jugarCarta,
  pasarTurno,
  pinAleatorio,
  repartir,
  resolverMas4,
  robarCarta,
} from './engine/reglas';
import { cargarPartidas, guardarPartidas } from './persistencia';
import { codigoSala, estadoPublico } from './publico';
import {
  ColorCarta,
  EstadoPartida,
  Jugador,
  MAX_JUGADORES,
  MAX_PARTIDAS,
  NivelBot,
  REGLAS_DEFAULT,
  ReglasCasa,
} from './types';

export class GestorSalas {
  private partidas: Record<string, EstadoPartida> = cargarPartidas();
  private porSocket = new Map<string, { partidaId: string; jugadorId: string }>();
  private timersBot = new Map<string, NodeJS.Timeout>();
  private timersTurno = new Map<string, NodeJS.Timeout>();
  private timersRonda = new Map<string, NodeJS.Timeout>();
  private creaPorIp = new Map<string, number[]>();
  private chatPorSocket = new Map<string, number[]>();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  conectar(socket: Socket): void {
    const ackWrap = (fn: () => unknown, ack?: Function) => {
      try {
        ack?.(fn());
      } catch (e) {
        ack?.({ ok: false, error: (e as Error).message });
      }
    };

    socket.on('crearSala', (payload: { nombre: string }, ack?: Function) => {
      ackWrap(() => this.crearSala(String(payload?.nombre || '').trim(), socket), ack);
    });
    socket.on(
      'unirseSala',
      (payload: { codigo: string; nombre: string; jugadorId?: string }, ack?: Function) => {
        ackWrap(
          () =>
            this.unirse(
              String(payload?.codigo || '').trim().toUpperCase(),
              String(payload?.nombre || '').trim(),
              socket,
              payload?.jugadorId,
            ),
          ack,
        );
      },
    );
    socket.on('reanudarPin', (payload: { codigo: string; pin: string; nombre?: string }, ack?: Function) => {
      ackWrap(
        () =>
          this.reanudarPin(
            String(payload?.codigo || '').trim().toUpperCase(),
            String(payload?.pin || '').trim(),
            socket,
            payload?.nombre,
          ),
        ack,
      );
    });
    socket.on('reconectar', (payload: { partidaId: string; jugadorId: string }, ack?: Function) => {
      ackWrap(() => this.reconectar(payload?.partidaId, payload?.jugadorId, socket), ack);
    });
    socket.on('agregarBot', (payload: { nivel: NivelBot }, ack?: Function) => {
      ackWrap(() => this.agregarBot(socket, payload?.nivel), ack);
    });
    socket.on('quitarBot', (payload: { jugadorId: string }, ack?: Function) => {
      ackWrap(() => this.quitarJugador(socket, payload?.jugadorId, true), ack);
    });
    socket.on('echarJugador', (payload: { jugadorId: string }, ack?: Function) => {
      ackWrap(() => this.quitarJugador(socket, payload?.jugadorId, false), ack);
    });
    socket.on('salirSala', (_p: unknown, ack?: Function) => {
      ackWrap(() => this.salirSala(socket), ack);
    });
    socket.on('iniciarPartida', (_p: unknown, ack?: Function) => {
      ackWrap(() => this.iniciar(socket), ack);
    });
    socket.on('partidaRapida', (payload: { nombre: string; nivel?: NivelBot; bots?: number }, ack?: Function) => {
      ackWrap(
        () => this.partidaRapida(String(payload?.nombre || '').trim(), payload?.nivel, socket, payload?.bots),
        ack,
      );
    });
    socket.on('actualizarReglas', (payload: Partial<ReglasCasa>, ack?: Function) => {
      ackWrap(() => this.actualizarReglas(socket, payload), ack);
    });
    socket.on(
      'jugarCarta',
      (payload: { cartaId: string; color?: ColorCarta; objetivoId?: string }, ack?: Function) => {
        ackWrap(() => this.accionJugar(socket, payload?.cartaId, payload?.color, payload?.objetivoId), ack);
      },
    );
    socket.on('robar', (_p: unknown, ack?: Function) => ackWrap(() => this.accionRobar(socket), ack));
    socket.on('pasar', (_p: unknown, ack?: Function) => ackWrap(() => this.accionPasar(socket), ack));
    socket.on('decirUno', (_p: unknown, ack?: Function) => ackWrap(() => this.accionUno(socket), ack));
    socket.on('acusarUno', (payload: { objetivoId: string }, ack?: Function) => {
      ackWrap(() => this.accionAcusar(socket, payload?.objetivoId), ack);
    });
    socket.on('resolverMas4', (payload: { desafiar: boolean }, ack?: Function) => {
      ackWrap(() => this.accionMas4(socket, Boolean(payload?.desafiar)), ack);
    });
    socket.on('intercambiar', (payload: { objetivoId: string }, ack?: Function) => {
      ackWrap(() => this.accionIntercambio(socket, payload?.objetivoId), ack);
    });
    socket.on('nuevaRonda', (_p: unknown, ack?: Function) => ackWrap(() => this.nuevaRonda(socket), ack));
    socket.on('nuevaPartida', (_p: unknown, ack?: Function) => ackWrap(() => this.nuevaPartida(socket), ack));
    socket.on('chat', (payload: { texto: string }, ack?: Function) => {
      ackWrap(() => this.chat(socket, String(payload?.texto || '')), ack);
    });
    socket.on('disconnect', () => this.desconectar(socket));
  }

  private nuevoJugador(nombre: string, socketId: string, usadosPin: string[]): Jugador {
    return {
      id: uuid(),
      nombre: limpiarNombre(nombre),
      esBot: false,
      cartas: [],
      conectado: true,
      socketId,
      dijoUno: false,
      pin: pinAleatorio(usadosPin),
      puntos: 0,
    };
  }

  private crearSala(nombre: string, socket: Socket) {
    const limpio = limpiarNombre(nombre);
    if (limpio.length < 2) return { ok: false, error: 'El nombre debe tener al menos 2 letras.' };
    if (Object.keys(this.partidas).length >= MAX_PARTIDAS) {
      return { ok: false, error: 'El servidor está lleno. Prueba más tarde.' };
    }
    if (!this.puedeCrear(socket)) {
      return { ok: false, error: 'Creaste demasiadas salas. Espera un rato.' };
    }
    const id = uuid();
    const codigo = this.codigoUnico();
    const jugador = this.nuevoJugador(limpio, socket.id, []);
    const partida: EstadoPartida = {
      id,
      codigo,
      hostId: jugador.id,
      jugadores: [jugador],
      mazo: [],
      descarte: [],
      colorActual: 'rojo',
      sentido: 1,
      turnoIndex: 0,
      fase: 'lobby',
      acumuladoMas: 0,
      turnoHasta: 0,
      reglas: { ...REGLAS_DEFAULT },
      chat: [],
      log: [],
      maxJugadores: MAX_JUGADORES,
      creadoEn: Date.now(),
      actualizadoEn: Date.now(),
    };
    this.partidas[id] = partida;
    this.vincular(socket, partida, jugador.id);
    this.persistir();
    this.emitir(partida);
    return { ok: true, partidaId: id, jugadorId: jugador.id, codigo, pin: jugador.pin };
  }

  private partidaRapida(nombre: string, nivel: NivelBot | undefined, socket: Socket, bots?: number) {
    const creada = this.crearSala(nombre, socket);
    if (!creada.ok || !creada.partidaId) return creada;
    const partida = this.partidas[creada.partidaId];
    const nv: NivelBot = ['facil', 'medio', 'dificil'].includes(String(nivel)) ? (nivel as NivelBot) : 'medio';
    const nBots = Math.min(3, Math.max(1, Math.floor(Number(bots) || 1)));
    for (let i = 0; i < nBots; i++) {
      const bot: Jugador = {
        id: uuid(),
        nombre: nombreBot(nv, partida.jugadores.map((j) => j.nombre)),
        esBot: true,
        nivelBot: nv,
        cartas: [],
        conectado: true,
        dijoUno: false,
        pin: pinAleatorio(partida.jugadores.map((j) => j.pin)),
        puntos: 0,
      };
      partida.jugadores.push(bot);
    }
    repartir(partida);
    this.persistir();
    this.emitir(partida);
    this.programarBots(partida);
    this.programarTimerTurno(partida);
    return { ok: true, partidaId: partida.id, jugadorId: creada.jugadorId, codigo: partida.codigo, pin: creada.pin };
  }

  private unirse(codigo: string, nombre: string, socket: Socket, jugadorId?: string) {
    const partida = Object.values(this.partidas).find((p) => p.codigo === codigo);
    if (!partida) return { ok: false, error: 'No existe una sala con ese código.' };

    if (jugadorId) {
      const existente = partida.jugadores.find((j) => j.id === jugadorId);
      if (existente && !existente.esBot) return this.reconectar(partida.id, existente.id, socket);
    }

    if (partida.fase !== 'lobby') {
      return { ok: false, error: 'La partida ya empezó. Reanuda con el código de sala y tu PIN.' };
    }
    const limpio = limpiarNombre(nombre);
    if (limpio.length < 2) return { ok: false, error: 'El nombre debe tener al menos 2 letras.' };
    if (partida.jugadores.length >= partida.maxJugadores) return { ok: false, error: 'La sala está llena.' };

    const jugador = this.nuevoJugador(
      this.nombreUnico(partida, limpio),
      socket.id,
      partida.jugadores.map((j) => j.pin),
    );
    partida.jugadores.push(jugador);
    partida.actualizadoEn = Date.now();
    this.vincular(socket, partida, jugador.id);
    this.persistir();
    this.emitir(partida);
    return { ok: true, partidaId: partida.id, jugadorId: jugador.id, codigo: partida.codigo, pin: jugador.pin };
  }

  private reanudarPin(codigo: string, pin: string, socket: Socket, nombre?: string) {
    const partida = Object.values(this.partidas).find((p) => p.codigo === codigo);
    if (!partida) return { ok: false, error: 'No existe esa sala.' };
    const jugador = partida.jugadores.find((j) => j.pin === pin && !j.esBot);
    if (!jugador) return { ok: false, error: 'PIN incorrecto.' };
    if (nombre && nombre.trim().length >= 2) jugador.nombre = nombre.trim();
    return this.reconectar(partida.id, jugador.id, socket);
  }

  private reconectar(partidaId: string, jugadorId: string, socket: Socket) {
    const partida = this.partidas[partidaId];
    if (!partida) return { ok: false, error: 'La sala ya no está.' };
    const jugador = partida.jugadores.find((j) => j.id === jugadorId);
    if (!jugador || jugador.esBot) return { ok: false, error: 'No se pudo reconectar.' };
    jugador.conectado = true;
    jugador.socketId = socket.id;
    this.vincular(socket, partida, jugadorId);
    this.persistir();
    this.emitir(partida);
    this.programarBots(partida);
    this.programarTimerTurno(partida);
    return { ok: true, partidaId, jugadorId, codigo: partida.codigo, pin: jugador.pin };
  }

  private agregarBot(socket: Socket, nivel: NivelBot) {
    const ctx = this.contextoHost(socket);
    if (!ctx.ok) return ctx;
    const { partida } = ctx;
    if (partida.fase !== 'lobby') return { ok: false, error: 'Solo se agregan bots en el lobby.' };
    if (partida.jugadores.length >= partida.maxJugadores) return { ok: false, error: 'Sala llena.' };
    const nv: NivelBot = ['facil', 'medio', 'dificil'].includes(nivel) ? nivel : 'facil';
    const bot: Jugador = {
      id: uuid(),
      nombre: nombreBot(nv, partida.jugadores.map((j) => j.nombre)),
      esBot: true,
      nivelBot: nv,
      cartas: [],
      conectado: true,
      dijoUno: false,
      pin: pinAleatorio(partida.jugadores.map((j) => j.pin)),
      puntos: 0,
    };
    partida.jugadores.push(bot);
    this.persistir();
    this.emitir(partida);
    return { ok: true };
  }

  private quitarJugador(socket: Socket, jugadorId: string, soloBots: boolean) {
    const ctx = this.contextoHost(socket);
    if (!ctx.ok) return ctx;
    const { partida } = ctx;
    const j = partida.jugadores.find((p) => p.id === jugadorId);
    if (!j) return { ok: false, error: 'No está en la sala.' };
    if (j.id === partida.hostId) return { ok: false, error: 'No puedes echar al anfitrión.' };
    if (soloBots && !j.esBot) return { ok: false, error: 'Eso es un jugador, no un bot.' };
    if (partida.fase !== 'lobby' && !j.esBot) {
      this.convertirABot(j);
    } else {
      partida.jugadores = partida.jugadores.filter((p) => p.id !== jugadorId);
    }
    this.persistir();
    this.emitir(partida);
    return { ok: true };
  }

  private salirSala(socket: Socket) {
    const ctx = this.contexto(socket);
    if (!ctx.ok) return ctx;
    const { partida, jugadorId } = ctx;
    const j = partida.jugadores.find((p) => p.id === jugadorId);
    if (!j) return { ok: true };
    this.porSocket.delete(socket.id);
    socket.leave(partida.id);
    if (partida.fase === 'lobby') {
      partida.jugadores = partida.jugadores.filter((p) => p.id !== jugadorId);
      if (partida.hostId === jugadorId) this.pasarHost(partida);
      if (partida.jugadores.length === 0) delete this.partidas[partida.id];
    } else {
      this.convertirABot(j);
      if (partida.hostId === jugadorId) this.pasarHost(partida);
    }
    this.persistir();
    if (this.partidas[partida.id]) {
      this.emitir(this.partidas[partida.id]);
      this.programarBots(this.partidas[partida.id]);
    }
    return { ok: true };
  }

  private convertirABot(j: Jugador) {
    if (j.esBot) return;
    j.esBot = true;
    j.nivelBot = 'facil';
    j.conectado = true;
    j.socketId = undefined;
    if (!j.nombre.includes('(auto)')) j.nombre = `${j.nombre} (auto)`;
  }

  private pasarHost(partida: EstadoPartida) {
    const humano = partida.jugadores.find((j) => !j.esBot && j.conectado) ?? partida.jugadores.find((j) => !j.esBot);
    if (humano) partida.hostId = humano.id;
  }

  private actualizarReglas(socket: Socket, payload: Partial<ReglasCasa>) {
    const ctx = this.contextoHost(socket);
    if (!ctx.ok) return ctx;
    if (ctx.partida.fase !== 'lobby') return { ok: false, error: 'Las reglas se eligen en el lobby.' };
    const r = ctx.partida.reglas;
    if (typeof payload.apilarMas === 'boolean') r.apilarMas = payload.apilarMas;
    if (typeof payload.robarHastaJugar === 'boolean') r.robarHastaJugar = payload.robarHastaJugar;
    if (typeof payload.jumpIn === 'boolean') r.jumpIn = payload.jumpIn;
    if (typeof payload.sieteCero === 'boolean') r.sieteCero = payload.sieteCero;
    this.persistir();
    this.emitir(ctx.partida);
    return { ok: true };
  }

  private iniciar(socket: Socket) {
    const ctx = this.contextoHost(socket);
    if (!ctx.ok) return ctx;
    const { partida } = ctx;
    if (partida.fase !== 'lobby') return { ok: false, error: 'Ya está en juego.' };
    if (partida.jugadores.length < 2) return { ok: false, error: 'Se necesitan al menos 2 jugadores (puedes agregar un bot).' };
    repartir(partida);
    this.trasJugada(partida);
    return { ok: true };
  }

  private nuevaRonda(socket: Socket) {
    const ctx = this.contextoHost(socket);
    if (!ctx.ok) return ctx;
    const { partida } = ctx;
    if (partida.fase !== 'finalizada') return { ok: false, error: 'La ronda todavía no termina.' };
    if (partida.campeonId) return { ok: false, error: 'La partida ya tiene campeón. Empieza una nueva.' };
    const prev = this.timersRonda.get(partida.id);
    if (prev) clearTimeout(prev);
    partida.rondaAutoEn = undefined;
    repartir(partida);
    this.trasJugada(partida);
    return { ok: true };
  }

  private nuevaPartida(socket: Socket) {
    const ctx = this.contextoHost(socket);
    if (!ctx.ok) return ctx;
    const { partida } = ctx;
    const prev = this.timersRonda.get(partida.id);
    if (prev) clearTimeout(prev);
    partida.rondaAutoEn = undefined;
    for (const j of partida.jugadores) j.puntos = 0;
    partida.campeonId = undefined;
    partida.ganadorId = undefined;
    partida.puntosRonda = undefined;
    repartir(partida);
    this.trasJugada(partida);
    return { ok: true };
  }

  private accionJugar(socket: Socket, cartaId: string, color?: ColorCarta, objetivoId?: string) {
    const ctx = this.contexto(socket);
    if (!ctx.ok) return ctx;
    const r = jugarCarta(ctx.partida, ctx.jugadorId, cartaId, { color, objetivoId });
    if (!r.ok) return r;
    this.trasJugada(ctx.partida);
    return { ok: true };
  }

  private accionRobar(socket: Socket) {
    const ctx = this.contexto(socket);
    if (!ctx.ok) return ctx;
    if (ctx.partida.desafiarMas4 && ctx.partida.desafiarMas4.jugadorId === ctx.jugadorId) {
      const r = resolverMas4(ctx.partida, ctx.jugadorId, false);
      if (!r.ok) return r;
      this.trasJugada(ctx.partida);
      return { ok: true };
    }
    const r = robarCarta(ctx.partida, ctx.jugadorId);
    if (!r.ok) return r;
    this.trasJugada(ctx.partida);
    return { ok: true };
  }

  private accionPasar(socket: Socket) {
    const ctx = this.contexto(socket);
    if (!ctx.ok) return ctx;
    const r = pasarTurno(ctx.partida, ctx.jugadorId);
    if (!r.ok) return r;
    this.trasJugada(ctx.partida);
    return { ok: true };
  }

  private accionUno(socket: Socket) {
    const ctx = this.contexto(socket);
    if (!ctx.ok) return ctx;
    const r = decirUno(ctx.partida, ctx.jugadorId);
    if (!r.ok) return r;
    this.persistir();
    this.emitir(ctx.partida);
    return { ok: true };
  }

  private accionAcusar(socket: Socket, objetivoId: string) {
    const ctx = this.contexto(socket);
    if (!ctx.ok) return ctx;
    const r = acusarUno(ctx.partida, ctx.jugadorId, objetivoId);
    if (!r.ok) return r;
    this.persistir();
    this.emitir(ctx.partida);
    return { ok: true };
  }

  private accionMas4(socket: Socket, desafiar: boolean) {
    const ctx = this.contexto(socket);
    if (!ctx.ok) return ctx;
    const r = resolverMas4(ctx.partida, ctx.jugadorId, desafiar);
    if (!r.ok) return r;
    this.trasJugada(ctx.partida);
    return { ok: true };
  }

  private accionIntercambio(socket: Socket, objetivoId: string) {
    const ctx = this.contexto(socket);
    if (!ctx.ok) return ctx;
    const r = intercambiarManos(ctx.partida, ctx.jugadorId, objetivoId);
    if (!r.ok) return r;
    this.trasJugada(ctx.partida);
    return { ok: true };
  }

  private chat(socket: Socket, texto: string) {
    const ctx = this.contexto(socket);
    if (!ctx.ok) return ctx;
    const limpio = texto.replace(/\s+/g, ' ').trim().slice(0, 80);
    if (limpio.length < 1) return { ok: false, error: 'Escribe algo.' };
    if (!this.puedeChatear(socket.id)) return { ok: false, error: 'Chat muy seguido. Espera un segundo.' };
    const yo = ctx.partida.jugadores.find((j) => j.id === ctx.jugadorId);
    ctx.partida.chat.push({
      id: uuid(),
      jugadorId: ctx.jugadorId,
      nombre: yo?.nombre ?? 'Alguien',
      texto: limpio,
      en: Date.now(),
    });
    if (ctx.partida.chat.length > 50) ctx.partida.chat.splice(0, ctx.partida.chat.length - 50);
    this.persistir();
    this.emitir(ctx.partida);
    return { ok: true };
  }

  private desconectar(socket: Socket) {
    const ref = this.porSocket.get(socket.id);
    if (!ref) return;
    this.porSocket.delete(socket.id);
    const partida = this.partidas[ref.partidaId];
    if (!partida) return;
    const jugador = partida.jugadores.find((j) => j.id === ref.jugadorId);
    if (!jugador) return;
    jugador.conectado = false;
    jugador.socketId = undefined;
    partida.actualizadoEn = Date.now();
    this.persistir();
    this.emitir(partida);
    if (partida.fase === 'jugando') this.programarBots(partida);
  }

  private trasJugada(partida: EstadoPartida) {
    this.persistir();
    this.emitir(partida);
    this.programarBots(partida);
    this.programarTimerTurno(partida);
    this.programarRonda(partida);
  }

  private programarTimerTurno(partida: EstadoPartida) {
    const prev = this.timersTurno.get(partida.id);
    if (prev) clearTimeout(prev);
    if (partida.fase !== 'jugando' || !partida.turnoHasta) return;
    if (this.tocaBot(partida)) return;
    const ms = Math.max(200, partida.turnoHasta - Date.now());
    const t = setTimeout(() => {
      const actual = this.partidas[partida.id];
      if (!actual || actual.fase !== 'jugando') return;
      if (this.tocaBot(actual)) return;
      if (Date.now() + 50 < actual.turnoHasta) {
        this.programarTimerTurno(actual);
        return;
      }
      forzarTimeoutTurno(actual);
      this.trasJugada(actual);
    }, ms);
    this.timersTurno.set(partida.id, t);
  }

  private programarRonda(partida: EstadoPartida) {
    const prev = this.timersRonda.get(partida.id);
    if (prev) clearTimeout(prev);
    if (partida.fase !== 'finalizada' || partida.campeonId) {
      partida.rondaAutoEn = undefined;
      return;
    }
    partida.rondaAutoEn = Date.now() + 8000;
    this.emitir(partida);
    const t = setTimeout(() => {
      const actual = this.partidas[partida.id];
      if (!actual || actual.fase !== 'finalizada' || actual.campeonId) return;
      repartir(actual);
      actual.rondaAutoEn = undefined;
      this.trasJugada(actual);
    }, 8000);
    this.timersRonda.set(partida.id, t);
  }

  private programarBots(partida: EstadoPartida) {
    const prev = this.timersBot.get(partida.id);
    if (prev) clearTimeout(prev);
    if (partida.pensandoId) {
      partida.pensandoId = undefined;
    }
    if (partida.fase !== 'jugando') return;
    const hayHumanoConectado = partida.jugadores.some((j) => !j.esBot && j.conectado);
    if (!hayHumanoConectado) return;
    if (!this.tocaBot(partida)) return;
    const actor = this.actorBot(partida);
    const desconectado = this.humanoDesconectadoEnTurno(partida);
    const delay = desconectado ? 4000 : delayPensar(actor?.nivelBot);
    if (actor) partida.pensandoId = actor.id;
    this.emitir(partida);
    const t = setTimeout(() => {
      const actual = this.partidas[partida.id];
      if (!actual || actual.fase !== 'jugando') return;
      if (!this.tocaBot(actual)) {
        actual.pensandoId = undefined;
        this.emitir(actual);
        return;
      }
      ejecutarTurnoBot(actual);
      actual.pensandoId = undefined;
      this.persistir();
      this.emitir(actual);
      this.programarBots(actual);
      this.programarTimerTurno(actual);
      this.programarRonda(actual);
    }, delay);
    this.timersBot.set(partida.id, t);
  }

  private actorBot(partida: EstadoPartida): Jugador | undefined {
    if (partida.pendienteIntercambioDe) {
      return partida.jugadores.find((j) => j.id === partida.pendienteIntercambioDe);
    }
    if (partida.desafiarMas4) {
      return partida.jugadores.find((j) => j.id === partida.desafiarMas4?.jugadorId);
    }
    return partida.jugadores[partida.turnoIndex];
  }

  private tocaBot(partida: EstadoPartida): boolean {
    if (partida.pendienteIntercambioDe) {
      const de = partida.jugadores.find((j) => j.id === partida.pendienteIntercambioDe);
      return Boolean(de && (de.esBot || !de.conectado));
    }
    if (partida.desafiarMas4) {
      const victima = partida.jugadores.find((j) => j.id === partida.desafiarMas4?.jugadorId);
      return Boolean(victima && (victima.esBot || !victima.conectado));
    }
    const actual = partida.jugadores[partida.turnoIndex];
    return Boolean(actual && (actual.esBot || !actual.conectado));
  }

  private humanoDesconectadoEnTurno(partida: EstadoPartida): boolean {
    const actual = partida.jugadores[partida.turnoIndex];
    return Boolean(actual && !actual.esBot && !actual.conectado);
  }

  private puedeCrear(socket: Socket): boolean {
    const ip = socket.handshake.address || socket.id;
    const ahora = Date.now();
    const lista = (this.creaPorIp.get(ip) ?? []).filter((t) => ahora - t < 10 * 60_000);
    if (lista.length >= 8) {
      this.creaPorIp.set(ip, lista);
      return false;
    }
    lista.push(ahora);
    this.creaPorIp.set(ip, lista);
    return true;
  }

  private puedeChatear(socketId: string): boolean {
    const ahora = Date.now();
    const lista = (this.chatPorSocket.get(socketId) ?? []).filter((t) => ahora - t < 20_000);
    if (lista.length >= 8) {
      this.chatPorSocket.set(socketId, lista);
      return false;
    }
    lista.push(ahora);
    this.chatPorSocket.set(socketId, lista);
    return true;
  }

  lobbies(): { codigo: string; jugadores: number; nombres: string[] }[] {
    return Object.values(this.partidas)
      .filter((p) => p.fase === 'lobby')
      .map((p) => ({
        codigo: p.codigo,
        jugadores: p.jugadores.length,
        nombres: p.jugadores.map((j) => j.nombre),
      }));
  }

  private vincular(socket: Socket, partida: EstadoPartida, jugadorId: string) {
    this.porSocket.set(socket.id, { partidaId: partida.id, jugadorId });
    socket.join(partida.id);
  }

  private emitir(partida: EstadoPartida) {
    const sockets = this.io.sockets.adapter.rooms.get(partida.id);
    if (!sockets) return;
    for (const socketId of sockets) {
      const ref = this.porSocket.get(socketId);
      if (!ref?.jugadorId) continue;
      this.io.to(socketId).emit('estado', estadoPublico(partida, ref.jugadorId));
    }
  }

  private persistir() {
    guardarPartidas(this.partidas);
  }

  private contexto(socket: Socket): { ok: true; partida: EstadoPartida; jugadorId: string } | { ok: false; error: string } {
    const ref = this.porSocket.get(socket.id);
    if (!ref) return { ok: false, error: 'No estás en una sala.' };
    const partida = this.partidas[ref.partidaId];
    if (!partida) return { ok: false, error: 'La sala no existe.' };
    return { ok: true, partida, jugadorId: ref.jugadorId };
  }

  private contextoHost(socket: Socket) {
    const ctx = this.contexto(socket);
    if (!ctx.ok) return ctx;
    if (ctx.partida.hostId !== ctx.jugadorId) return { ok: false as const, error: 'Solo el anfitrión puede hacer eso.' };
    return ctx;
  }

  private codigoUnico(): string {
    let c = codigoSala();
    const usados = new Set(Object.values(this.partidas).map((p) => p.codigo));
    while (usados.has(c)) c = codigoSala();
    return c;
  }

  private nombreUnico(partida: EstadoPartida, nombre: string): string {
    const usados = new Set(partida.jugadores.map((j) => j.nombre));
    if (!usados.has(nombre)) return nombre;
    let i = 2;
    while (usados.has(`${nombre} ${i}`)) i++;
    return `${nombre} ${i}`;
  }
}

function limpiarNombre(nombre: string): string {
  return nombre.replace(/[\u0000-\u001f]/g, '').trim().slice(0, 16);
}
