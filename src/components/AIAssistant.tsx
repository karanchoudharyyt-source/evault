import React, { useState, useRef, useEffect } from 'react'
import { Brain, Send, Sparkles } from 'lucide-react'
import { blink } from '@/blink/client'
import type { Pack } from '@/data/packs'

interface Message { role: 'user' | 'assistant'; content: string }

const STARTERS = [
  'Which pack is best value right now?',
  'Best $25 pack EV?',
  'Is buyback above 1x safe?',
  'When should I wait to buy?',
]

interface Props { packs: Pack[] }

export default function AIAssistant({ packs }: Props) {
  const topPack   = [...packs].sort((a, b) => b.evRatio - a.evRatio)[0]
  const budgetPack = [...packs].filter(p => p.price <= 25).sort((a, b) => b.evRatio - a.evRatio)[0]
  const posCount  = packs.filter(p => p.evRatio >= 1).length

  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Hey! I'm the **EVault Strategist** 🎯\n\nI analyse live Courtyard.io pack data to find the best Expected Value opportunities.\n\nRight now **${posCount} of ${packs.length} packs** are above break-even. Ask me anything!`
  }])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text: string) {
    if (!text.trim() || loading) return
    setInput('')
    setLoading(true)
    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)

    const sys = `You are EVault Strategist — an expert Expected Value analyst for Courtyard.io mystery packs.

LIVE PACK DATA (sorted by EV ratio):
${packs.map(p =>
  `• ${p.name} ($${p.price}): EV ${p.evRatio.toFixed(3)}x, Cal.EV $${p.calibratedEv.toFixed(2)}, Buyback ${p.buybackMultiplier.toFixed(3)}x, Win ${p.winRateAbovePackPrice.toFixed(1)}%, ${p.remaining}/${p.totalSlots} remaining — ${p.signal}`
).join('\n')}

Top pack right now: ${topPack?.name} at ${topPack?.evRatio.toFixed(3)}x EV
Best budget pick (≤$25): ${budgetPack?.name} at ${budgetPack?.evRatio.toFixed(3)}x EV

Rules: Be concise (2–3 sentences). Focus on the math. Mention specific pack names. No generic advice.`

    try {
      let res = ''
      await blink.ai.streamText(
        { messages: [{ role: 'system', content: sys }, ...next.map(m => ({ role: m.role, content: m.content }))], model: 'gpt-4.1-mini', maxTokens: 280 },
        (chunk: string) => {
          res += chunk
          setMessages(prev => {
            const u = [...prev]
            if (u[u.length - 1]?.role === 'assistant' && u.length > next.length) {
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

  function render(t: string) {
    return t
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-border/60 flex items-center gap-3 bg-card/30 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="font-black text-sm tracking-tight">AI Strategist</p>
          <p className="text-[10px] text-primary font-mono uppercase tracking-wider flex items-center gap-1.5">
            <span className="live-dot" style={{ width: 5, height: 5 }} /> Live Analysis
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-xl px-3 py-2.5 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground font-medium'
                : 'bg-secondary/60 border border-border/50 text-foreground'
            }`}>
              <p dangerouslySetInnerHTML={{ __html: render(msg.content) }} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-secondary/60 border border-border/50 rounded-xl px-3 py-2.5 flex items-center gap-1.5">
              {[0, 1, 2].map(j => (
                <span key={j} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${j * 0.12}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Starter prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {STARTERS.map((q, i) => (
            <button key={i} onClick={() => send(q)}
              className="text-[10px] px-2.5 py-1 rounded-full border border-primary/20 text-primary hover:bg-primary/10 transition-colors font-bold tracking-wide">
              <Sparkles className="w-2.5 h-2.5 inline mr-1" />{q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border/60 flex-shrink-0">
        <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="Ask about any pack…"
            className="flex-1 bg-secondary/40 border border-border/60 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50" />
          <button type="submit" disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center disabled:opacity-40 hover:bg-primary/80 transition-colors flex-shrink-0">
            <Send className="w-3.5 h-3.5 text-primary-foreground" />
          </button>
        </form>
      </div>
    </div>
  )
}
