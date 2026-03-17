import React, { useState, useRef, useEffect } from 'react'
import { Brain, Send, Sparkles, X } from 'lucide-react'
import { blink } from '@/blink/client'
import type { PackData } from '@/data/packs'
import { PACKS } from '@/data/packs'

interface Message { role: 'user' | 'assistant'; content: string }

const STARTERS = [
  'Which pack is best right now?',
  'Which $25 pack has best EV?',
  'What is buyback ROI?',
  'When to buy Pokémon packs?',
]

export default function AIAssistant({ packs }: { packs?: PackData[] }) {
  const activePacks = packs || PACKS
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Hey! I'm the **PulseAI Strategist** 🎯\n\nI analyze live Courtyard.io pack data to help you find the best Expected Value opportunities.\n\nRight now, **${activePacks.filter(p => p.evRatio >= 1).length} packs** are above break-even EV. Ask me anything!`
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiOpen, setAiOpen] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const topPack = [...activePacks].sort((a, b) => b.evRatio - a.evRatio)[0]
  const bestBudget = [...activePacks].filter(p => p.price <= 25).sort((a, b) => b.evRatio - a.evRatio)[0]

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    setInput('')
    setLoading(true)
    const newMsgs: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMsgs)

    const sys = `You are PulseAI Strategist — an expert Expected Value analyst for Courtyard.io mystery packs.

LIVE PACK DATA:
${activePacks.map(p => `• ${p.name} ($${p.price}): EV ${p.evRatio.toFixed(3)}x, Cal.EV $${p.calibratedEv.toFixed(2)}, Buyback $${p.buybackEv.toFixed(2)} (${p.buybackRatio.toFixed(3)}x), Win ${p.winRate}%, ${p.remaining}/${p.totalSlots} left — ${p.signal}`).join('\n')}

Best: ${topPack?.name} at ${topPack?.evRatio.toFixed(3)}x | Budget best: ${bestBudget?.name}
Be concise — 2-4 sentences. Focus on math. No fluff.`

    try {
      let res = ''
      await blink.ai.streamText(
        { messages: [{ role: 'system', content: sys }, ...newMsgs.map(m => ({ role: m.role, content: m.content }))], model: 'gpt-4.1-mini', maxTokens: 300 },
        (chunk: string) => {
          res += chunk
          setMessages(prev => {
            const u = [...prev]
            if (u[u.length - 1]?.role === 'assistant' && u.length > newMsgs.length) {
              u[u.length - 1] = { role: 'assistant', content: res }
            } else {
              u.push({ role: 'assistant', content: res })
            }
            return u
          })
        }
      )
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sign in to unlock AI analysis. The live data above is still accurate!' }])
    } finally {
      setLoading(false)
    }
  }

  const renderContent = (t: string) =>
    t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-xl">
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-black text-sm tracking-tight">AI Strategist</div>
            <div className="text-[10px] text-primary font-mono uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block animate-pulse" />
              Live Analysis
            </div>
          </div>
        </div>
        <button onClick={() => setAiOpen(false)} className="w-7 h-7 rounded-md hover:bg-muted/50 flex items-center justify-center transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {aiOpen && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2.5 text-xs leading-relaxed ${msg.role === 'user' ? 'bg-primary text-primary-foreground font-medium' : 'bg-secondary/70 border border-border/50 text-foreground'}`}>
                  <p dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary/70 border border-border/50 rounded-xl px-3 py-2.5 flex items-center gap-1.5">
                  {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {STARTERS.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)} className="text-[10px] px-2.5 py-1 rounded-full border border-primary/20 text-primary hover:bg-primary/10 transition-colors font-bold tracking-wide">
                  <Sparkles className="w-2.5 h-2.5 inline mr-1" />{q}
                </button>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-border/50 bg-card/20">
            <form onSubmit={e => { e.preventDefault(); sendMessage(input) }} className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about any pack..."
                className="flex-1 bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-colors" />
              <button type="submit" disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center disabled:opacity-40 hover:bg-primary/80 transition-colors flex-shrink-0">
                <Send className="w-3.5 h-3.5 text-primary-foreground" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
