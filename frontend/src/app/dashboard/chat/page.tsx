"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Send, Sparkles, Loader2, Bot, User } from "lucide-react";
import api from "@/lib/api";

interface Message { role: "user" | "assistant"; content: string; }

const SUGGESTIONS = [
  "My kitchen sink is leaking, what should I do?",
  "How much does AC repair usually cost?",
  "I need an electrician urgently, how do I book?",
  "What services do you offer?",
];

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm the OneService AI Assistant 🤖 I can help you find the right service, understand pricing, or answer any questions about home repairs. What can I help you with today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex flex-col">
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="btn-ghost p-2"><ChevronLeft size={20} /></Link>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">AI Assistant</p>
          <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Online</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div className={`max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary-500 text-white rounded-br-sm"
                  : "bg-white text-slate-700 shadow-sm rounded-bl-sm"
              }`}>
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <User size={14} className="text-slate-600" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
              {[0,1,2].map((i) => (
                <motion.div key={i} className="w-2 h-2 bg-slate-300 rounded-full"
                  animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 max-w-3xl mx-auto w-full">
          <p className="text-xs text-slate-400 mb-2">💡 Try asking:</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => sendMessage(s)}
                className="flex-shrink-0 text-xs bg-white border border-slate-200 hover:border-primary-300 hover:bg-primary-50 text-slate-600 px-3 py-2 rounded-xl transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-4 border-t border-slate-100 bg-white/80 backdrop-blur-sm max-w-3xl mx-auto w-full">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask me anything about home services..."
            className="input-field flex-1"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn-primary py-3 px-4 flex-shrink-0"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-xs text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
          <Sparkles size={11} /> Powered by GPT-4o
        </p>
      </div>
    </div>
  );
}
