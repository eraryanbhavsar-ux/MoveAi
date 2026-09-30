import { useState, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles, Cpu, Key, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm MOVA AI, your mobility operations co-pilot. I analyze real-time fleet telematics, corridor disruptions, and cargo SLAs to provide dispatch recommendations.",
      source: 'mova-engine'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [modelName, setModelName] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    checkAIStatus();
  }, []);

  async function checkAIStatus() {
    try {
      const res = await api.get('/ai/status');
      setAiAvailable(res.data.aiAvailable);
      if (res.data.model) setModelName(res.data.model);
    } catch (e) {
      // Nominal fallback
    }
  }

  async function handleSaveKey(e) {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    try {
      const res = await api.post('/ai/set-key', { apiKey: apiKeyInput.trim() });
      if (res.data.success) {
        setAiAvailable(true);
        setKeySaved(true);
        setTimeout(() => {
          setShowKeyInput(false);
          setKeySaved(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to set key:', err);
    }
  }

  const send = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', content: question }]);
    setLoading(true);
    try {
      const { data } = await api.post('/ai/assistant', { question });
      setMessages(m => [
        ...m,
        { role: 'assistant', content: data.answer, source: data.source || (data.aiAvailable ? 'gemini' : 'mova-engine') }
      ]);
      if (data.aiAvailable !== undefined) {
        setAiAvailable(data.aiAvailable);
      }
    } catch (err) {
      setMessages(m => [
        ...m,
        {
          role: 'assistant',
          content: 'Unable to query live telemetry at this second. Please try asking again.',
          source: 'mova-engine'
        }
      ]);
    }
    setLoading(false);
  };

  const quickQuestions = [
    'Which trips are at highest risk?',
    'What should I optimize first?',
    'Summarize fleet operations',
    'How can I reduce predicted delays?',
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent hover:bg-accent-dark shadow-2xl flex items-center justify-center transition-all hover:scale-105 z-50 group border border-white/10"
        title="Open MOVA AI Assistant"
      >
        <MessageSquare className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-mova-900 animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[560px] bg-mova-800/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl flex flex-col z-50 animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-mova-900/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white tracking-tight">MOVA AI Co-Pilot</h3>
              <span
                className={`text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                  aiAvailable
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-accent/15 text-accent border-accent/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${aiAvailable ? 'bg-emerald-400' : 'bg-accent'} animate-pulse`} />
                {aiAvailable ? (modelName ? modelName.replace('models/', '') : 'Gemini AI') : 'MOVA Neural Engine'}
              </span>
            </div>
            <p className="text-[10px] text-mova-400 leading-none mt-0.5">Live Operational Reasoning</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="p-1.5 text-mova-400 hover:text-white rounded-lg hover:bg-mova-700/60 transition-colors"
            title="Configure Gemini API Key"
          >
            <Key className="w-4 h-4" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 text-mova-400 hover:text-white rounded-lg hover:bg-mova-700/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Key Input Drawer */}
      {showKeyInput && (
        <form onSubmit={handleSaveKey} className="p-3 bg-mova-900/90 border-b border-border text-xs space-y-2">
          <div className="flex items-center justify-between text-mova-300 font-semibold">
            <span>Connect Google Gemini API Key</span>
            <span className="text-[10px] text-mova-400 font-normal">Optional</span>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Paste AIzaSy... key"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              className="flex-1 bg-mova-800 border border-border rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-mova-500 focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-accent hover:bg-accent/90 text-white rounded-lg font-bold text-xs flex items-center gap-1"
            >
              {keySaved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : 'Save'}
            </button>
          </div>
          <p className="text-[10px] text-mova-400">
            Enables full generative Gemini 2.0 Flash reasoning. Without a key, MOVA runs on its built-in deterministic intelligence engine.
          </p>
        </form>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-accent" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent text-white font-medium shadow-md shadow-accent/10'
                  : 'bg-mova-700/80 border border-border text-mova-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Engine badge */}
              {msg.role === 'assistant' && (
                <div className="pt-2 mt-1 border-t border-border/40 flex items-center justify-between text-[10px]">
                  {msg.source === 'gemini' ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <Sparkles className="w-3 h-3" /> {modelName ? modelName.replace('models/', '') : 'Gemini AI'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-accent font-semibold">
                      <Cpu className="w-3 h-3" /> MOVA Intelligence Engine
                    </span>
                  )}
                  <span className="text-mova-400 text-[9px]">Grounded in telemetry</span>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-mova-600 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-mova-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 items-center">
            <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="bg-mova-700/80 border border-border rounded-xl px-3.5 py-2">
              <div className="flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Questions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <p className="text-[10px] text-mova-400 font-medium mb-1.5">Suggested telemetry queries:</p>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map(q => (
              <button
                key={q}
                onClick={() => {
                  setInput(q);
                }}
                className="text-[11px] px-2.5 py-1 bg-mova-700/60 border border-border/80 text-mova-300 rounded-lg hover:bg-mova-600 hover:text-white transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Row */}
      <div className="p-3 border-t border-border bg-mova-900/60">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask about trips, risks, SLAs, bottlenecks..."
            className="flex-1 bg-mova-800 border border-border rounded-xl px-3 py-2 text-xs text-white placeholder-mova-500 focus:outline-none focus:border-accent"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-3.5 py-2 bg-accent hover:bg-accent/90 disabled:opacity-40 text-white rounded-xl transition-all shadow-md flex items-center justify-center"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
