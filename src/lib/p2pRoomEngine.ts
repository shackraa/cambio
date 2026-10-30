import Peer, { type DataConnection } from 'peerjs';
import type { GameEvent } from '../hooks/useRealtimeGame';

export interface RoomPlayer {
  id: string;
  nickname: string;
  avatar?: string;
  seat: number;
  is_ready: boolean;
  is_online: boolean;
  is_bot?: boolean;
}

export interface RoomData {
  id: string;
  code: string;
  status: 'waiting' | 'playing' | 'finished';
  host_id: string;
  botDifficulty?: 'casual' | 'tactical' | 'grandmaster';
  players: RoomPlayer[];
  initialGameState?: any;
}

type P2PMessage =
  | { type: 'JOIN_REQUEST'; player: { id: string; nickname: string; avatar?: string } }
  | { type: 'JOIN_REJECTED'; reason: string }
  | { type: 'ROOM_STATE_SYNC'; room: RoomData }
  | { type: 'TOGGLE_READY'; playerId: string }
  | { type: 'GAME_START_SYNC'; room: RoomData; gameState: any }
  | { type: 'GAME_ACTION'; payload: GameEvent & { fromSeat: number } }
  | { type: 'FULL_GAME_STATE_SYNC'; gameState: any };

const STORAGE_PREFIX = 'cambio_room_v6_';
const PEER_PREFIX = 'playcambio-v6-room-';

const BOT_PROFILES = [
  { seat: 1, name: 'Ahmet', avatar: '🎩' },
  { seat: 2, name: 'Zeliha', avatar: '👑' },
  { seat: 3, name: 'Mehmet', avatar: '🦁' },
];

class P2PRoomManager {
  private peer: Peer | null = null;
  private hostConnection: DataConnection | null = null;
  private guestConnections: Map<string, DataConnection> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private currentCode: string | null = null;
  private isHost = false;
  private roomListeners: Set<(room: RoomData) => void> = new Set();
  private gameActionListeners: Set<(event: GameEvent & { fromSeat: number }) => void> = new Set();
  private fullStateListeners: Set<(gameState: any) => void> = new Set();

