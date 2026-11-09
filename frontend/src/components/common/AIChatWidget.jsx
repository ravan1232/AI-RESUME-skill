import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { BotMessageSquare, X, Send, Sparkles, User } from 'lucide-react';

export const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Hello! I am your SkillBridge Placement Advisor. Ask me anything about resume ATS scores, campus interview preparation, or finding peer exchange mentors!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    const newMsgId = Date.now().toString();

    setMessages((prev) => [...prev, { id: newMsgId, sender: 'user', text: userText }]);

    try {
      setLoading(true);
      const res = await api.post('/ai/chat', { message: userText });
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'ai', text: res.data.reply }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'SkillBridge Advisor is temporarily offline. Please check your backend connection.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-navy-950 to-blue-700 hover:from-navy-900 hover:to-blue-600 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all group border border-white/20"
        >
          <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-sky-300" />
          </div>
          <span className="text-xs font-bold tracking-wide">Placement AI</span>
        </button>
      ) : (
        <div className="w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[480px] animate-fade-in">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-sky-200" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Placement AI Advisor</h4>
                <p className="text-[10px] text-blue-300">LLaMA 3.3 Intelligence</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span>Advisor thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-2.5 bg-white border-t border-slate-100 flex space-x-2">
            <input
              type="text"
              placeholder="Ask placement advice..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-navy-900 hover:bg-navy-800 text-white rounded-xl disabled:opacity-50 transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
