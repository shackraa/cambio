import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

const QUICK_REACTIONS = [
  { emoji: '👏', label: 'Bravo!' },
  { emoji: '😱', label: 'Eyvah!' },
  { emoji: '🔥', label: 'Çok iyi!' },
  { emoji: '🎯', label: 'Cambio!' },
  { emoji: '😎', label: 'Kolaydı' },
];

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function ChatPanel({
  sendAction,
  myPlayerId,
  myNickname,
}: {
  sendAction: (action: any) => void;
  myPlayerId: string;
  myNickname: string;
}) {
  const [text, setText] = useState('');
  const chatMessages = useGameStore(s => s.chatMessages);
  const addChatMessage = useGameStore(s => s.addChatMessage);
  const bottomRef = useRef<HTMLDivElement>(null);

  const lang = useLangStore((s) => s.lang);
  const t = translations[lang];

  const sendMessage = (messageText: string) => {
    if (!messageText.trim()) return;
    const msgObj = {
      senderId: myPlayerId,
      senderName: myNickname,
      text: messageText.trim(),
    };
    addChatMessage(msgObj);
    sendAction({ type: 'CHAT_MESSAGE', ...msgObj });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText('');
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden shadow-lg"
      style={{
        background: 'linear-gradient(180deg, rgba(13, 62, 43, 0.78) 0%, rgba(7, 38, 26, 0.85) 100%)',
        border: '1px solid rgba(212, 168, 67, 0.22)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Başlık */}
      <div
        className="px-5 py-3.5 flex items-center justify-between shrink-0 bg-emerald-950/45"
        style={{ borderBottom: '1px solid rgba(212, 168, 67, 0.15)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-4 rounded-full bg-[var(--gold)] shadow-[0_0_8px_var(--gold)]" />
          <h3 className="text-white font-bold text-xs uppercase tracking-wider">{t.chatTitle}</h3>
        </div>
        <span className="text-xs opacity-65">💬</span>
      </div>

      {/* Mesaj Listesi */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 scrollbar-thin">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-45 text-emerald-100/70 text-xs gap-1.5">
            <span className="text-2xl">💬</span>
            <p>{t.chatPlaceholder}</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {chatMessages.map(msg => {
              const isMe = msg.senderId === myPlayerId;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5 px-1">
                    <span className="text-[10px] text-emerald-200/60 font-bold tracking-wider uppercase">
                      {msg.senderName}
                    </span>
                    <span className="text-[9px] text-emerald-100/30 font-mono">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`px-3.5 py-2 rounded-2xl max-w-[90%] text-xs font-medium leading-relaxed break-words whitespace-pre-wrap shadow-sm border ${
                      isMe
                        ? 'bg-[var(--gold)]/20 text-amber-50 border-[var(--gold)]/40 rounded-tr-xs'
                        : 'bg-emerald-950/65 text-emerald-50/90 border-emerald-400/20 rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Hızlı Emoji / Tepki Çubuğu */}
      <div className="px-3 py-1.5 bg-emerald-950/35 border-t border-emerald-400/10 flex items-center justify-between gap-1 shrink-0">
        {QUICK_REACTIONS.map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={() => sendMessage(`${r.emoji} ${r.label}`)}
            className="flex-1 py-1 px-1.5 rounded-lg bg-white/5 hover:bg-[var(--gold)]/20 border border-white/5 hover:border-[var(--gold)]/35 text-[10px] font-semibold text-emerald-100/80 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            title={r.label}
          >
            <span>{r.emoji}</span>
            <span className="truncate">{r.label}</span>
          </button>
        ))}
      </div>

      {/* Mesaj Gönderme Formu */}
      <form
        onSubmit={handleSubmit}
        className="px-3.5 py-2.5 bg-emerald-950/55 border-t border-emerald-400/15 flex gap-2 shrink-0 items-center"
      >
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t.chatPlaceholder}
          className="flex-1 bg-white/8 border border-emerald-300/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-emerald-100/35 focus:outline-none focus:border-[var(--gold)]/60 focus:bg-white/12 transition-all"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-[var(--gold)] hover:bg-[var(--gold-light)] text-black font-extrabold px-4 py-2 rounded-xl disabled:opacity-40 transition-all shadow-sm active:scale-95 text-xs uppercase tracking-wide cursor-pointer"
        >
          {t.chatSend}
        </button>
      </form>
    </div>
  );
}
