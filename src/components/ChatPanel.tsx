import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

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

  const quickMessages =
    lang === 'tr'
      ? ['İyi oyunlar!', 'Harika hamle', 'Eyvah!', 'Cambio geliyor']
      : ['Good game!', 'Nice move', 'uh oh!', 'Cambio soon'];

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
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(8, 36, 25, 0.88)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.28)',
      }}
    >
      {/* Başlık */}
      <div className="px-4 py-3 flex items-center justify-between shrink-0 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
          <h3 className="text-white/90 font-bold text-xs uppercase tracking-[0.12em]">
            {t.chatTitle}
          </h3>
        </div>
        <span className="text-[10px] font-semibold text-white/40">
          {chatMessages.length}
        </span>
      </div>

      {/* Mesaj Listesi */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-2.5 scrollbar-thin">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/25 text-xs">
            <p>{t.chatPlaceholder}</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {chatMessages.map(msg => {
              const isMe = msg.senderId === myPlayerId;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5 px-1">
                    <span className="text-[10px] text-white/50 font-semibold">
                      {msg.senderName}
                    </span>
                    <span className="text-[9px] text-white/25 font-mono">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-xl max-w-[90%] text-xs font-medium leading-relaxed break-words whitespace-pre-wrap border ${
                      isMe
                        ? 'bg-[var(--gold)]/20 text-white border-[var(--gold)]/35 rounded-tr-xs'
                        : 'bg-white/[0.06] text-white/90 border-white/[0.08] rounded-tl-xs'
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

      {/* Hızlı Mesaj Seçenekleri */}
      <div className="px-3 py-1.5 border-t border-white/[0.06] bg-white/[0.01] flex items-center gap-1.5 overflow-x-auto shrink-0">
        {quickMessages.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => sendMessage(label)}
            className="py-1 px-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] text-[10px] font-semibold text-white/75 hover:text-white transition-colors whitespace-nowrap cursor-pointer active:scale-95"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Mesaj Gönderme Formu */}
      <form
        onSubmit={handleSubmit}
        className="px-3 py-2.5 bg-white/[0.02] border-t border-white/[0.08] flex gap-2 shrink-0 items-center"
      >
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t.chatPlaceholder}
          className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[var(--gold)]/60 transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-[var(--gold)] hover:bg-[var(--gold-light)] text-black font-bold px-3.5 py-2 rounded-xl disabled:opacity-35 transition-all active:scale-95 text-xs cursor-pointer"
        >
          {t.chatSend}
        </button>
      </form>
    </div>
  );
}
