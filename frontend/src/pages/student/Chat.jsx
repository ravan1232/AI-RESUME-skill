import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MessageSquare, Send, User, Sparkles, Clock, CheckCheck } from 'lucide-react';

export const Chat = () => {
  const { user } = useAuth();
  const [exchanges, setExchanges] = useState([]);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchActiveExchanges();
  }, []);

  useEffect(() => {
    if (selectedExchange) {
      fetchMessages(selectedExchange.id);
      const interval = setInterval(() => {
        fetchMessages(selectedExchange.id);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [selectedExchange]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchActiveExchanges = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exchange/requests');
      const accepted = [
        ...res.data.incoming.filter((r) => r.status === 'accepted'),
        ...res.data.outgoing.filter((r) => r.status === 'accepted')
      ];
      setExchanges(accepted);
      if (accepted.length > 0) {
        setSelectedExchange(accepted[0]);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading active chat exchanges', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (exchangeId) => {
    try {
      const res = await api.get(`/chat/history/${exchangeId}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedExchange) return;

    const text = inputMessage.trim();
    setInputMessage('');

    try {
      setSending(true);
      const res = await api.post('/chat/send', {
        exchange_id: selectedExchange.id,
        content: text
      });
      setMessages((prev) => [...prev, { ...res.data.message, is_me: true }]);
    } catch (err) {
      console.error(err);
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Connecting to Real-time Chat..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 rounded-3xl p-6 text-white shadow-xl shadow-navy-950/20 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Peer Exchange Messaging</h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time collaboration channel for accepted peer tutoring partnerships
          </p>
        </div>
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live WebSocket Room</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
        {/* Left: Active Partners List */}
        <Card title="Exchange Partners" className="h-full flex flex-col p-0">
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {exchanges.length > 0 ? (
              exchanges.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExchange(ex)}
                  className={`w-full text-left p-4 transition flex items-center space-x-3 ${selectedExchange?.id === ex.id ? 'bg-blue-50/80 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                    }`}
                >
                  <div className="w-10 h-10 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {ex.peer_name?.slice(0, 2).toUpperCase() || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{ex.peer_name}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      Skill: {ex.skill_requested || ex.skill_offered}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No active accepted exchanges yet. Send or accept a request in the Skill Exchange Hub to unlock chat!
              </div>
            )}
          </div>
        </Card>

        {/* Right: Message Window */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-full overflow-hidden">
          {selectedExchange ? (
            <>
              {/* Partner Header */}
              <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{selectedExchange.peer_name}</h3>
                  <p className="text-[11px] text-slate-500">
                    Topic: {selectedExchange.skill_requested} ⇄ {selectedExchange.skill_offered}
                  </p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-3 bg-[#F8FAFC]">
                {messages.length > 0 ? (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.is_me ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-xs shadow-sm ${m.is_me
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                          }`}
                      >
                        <p>{m.content}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                    <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                    <span>Say hello to {selectedExchange.peer_name} to coordinate your tutoring session!</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex space-x-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sending}
                  className="px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Select an exchange partner from the left to start messaging.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
