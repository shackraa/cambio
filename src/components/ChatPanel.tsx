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
      <div className="luxury-panel-header flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--gold-light)]/25 to-[var(--gold)]/10 border border-[var(--gold)]/45 flex items-center justify-center shadow-inner">
            <svg className="w-4 h-4 text-[var(--gold-light)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h3 className="text-amber-50 font-extrabold text-xs uppercase tracking-[0.16em] font-['Cinzel']">
              {t.chatTitle}
            </h3>
            <span className="text-[10px] text-emerald-200/55 font-medium mt-0.5">
              {lang === 'tr' ? 'Masa İçi Akış' : 'Table Feed'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/35 border border-emerald-400/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          <span className="text-[11px] font-bold text-emerald-200 font-['JetBrains_Mono']">
            {chatMessages.length}
          </span>
        </div>
      </div>

      {/* Oyun İçi Mesaj Akışı (WhatsApp balonları yerine entegre masa akışı) */}
      <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-2 scrollbar-thin">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-5 gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[var(--gold)]/45">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
              </svg>
            </div>
            <p className="text-emerald-100/50 text-xs font-medium leading-relaxed">
              {lang === 'tr'
                ? 'Masaya mesaj göndermek için hızlı tepkileri veya alt kutuyu kullanın'
                : 'Use quick reactions or the input box below to message the table'}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {chatMessages.map(msg => {
              const isMe = msg.senderId === myPlayerId;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-start justify-between gap-2 px-3.5 py-2.5 rounded-xl border ${
                    isMe
                      ? 'bg-[var(--gold)]/12 border-[var(--gold)]/35'
                      : 'bg-black/25 border-white/[0.07]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-xs font-extrabold mr-2 ${
                        isMe ? 'text-[var(--gold-light)]' : 'text-emerald-300'
                      }`}
                    >
                      {msg.senderName}:
                    </span>
                    <span className="text-xs font-medium text-white/95 break-words leading-relaxed">
                      {msg.text}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-200/35 font-['JetBrains_Mono'] shrink-0 mt-0.5">
                    {formatTime(msg.timestamp)}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Hızlı Tepki Kapsülleri */}
      <div className="px-4 py-2.5 border-t border-[var(--gold)]/15 bg-black/20 grid grid-cols-2 gap-1.5 shrink-0">
        {quickMessages.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => sendMessage(label)}
            className="py-1.5 px-2.5 rounded-xl bg-emerald-950/80 hover:bg-[var(--gold)]/20 border border-[var(--gold)]/25 hover:border-[var(--gold)]/60 text-[11px] font-semibold text-amber-100/90 hover:text-white transition-all truncate cursor-pointer active:scale-95"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Mesaj Gönderme Alanı */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 bg-black/30 border-t border-white/[0.08] flex gap-2.5 shrink-0 items-center"
      >
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t.chatPlaceholder}
          className="flex-1 min-w-0 bg-black/45 border border-[var(--gold)]/30 rounded-xl px-3.5 py-2 text-xs text-white placeholder-emerald-100/40 focus:outline-none focus:border-[var(--gold)] transition-all shadow-inner"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="btn-gold-3d font-extrabold px-4 py-2 rounded-xl disabled:opacity-35 disabled:pointer-events-none text-xs uppercase tracking-wider cursor-pointer shrink-0"
        >
          {t.chatSend}
        </button>
      </form>
    </div>
  );
}
