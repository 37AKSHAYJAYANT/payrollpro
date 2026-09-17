import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { executeCopilotTool } from '../services/copilotService';

export default function AiCopilot() {
  const { role, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'copilot',
      text: `👋 Hello ${user?.email ? user.email.split('@')[0] : 'there'}! I am your **PayrollPro AI Copilot**.\n\nI can audit payroll runs for anomalies, summarize monthly compensation, look up employee records, and answer statutory compliance questions (EPF, HRA, PT, TDS).`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        '🚨 Audit September Payroll',
        '📊 Payroll Summary',
        '🏢 Engineering Dept Cost',
        '🔍 Lookup EMP-001',
        '📜 Statutory Rules'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  async function handleSend(queryText) {
    const prompt = (queryText || input).trim();
    if (!prompt) return;

    const userMsg = {
      id: String(Date.now()),
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await executeCopilotTool(prompt);
      setMessages((prev) => [...prev, response]);
      if (!isOpen) setHasUnread(true);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'copilot',
          text: `⚠️ **Error processing query:** ${err.message || 'Unable to connect to payroll services.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  }



  // Hide Copilot for EMPLOYEE users
  if (role === 'EMPLOYEE') {
    return null;
  }

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className="relative group flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-indigo-300"
            title="Open AI Copilot"
          >
            {/* Sparkle Icon */}
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <span className="font-bold text-xs sm:text-sm tracking-wide">AI Copilot</span>
            <span className="text-[9px] sm:text-[10px] uppercase font-extrabold bg-white/25 px-1.5 py-0.5 rounded-full">MCP</span>

            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-ping" />
            )}
          </button>
        </div>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:right-6 sm:bottom-6 w-auto sm:w-[440px] h-[85vh] sm:h-[600px] max-h-[90vh] sm:max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="px-4 py-3 sm:px-5 sm:py-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-white/15 flex items-center justify-center shadow-inner">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h3 className="font-extrabold text-xs sm:text-sm tracking-wide truncate">PayrollPro Copilot</h3>
                  <span className="text-[9px] sm:text-[10px] bg-emerald-400 text-emerald-950 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-indigo-200 truncate">Model Context Protocol • 5 Tools</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'welcome-reset',
                      sender: 'copilot',
                      text: 'Chat history cleared. How can I assist you with PayrollPro today?',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      suggestions: [
                        '🚨 Audit September Payroll',
                        '📊 Payroll Summary',
                        '🏢 Engineering Dept Cost',
                        '📜 Statutory Rules'
                      ]
                    }
                  ])
                }
                className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Clear Chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Close Window"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/70 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 leading-relaxed shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">
                    {/* Basic Markdown Rendering */}
                    {m.text.split('\n\n').map((para, idx) => (
                      <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
                        {para.split('\n').map((line, lidx) => (
                          <span key={lidx} className="block">
                            {line.startsWith('### ') ? (
                              <strong className="text-sm font-extrabold text-indigo-950 block mb-1">
                                {line.replace('### ', '')}
                              </strong>
                            ) : line.startsWith('* ') ? (
                              <span className="ml-1 text-gray-700">
                                • {line.replace('* ', '')}
                              </span>
                            ) : (
                              line
                            )}
                          </span>
                        ))}
                      </p>
                    ))}
                  </div>

                  <div
                    className={`mt-1.5 text-[10px] text-right ${
                      m.sender === 'user' ? 'text-indigo-200' : 'text-gray-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {/* Suggestions / Prompt Chips */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[95%]">
                    {m.suggestions.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(chip)}
                        className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-[11px] font-semibold transition shadow-2xs hover:border-indigo-400"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-gray-200 w-28 text-gray-500 shadow-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Bar */}
          <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto text-[10px] sm:text-[11px]">
            <button
              onClick={() => handleSend('Audit September Payroll for anomalies')}
              className="whitespace-nowrap px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition shrink-0"
            >
              🚨 Audit Anomalies
            </button>
            <button
              onClick={() => handleSend('What is the payroll summary?')}
              className="whitespace-nowrap px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition shrink-0"
            >
              📊 Summary
            </button>
            <button
              onClick={() => handleSend('Engineering department cost breakdown')}
              className="whitespace-nowrap px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition shrink-0"
            >
              🏢 Dept Cost
            </button>
            <button
              onClick={() => handleSend('Explain Indian statutory rules for EPF and HRA')}
              className="whitespace-nowrap px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition shrink-0"
            >
              📜 Compliance
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 sm:p-3 bg-white border-t border-gray-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about payroll, employees, compliance..."
              className="flex-1 px-3 py-2 sm:px-3.5 sm:py-2.5 border border-gray-300 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title="Send Prompt"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