  public getStoredRoom(code: string): RoomData | null {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + code.toUpperCase());
      if (!raw) return null;
      return JSON.parse(raw) as RoomData;
    } catch {
      return null;
    }
  }

  public saveStoredRoom(room: RoomData) {
    try {
      localStorage.setItem(STORAGE_PREFIX + room.code.toUpperCase(), JSON.stringify(room));
    } catch {
      // ignore storage quota errors
    }
  }

  private setupBroadcastChannel(code: string) {
    const cleanCode = code.toUpperCase();
    if (this.broadcastChannel && this.currentCode === cleanCode) return;
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {}
    }
    this.currentCode = cleanCode;
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel(PEER_PREFIX + cleanCode);
      this.broadcastChannel.onmessage = (ev) => {
        if (ev.data) {
          this.handleIncomingMessage(ev.data as P2PMessage);
        }
      };
    }
  }

  private broadcastMessage(msg: P2PMessage) {
    // 1. BroadcastChannel (aynı cihaz / tarayıcı sekmeleri için 0ms gecikmesiz)
    try {
      this.broadcastChannel?.postMessage(msg);
    } catch {}

    // 2. WebRTC PeerJS (farklı bilgisayar / telefonlar arası P2P)
    if (this.isHost) {
      this.guestConnections.forEach((conn) => {
        if (conn.open) {
          try {
            conn.send(msg);
          } catch {}
        }
      });
    } else if (this.hostConnection && this.hostConnection.open) {
      try {
        this.hostConnection.send(msg);
      } catch {}
    }
  }

  private notifyRoomListeners(room: RoomData) {
    this.saveStoredRoom(room);
    this.roomListeners.forEach((cb) => cb(room));
  }

  private handleIncomingMessage(msg: P2PMessage, sourceConn?: DataConnection) {
    if (!this.currentCode) return;

    if (msg.type === 'JOIN_REQUEST' && this.isHost) {
      const room = this.getStoredRoom(this.currentCode);
      if (!room) return;

      // Oyuncu zaten odada mı?
      const existing = room.players.find((p) => p.id === msg.player.id);
      if (existing) {
        existing.is_online = true;
        existing.nickname = msg.player.nickname;
        this.notifyRoomListeners(room);
        this.broadcastMessage({ type: 'ROOM_STATE_SYNC', room });
        if (sourceConn?.open) sourceConn.send({ type: 'ROOM_STATE_SYNC', room });
        return;
      }

      // Boş koltuk veya bot koltuğu bul (insan oyuncu gelirse bot koltuğunu devralabilir)
      const humanSeats = room.players.filter((p) => !p.is_bot).map((p) => p.seat);
      const freeSeat = [0, 1, 2, 3].find((s) => !humanSeats.includes(s));

      if (freeSeat === undefined) {
        if (sourceConn?.open) {
          sourceConn.send({ type: 'JOIN_REJECTED', reason: 'Oda dolu (4/4)' });
        }
        return;
      }

      // Eğer o koltukta bot varsa kaldır ve insan oyuncuyu oturt
      room.players = room.players.filter((p) => p.seat !== freeSeat);
      room.players.push({
        id: msg.player.id,
        nickname: msg.player.nickname,
        avatar: msg.player.avatar || '🎴',
        seat: freeSeat,
        is_ready: true,
        is_online: true,
        is_bot: false,
      });
      room.players.sort((a, b) => a.seat - b.seat);

      this.notifyRoomListeners(room);
      const syncMsg: P2PMessage = { type: 'ROOM_STATE_SYNC', room };
      this.broadcastMessage(syncMsg);
      if (sourceConn?.open) sourceConn.send(syncMsg);
      return;
    }

    if (msg.type === 'TOGGLE_READY' && this.isHost) {
      const room = this.getStoredRoom(this.currentCode);
      if (!room) return;
      const target = room.players.find((p) => p.id === msg.playerId);
      if (target) {
        target.is_ready = !target.is_ready;
        this.notifyRoomListeners(room);
        this.broadcastMessage({ type: 'ROOM_STATE_SYNC', room });
      }
      return;
    }

    if (msg.type === 'ROOM_STATE_SYNC') {
      this.notifyRoomListeners(msg.room);
      return;
    }

    if (msg.type === 'GAME_START_SYNC') {
      this.notifyRoomListeners(msg.room);
      this.fullStateListeners.forEach((cb) => cb(msg.gameState));
      return;
    }

    if (msg.type === 'GAME_ACTION') {
      this.gameActionListeners.forEach((cb) => cb(msg.payload));
      // Eğer Host isek diğer guest'lere de relay et
      if (this.isHost) {
        this.guestConnections.forEach((conn) => {
          if (conn !== sourceConn && conn.open) {
            try {
              conn.send(msg);
            } catch {}
          }
        });
      }
      return;
    }

    if (msg.type === 'FULL_GAME_STATE_SYNC') {
      const room = this.getStoredRoom(this.currentCode);
      if (room) {
        room.initialGameState = msg.gameState;
        this.saveStoredRoom(room);
      }
      this.fullStateListeners.forEach((cb) => cb(msg.gameState));
      return;
    }
  }

  public async createHostRoom(
    code: string,
    hostPlayer: { id: string; nickname: string; avatar?: string },
    botDifficulty: 'casual' | 'tactical' | 'grandmaster' = 'tactical'
  ): Promise<RoomData> {
    const cleanCode = code.toUpperCase();
    this.isHost = true;
    this.setupBroadcastChannel(cleanCode);

    // Varsayılan olarak Koltuk 0 = Host, Koltuk 1-3 = Botlar (Host lobide istediği botu çıkarıp arkadaşını bekleyebilir veya arkadaş katılınca bot otomatik yerini verir)
    const initialRoom: RoomData = {
      id: `room-${cleanCode}`,
      code: cleanCode,
      status: 'waiting',
      host_id: hostPlayer.id,
      botDifficulty,
      players: [
        {
          id: hostPlayer.id,
          nickname: hostPlayer.nickname,
          avatar: hostPlayer.avatar || '👑',
          seat: 0,
          is_ready: true,
          is_online: true,
          is_bot: false,
        },
        ...BOT_PROFILES.map((b) => ({
          id: `bot-${b.seat}`,
          nickname: b.name,
          avatar: b.avatar,
          seat: b.seat,
          is_ready: true,
          is_online: true,
          is_bot: true,
        })),
      ],
    };

    this.saveStoredRoom(initialRoom);

    // PeerJS Host kaydını arka planda başlat (UI'ı hiç bloklamaz)
    this.initHostPeer(cleanCode);

    return initialRoom;
  }

  private initHostPeer(cleanCode: string) {
    try {
      if (this.peer) {
        this.peer.destroy();
      }
      const peer = new Peer(PEER_PREFIX + cleanCode);
      this.peer = peer;

      peer.on('connection', (conn) => {
        this.guestConnections.set(conn.peer, conn);
        conn.on('data', (data) => {
          this.handleIncomingMessage(data as P2PMessage, conn);
        });
        conn.on('open', () => {
          const room = this.getStoredRoom(cleanCode);
          if (room) {
            conn.send({ type: 'ROOM_STATE_SYNC', room });
          }
        });
        conn.on('close', () => {
          this.guestConnections.delete(conn.peer);
        });
      });

      peer.on('error', () => {
        // PeerJS bulut sinyal sunucusu erişilemezse bile BroadcastChannel + Local mod kesintisiz çalışır
      });
    } catch {
      // ignore PeerJS init errors
    }
  }

  public async joinRoomAsGuest(
    code: string,
    guestPlayer: { id: string; nickname: string; avatar?: string }
  ): Promise<{ room: RoomData; seat: number }> {
    const cleanCode = code.toUpperCase();
    this.isHost = false;
    this.setupBroadcastChannel(cleanCode);

    return new Promise((resolve, reject) => {
      let settled = false;

      const finishJoin = (room: RoomData) => {
        if (settled) return;
        const me = room.players.find((p) => p.id === guestPlayer.id);
        if (me) {
          settled = true;
          cleanup();
          resolve({ room, seat: me.seat });
        }
      };

      const unsub = this.onRoomUpdate(finishJoin);

      const cleanup = () => {
        unsub();
      };

      // 1. Önce aynı tarayıcı / localStorage üzerinden oda var mı kontrol et
      const localRoom = this.getStoredRoom(cleanCode);
      if (localRoom) {
        this.broadcastMessage({ type: 'JOIN_REQUEST', player: guestPlayer });
        // Eğer Host sekmesi açıksa BroadcastChannel cevap verir, değilse localRoom üzerinden koltuk ata
        setTimeout(() => {
          if (!settled) {
            const updated = this.getStoredRoom(cleanCode) || localRoom;
            let me = updated.players.find((p) => p.id === guestPlayer.id);
            if (!me) {
              const humanSeats = updated.players.filter((p) => !p.is_bot).map((p) => p.seat);
              const freeSeat = [0, 1, 2, 3].find((s) => !humanSeats.includes(s)) ?? 1;
              updated.players = updated.players.filter((p) => p.seat !== freeSeat);
              me = {
                id: guestPlayer.id,
                nickname: guestPlayer.nickname,
                avatar: guestPlayer.avatar || '🎴',
                seat: freeSeat,
                is_ready: true,
                is_online: true,
                is_bot: false,
              };
              updated.players.push(me);
              updated.players.sort((a, b) => a.seat - b.seat);
              this.notifyRoomListeners(updated);
              this.broadcastMessage({ type: 'ROOM_STATE_SYNC', room: updated });
            }
            finishJoin(updated);
          }
        }, 350);
      }

      // 2. PeerJS üzerinden farklı cihazdaki Host'a bağlan
      try {
        if (this.peer) this.peer.destroy();
        const peer = new Peer();
        this.peer = peer;

        peer.on('open', () => {
          const conn = peer.connect(PEER_PREFIX + cleanCode, { reliable: true });
          this.hostConnection = conn;

          conn.on('open', () => {
            conn.send({ type: 'JOIN_REQUEST', player: guestPlayer });
          });

          conn.on('data', (data) => {
            const msg = data as P2PMessage;
            if (msg.type === 'JOIN_REJECTED' && !settled) {
              settled = true;
              cleanup();
              reject(new Error(msg.reason));
              return;
            }
            this.handleIncomingMessage(msg, conn);
          });
        });

        peer.on('error', () => {
          if (!settled && !localRoom) {
            settled = true;
            cleanup();
            reject(new Error('Oda bulunamadı veya bağlantı kurulamadı. Oda kodunu kontrol edin.'));
          }
        });
      } catch {
        // ignore
      }

      // 4.5 saniye timeout
      setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(new Error('Oda bulunamadı. Lütfen 4 haneli oda kodunu kontrol edin.'));
        }
      }, 4500);
    });
  }

  public toggleBotAtSeat(code: string, seat: number) {
    const room = this.getStoredRoom(code);
    if (!room || seat === 0) return;

    const existing = room.players.find((p) => p.seat === seat);
    if (existing && !existing.is_bot) return; // İnsan oyuncuyu çıkarma

    if (existing && existing.is_bot) {
      // Botu kaldır (Koltuk boşalsın)
      room.players = room.players.filter((p) => p.seat !== seat);
    } else {
      // Koltuğa bot ekle
      const botMeta = BOT_PROFILES.find((b) => b.seat === seat) || {
        seat,
        name: `Bot ${seat}`,
        avatar: '🤖',
      };
      room.players.push({
        id: `bot-${seat}`,
        nickname: botMeta.name,
        avatar: botMeta.avatar,
        seat,
        is_ready: true,
        is_online: true,
        is_bot: true,
      });
      room.players.sort((a, b) => a.seat - b.seat);
    }

    this.notifyRoomListeners(room);
    this.broadcastMessage({ type: 'ROOM_STATE_SYNC', room });
  }

  public togglePlayerReady(code: string, playerId: string) {
    if (this.isHost) {
      this.handleIncomingMessage({ type: 'TOGGLE_READY', playerId });
    } else {
      this.broadcastMessage({ type: 'TOGGLE_READY', playerId });
    }
  }

  public startRoomGame(code: string, initialGameState: any) {
    const room = this.getStoredRoom(code);
    if (!room) return;

    // Boş kalan koltuk varsa 4 kişiye tamamlamak için bot ekle
    for (const b of BOT_PROFILES) {
      if (!room.players.some((p) => p.seat === b.seat)) {
        room.players.push({
          id: `bot-${b.seat}`,
          nickname: b.name,
          avatar: b.avatar,
          seat: b.seat,
          is_ready: true,
          is_online: true,
          is_bot: true,
        });
      }
    }
    room.players.sort((a, b) => a.seat - b.seat);
    room.status = 'playing';
    room.initialGameState = initialGameState;

    this.notifyRoomListeners(room);
    this.broadcastMessage({
      type: 'GAME_START_SYNC',
      room,
      gameState: initialGameState,
    });
  }

  public sendGameAction(code: string, event: GameEvent, fromSeat: number) {
    this.setupBroadcastChannel(code);
    this.broadcastMessage({
      type: 'GAME_ACTION',
      payload: { ...event, fromSeat },
    });
  }

  public syncFullGameState(code: string, gameState: any) {
    this.setupBroadcastChannel(code);
    const room = this.getStoredRoom(code);
    if (room) {
      room.initialGameState = gameState;
      this.saveStoredRoom(room);
    }
    this.broadcastMessage({
      type: 'FULL_GAME_STATE_SYNC',
      gameState,
    });
  }

  public connectToRoomChannel(code: string, isHost: boolean) {
    const cleanCode = code.toUpperCase();
    this.isHost = isHost;
    this.setupBroadcastChannel(cleanCode);
    if (isHost && !this.peer) {
      this.initHostPeer(cleanCode);
    }
  }

  public onRoomUpdate(cb: (room: RoomData) => void) {
    this.roomListeners.add(cb);
    return () => {
      this.roomListeners.delete(cb);
    };
  }

  public onGameAction(cb: (event: GameEvent & { fromSeat: number }) => void) {
    this.gameActionListeners.add(cb);
    return () => {
      this.gameActionListeners.delete(cb);
    };
  }

  public onFullGameState(cb: (gameState: any) => void) {
    this.fullStateListeners.add(cb);
    return () => {
      this.fullStateListeners.delete(cb);
    };
  }
}

export const p2pRoomManager = new P2PRoomManager();
