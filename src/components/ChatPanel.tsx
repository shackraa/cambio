import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { useLangStore } from '../store/useLangStore';
import { translations } from '../i18n/translations';

export function ChatPanel({ sendAction, myPlayerId, myNickname }: { sendAction: (action: any) => void, myPlayerId: string, myNickname: string }) {
  const [text, setText] = useState('');
  const chatMessages = useGameStore(s => s.chatMessages);
  const addChatMessage = useGameStore(s => s.addChatMessage);
  const bottomRef = useRef<HTMLDivElement>(null);

  const lang = useLangStore((s) => s.lang);
  const t = translations[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const msgObj = { senderId: myPlayerId, senderName: myNickname, text: text.trim() };
    
    // Kendi ekranımıza ekle
    addChatMessage(msgObj);
    
    // Diğer oyunculara gönder
    sendAction({ type: 'CHAT_MESSAGE', ...msgObj });
    
    setText('');
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10"
         style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.6) 100%)', backdropFilter: 'blur(12px)' }}>
      
      <div className="px-5 py-3 border-b border-white/10 bg-black/40 shrink-0 flex items-center gap-3">
        <div className="w-1 h-4 rounded-full bg-[var(--gold)]"></div>
        <h3 className="text-white/80 font-bold text-sm uppercase tracking-wider">{t.chatTitle}</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-white/50 text-sm">
            <span className="text-2xl mb-2">💬</span>
            <p>{t.chatPlaceholder}</p>
          </div>
        ) : (
          chatMessages.map(msg => {
            const isMe = msg.senderId === myPlayerId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[11px] text-white/40 font-semibold mb-1 px-1 tracking-wider uppercase">{msg.senderName}</span>
                <div 
                  className={`px-4 py-2.5 rounded-2xl max-w-[90%] text-sm font-medium leading-relaxed break-words whitespace-pre-wrap shadow-lg backdrop-blur-sm border ${
                    isMe 
                      ? 'bg-white/15 text-white/95 border-white/20 rounded-tr-sm' 
                      : 'bg-black/40 text-white/80 border-white/5 rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 bg-black/50 border-t border-white/10 flex gap-3 shrink-0 items-center">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t.chatPlaceholder}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-[var(--gold)]/90 hover:bg-[var(--gold)] text-black font-bold px-5 py-3 rounded-xl disabled:opacity-50 transition-all shadow-md active:scale-95 text-sm uppercase tracking-wide"
        >
          {t.chatSend}
        </button>
      </form>
    </div>
  );
}
