import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToastStore } from '../store/useToastStore';

// ─── Yardımcı: 4 haneli oda kodu üret ────────────────────────
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── Yardımcı: ilk boş koltuğu bul ──────────────────────────
function findEmptySeat(takenSeats: number[]): number | null {
  for (let i = 0; i < 4; i++) {
    if (!takenSeats.includes(i)) return i;
  }
  return null;
}

export interface RoomPlayer {
  id: string;
  nickname: string;
  seat: number;
  is_online: boolean;
  is_ready: boolean;
}

export interface RoomInfo {
  id: string;
  code: string;
  status: string;
  host_id: string | null;
}

export function useRoom() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(() => sessionStorage.getItem('playerId'));
  const [mySeat, setMySeat] = useState<number | null>(() => {
    const s = sessionStorage.getItem('seat');
    return s ? parseInt(s, 10) : null;
  });

  // ── Oda oluştur ─────────────────────────────────────────
  const createRoom = useCallback(async (nickname: string) => {
    setLoading(true);
    setError(null);
    try {
      let code = generateRoomCode();

      // Benzersiz kod garantisi
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: existing } = await supabase
          .from('rooms')
          .select('id')
          .eq('code', code)
          .maybeSingle();
        if (!existing) break;
        code = generateRoomCode();
      }

      // Oda oluştur
      const { data: roomData, error: roomErr } = await supabase
        .from('rooms')
        .insert({ code, status: 'waiting' })
        .select()
        .single();
      if (roomErr || !roomData) throw new Error(roomErr?.message ?? 'Oda oluşturulamadı');

      // Oyuncu ekle (seat 0 = host)
      const { data: playerData, error: playerErr } = await supabase
        .from('players')
        .insert({ room_id: roomData.id, nickname, seat: 0, is_ready: false })
        .select()
        .single();
      if (playerErr || !playerData) throw new Error(playerErr?.message ?? 'Oyuncu eklenemedi');

      // Host'u güncelle
      await supabase
        .from('rooms')
        .update({ host_id: playerData.id })
        .eq('id', roomData.id);

      setMyPlayerId(playerData.id);
      setMySeat(0);
      setRoom({ ...roomData, host_id: playerData.id });

      sessionStorage.setItem('playerId', playerData.id);
      sessionStorage.setItem('seat', '0');
      sessionStorage.setItem('roomId', roomData.id);
      sessionStorage.setItem('isHost', 'true');

      navigate(`/lobby/${code}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ── Odaya katıl ─────────────────────────────────────────
  const joinRoom = useCallback(async (code: string, nickname: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: roomData, error: roomErr } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('status', 'waiting')
        .maybeSingle();
      if (roomErr) throw new Error(roomErr.message);
      if (!roomData) throw new Error('Oda bulunamadı veya oyun başlamış');

      const { data: existingPlayers } = await supabase
        .from('players')
        .select('seat')
        .eq('room_id', roomData.id);

      const takenSeats = existingPlayers?.map((p: { seat: number }) => p.seat) ?? [];
      if (takenSeats.length >= 4) throw new Error('Oda dolu!');

      const seat = findEmptySeat(takenSeats);
      if (seat === null) throw new Error('Oda dolu!');

      const { data: playerData, error: playerErr } = await supabase
        .from('players')
        .insert({ room_id: roomData.id, nickname, seat, is_ready: false })
        .select()
        .single();
      if (playerErr || !playerData) throw new Error(playerErr?.message ?? 'Katılınamadı');

      setMyPlayerId(playerData.id);
      setMySeat(seat);
      setRoom(roomData);

      sessionStorage.setItem('playerId', playerData.id);
      sessionStorage.setItem('seat', seat.toString());
      sessionStorage.setItem('roomId', roomData.id);
      sessionStorage.setItem('isHost', 'false');

      navigate(`/lobby/${code.toUpperCase()}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ── Lobiye katıl: mevcut oyuncuları yükle + realtime ────
  const subscribeToLobby = useCallback((roomId: string) => {
    // İlk yükleme
    supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .then(({ data }: { data: any }) => { if (data) setPlayers(data); });

    // Realtime değişiklikler
    const channel = supabase
      .channel(`lobby:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
        () => {
          supabase
            .from('players')
            .select('*')
            .eq('room_id', roomId)
            .then(({ data }: { data: any }) => {
              if (data) {
                // Yeni katılanları veya hazır olanları bulup toast göster
                setPlayers((prev: RoomPlayer[]) => {
                  const newPlayers = data as RoomPlayer[];
                  if (prev.length > 0) {
                    newPlayers.forEach(np => {
                      const old = prev.find((p: RoomPlayer) => p.id === np.id);
                      if (!old) {
                        useToastStore.getState().addToast(`${np.nickname} katıldı 🎮`, 'info');
                      } else if (!old.is_ready && np.is_ready) {
                        useToastStore.getState().addToast(`${np.nickname} hazır! ✓`, 'success');
                      }
                    });
                  }
                  return newPlayers;
                });
              }
            });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload: any) => {
          const updated = payload.new as RoomInfo;
          setRoom(prev => prev ? { ...prev, ...updated } : updated);
          if (updated.status === 'playing') {
            // Oyun başladı → game sayfasına yönlendir
            supabase.from('rooms').select('code').eq('id', roomId).single()
              .then(({ data }: { data: any }) => { if (data) navigate(`/game/${data.code}`); });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [navigate]);

  // ── Hazır durumunu değiştir ──────────────────────────────
  const toggleReady = useCallback(async (playerId: string, currentReady: boolean) => {
    await supabase
      .from('players')
      .update({ is_ready: !currentReady })
      .eq('id', playerId);
  }, []);

  // ── Oyunu başlat (sadece host) ───────────────────────────
  const startGame = useCallback(async (roomId: string) => {
    await supabase
      .from('rooms')
      .update({ status: 'playing' })
      .eq('id', roomId);
  }, []);

  return {
    loading, error, room, players, myPlayerId, mySeat,
    createRoom, joinRoom, subscribeToLobby, toggleReady, startGame,
  };
}
