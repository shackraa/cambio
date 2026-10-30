import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getInitials(name: string): string {
  return (name || 'O').slice(0, 2).toUpperCase();
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
      ? ['İyi şanslar!', 'Güzel hamle', 'Eyvah!', 'Cambio geliyor']
      : ['Good luck!', 'Nice move', 'Uh oh!', 'Cambio soon'];

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
    <div className="luxury-panel flex flex-col h-full rounded-[24px] overflow-hidden">
      {/* Lüks Başlık */}
      <div className="luxury-panel-header px-5 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[var(--gold-light)]/25 to-[var(--gold)]/10 border border-[var(--gold)]/45 flex items-center justify-center shadow-inner">
            <svg className="w-3.5 h-3.5 text-[var(--gold-light)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h3 className="text-amber-50 font-extrabold text-xs uppercase tracking-[0.14em] font-['Cinzel']">
              {t.chatTitle}
            </h3>
            <span className="text-[9px] text-emerald-200/50 font-semibold">
              {lang === 'tr' ? 'Masa İçi İletişim' : 'Table Lounge Chat'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/35 border border-emerald-400/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          <span className="text-[10px] font-bold text-emerald-200 font-['JetBrains_Mono']">
            {chatMessages.length}
          </span>
        </div>
      </div>

      {/* Mesaj Listesi */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 scrollbar-thin">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 gap-2">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[var(--gold)]/40">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              </svg>
            </div>
            <p className="text-emerald-100/50 text-xs font-semibold">
              {lang === 'tr' ? 'Sohbeti başlatmak için aşağıdan bir mesaj seçin' : 'Pick a quick message below to start chatting'}
            </p>
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
                  transition={{ duration: 0.22 }}
                  className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Oyuncu Avatar Rozeti */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 border shadow-sm ${
                      isMe
                        ? 'bg-gradient-to-br from-[#fae19c] to-[#b88728] text-black border-amber-200'
                        : 'bg-emerald-900/80 text-emerald-100 border-emerald-400/30'
                    }`}
                  >
                    {getInitials(msg.senderName)}
                  </div>

                  <div className={`flex flex-col max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] text-emerald-100/65 font-bold">
                        {msg.senderName}
                      </span>
                      <span className="text-[9px] text-emerald-200/35 font-['JetBrains_Mono']">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-xs font-semibold leading-relaxed break-words whitespace-pre-wrap shadow-md ${
                        isMe
                          ? 'bg-gradient-to-br from-[var(--gold)]/30 to-amber-900/40 text-amber-50 border border-[var(--gold)]/45 rounded-br-xs'
                          : 'bg-black/35 text-emerald-50 border border-white/10 rounded-bl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Hızlı Mesaj Kapsülleri */}
      <div className="px-3 py-2 border-t border-[var(--gold)]/15 bg-black/20 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
        {quickMessages.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => sendMessage(label)}
            className="py-1 px-2.5 rounded-full bg-emerald-950/80 hover:bg-[var(--gold)]/20 border border-[var(--gold)]/25 hover:border-[var(--gold)]/60 text-[10px] font-bold text-amber-100/85 hover:text-white transition-all whitespace-nowrap cursor-pointer active:scale-95 shadow-xs"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Mesaj Gönderme Alanı */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-black/30 border-t border-white/[0.08] flex gap-2 shrink-0 items-center"
      >
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t.chatPlaceholder}
          className="flex-1 bg-black/40 border border-[var(--gold)]/25 rounded-xl px-3.5 py-2 text-xs text-white placeholder-emerald-100/35 focus:outline-none focus:border-[var(--gold)] transition-all shadow-inner"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="btn-gold-3d font-extrabold px-4 py-2 rounded-xl disabled:opacity-35 disabled:pointer-events-none text-xs uppercase tracking-wider cursor-pointer"
        >
          {t.chatSend}
        </button>
      </form>
    </div>
  );
}
