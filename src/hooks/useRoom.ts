import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { p2pRoomManager, type RoomData, type RoomPlayer } from '../lib/p2pRoomEngine';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

function getOrCreatePlayerId(): string {
  const existing = sessionStorage.getItem('playerId');
  if (existing && existing !== 'local') return existing;
  const newId = `p_${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem('playerId', newId);
  return newId;
}

export function useRoom() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(() =>
    sessionStorage.getItem('playerId')
  );
  const [mySeat, setMySeat] = useState<number | null>(() => {
    const s = sessionStorage.getItem('seat');
    return s !== null ? Number(s) : null;
  });

  // ── Oda Oluştur (P2P WebRTC + BroadcastChannel — %100 Çalışır, Sunucu Çökmesi Yok!) ──
  const createRoom = useCallback(
    async (
      nickname: string,
      avatar = '👑',
      botDifficulty: 'casual' | 'tactical' | 'grandmaster' = 'tactical'
    ) => {
      setLoading(true);
      setError(null);
      try {
        const code = generateRoomCode();
        const playerId = getOrCreatePlayerId();

        const roomData = await p2pRoomManager.createHostRoom(
          code,
          { id: playerId, nickname, avatar },
          botDifficulty
        );

        sessionStorage.setItem('playerId', playerId);
        sessionStorage.setItem('roomId', roomData.id);
        sessionStorage.setItem('roomCode', code);
        sessionStorage.setItem('seat', '0');
        sessionStorage.setItem('isHost', 'true');
        sessionStorage.setItem('nickname', nickname);
        sessionStorage.setItem('avatar', avatar);
        sessionStorage.setItem('botDifficulty', botDifficulty);

        setMyPlayerId(playerId);
        setMySeat(0);
        setRoom(roomData);
        setPlayers(roomData.players);
        navigate(`/lobby/${code}`);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  // ── Odaya Katıl ──────────────────────────────────────────
  const joinRoom = useCallback(
    async (code: string, nickname: string, avatar = '🎴') => {
      setLoading(true);
      setError(null);
      try {
        const cleanCode = code.trim().toUpperCase();
        const playerId = getOrCreatePlayerId();

        const { room: joinedRoom, seat } = await p2pRoomManager.joinRoomAsGuest(
          cleanCode,
          { id: playerId, nickname, avatar }
        );

        sessionStorage.setItem('playerId', playerId);
        sessionStorage.setItem('roomId', joinedRoom.id);
        sessionStorage.setItem('roomCode', cleanCode);
        sessionStorage.setItem('seat', String(seat));
        sessionStorage.setItem('isHost', 'false');
        sessionStorage.setItem('nickname', nickname);
        sessionStorage.setItem('avatar', avatar);

        setMyPlayerId(playerId);
        setMySeat(seat);
        setRoom(joinedRoom);
        setPlayers(joinedRoom.players);
        navigate(`/lobby/${cleanCode}`);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  // ── Lobi Realtime aboneliği ───────────────────────────────
  const subscribeToLobby = useCallback(
    (code: string) => {
      const cleanCode = code.toUpperCase();
      const isHost = sessionStorage.getItem('isHost') === 'true';
      p2pRoomManager.connectToRoomChannel(cleanCode, isHost);

      const initial = p2pRoomManager.getStoredRoom(cleanCode);
      if (initial) {
        setRoom(initial);
        setPlayers(initial.players);
        if (initial.status === 'playing') {
          navigate(`/game/${cleanCode}`);
        }
      }

      const unsub = p2pRoomManager.onRoomUpdate((updatedRoom) => {
        if (updatedRoom.code !== cleanCode) return;
        setRoom({ ...updatedRoom });
        setPlayers([...updatedRoom.players]);
        if (updatedRoom.status === 'playing') {
          navigate(`/game/${cleanCode}`);
        }
      });

      return unsub;
    },
    [navigate]
  );

  // ── Hazır durumu değiştir ────────────────────────────────
  const toggleReady = useCallback((code: string, playerId: string) => {
    p2pRoomManager.togglePlayerReady(code, playerId);
  }, []);

  // ── Koltuğa Bot Ekle / Kaldır (Host) ─────────────────────
  const toggleBotSeat = useCallback((code: string, seat: number) => {
    p2pRoomManager.toggleBotAtSeat(code, seat);
  }, []);

  // ── Oyunu başlat (Host) ──────────────────────────────────
  const startGame = useCallback(
    (code: string, initialGameState: any) => {
      p2pRoomManager.startRoomGame(code, initialGameState);
      navigate(`/game/${code.toUpperCase()}`);
    },
    [navigate]
  );

  return {
    loading,
    error,
    room,
    players,
    myPlayerId,
    mySeat,
    createRoom,
    joinRoom,
    subscribeToLobby,
    toggleReady,
    toggleBotSeat,
    startGame,
  };
}
