import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Lightbulb, HelpCircle, Star, Shield, Sparkles, ChevronRight } from 'lucide-react'
import { chatAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'
import { quizQuestions, dailyTips, RobotMascot, ShieldBadgeIcon } from './shared'

const WELCOME = {
  role: 'bot',
  content: "Hi there! I'm SafeBot, your friendly AI safety companion. Ask me anything — homework, fun facts, or staying safe online. I'm here for you! 👋",
  timestamp: new Date(),
}

/* ── Chat bubble ───────────────────────────────────────── */
function ChatBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{
        width: 34, height: 34, borderRadius: 11, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isUser
          ? 'linear-gradient(135deg, #2563eb, #4f46e5)'
          : 'linear-gradient(135deg, #7c3aed, #2563eb)',
        boxShadow: isUser ? '0 4px 12px rgba(37,99,235,0.4)' : '0 4px 12px rgba(124,58,237,0.35)',
      }}>
        {isUser
          ? <User style={{ width: 16, height: 16, color: 'white' }} />
          : <Bot  style={{ width: 16, height: 16, color: 'white' }} />}
      </div>

      <div style={{
        maxWidth: '72%',
        padding: '10px 14px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        fontSize: 13, lineHeight: 1.6,
        ...(isUser ? {
          background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
          color: 'white',
          boxShadow: '0 4px 16px rgba(79,70,229,0.35)',
        } : {
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(8px)',
        }),
      }}>
        {msg.content}
        <p style={{
          fontSize: 10, marginTop: 5, marginBottom: 0,
          color: isUser ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.25)',
          textAlign: isUser ? 'right' : 'left',
        }}>
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

/* ── Typing indicator ──────────────────────────────────── */
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 11, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
        boxShadow: '0 4px 12px rgba(124,58,237,0.35)',
      }}>
        <Bot style={{ width: 16, height: 16, color: 'white' }} />
      </div>
      <div style={{
        padding: '12px 16px', borderRadius: '18px 18px 18px 4px',
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {[0, 150, 300].map(d => (
          <span key={d} className="animate-bounce" style={{
            display: 'block', width: 7, height: 7, borderRadius: '50%',
            background: '#818cf8', animationDelay: `${d}ms`,
          }} />
        ))}
      </div>
    </div>
  )
}

/* ── Suggested prompts ─────────────────────────────────── */
const SUGGESTIONS = [
  'What is cyberbullying?',
  'How do I stay safe online?',
  'What should I do if a stranger messages me?',
]

/* ═══════════════════════════════════════════════════════ */
export default function SafeChatPanel() {
  const { user }                    = useAuthStore()
  const [messages, setMessages]     = useState([WELCOME])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [quizIdx, setQuizIdx]       = useState(0)
  const [quizAnswer, setQuizAnswer] = useState(null)
  const [tipIdx]                    = useState(() => Math.floor(Math.random() * dailyTips.length))
  const bottomRef                   = useRef(null)
  const inputRef                    = useRef(null)

  const tip  = dailyTips[tipIdx]
  const quiz = quizQuestions[quizIdx]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    inputRef.current?.focus()

    try {
      const history = messages
        .filter(m => m !== WELCOME)
        .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content }))
      const res   = await chatAPI.sendMessage(text, history)
      const reply = res.data?.reply || "I'm not sure about that, but I'm always here to help!"
      setMessages(prev => [...prev, { role: 'bot', content: reply, timestamp: new Date() }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'bot', content: "Oops! I had a little trouble. Could you try asking me again?", timestamp: new Date() },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestion = (text) => { setInput(text); inputRef.current?.focus() }

  const handleQuizAnswer = (ans) => {
    setQuizAnswer(ans)
    setTimeout(() => { setQuizAnswer(null); setQuizIdx(i => (i + 1) % quizQuestions.length) }, 1800)
  }

  const showSuggestions = messages.length === 1 && !loading

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 336px', gap: 20, alignItems: 'start' }}>

      {/* ── LEFT : Chat window ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column', borderRadius: 20, overflow: 'hidden',
        background: 'rgba(9,11,28,0.92)',
        border: '1px solid rgba(99,102,241,0.22)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
        minHeight: 580,
      }}>

        {/* ── Header ─────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px',
          background: 'linear-gradient(135deg, rgba(79,70,229,0.18) 0%, rgba(37,99,235,0.12) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Glowing bot avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              position: 'absolute', inset: -4, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.55) 0%, transparent 70%)',
              filter: 'blur(7px)',
            }} />
            <div style={{
              position: 'relative', width: 42, height: 42, borderRadius: 13,
              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99,102,241,0.5)',
            }}>
              <Bot style={{ width: 20, height: 20, color: 'white' }} />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: 0 }}>SafeBot</p>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '2px 8px', borderRadius: 20,
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)',
                color: '#34d399', fontSize: 11, fontWeight: 600,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                Online
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 12, margin: 0 }}>Your AI safety companion</p>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 20,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.28)',
          }}>
            <Shield style={{ width: 13, height: 13, color: '#a5b4fc' }} />
            <span style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 600 }}>Safe & Private</span>
          </div>
        </div>

        {/* ── Messages area ──────────────────── */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '20px 20px 8px',
          display: 'flex', flexDirection: 'column', gap: 14,
          maxHeight: 420,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.05) 0%, transparent 55%)',
        }}>
          {messages.map((msg, idx) => <ChatBubble key={idx} msg={msg} />)}
          {loading && <TypingIndicator />}

          {showSuggestions && (
            <div style={{ marginTop: 6 }}>
              <p style={{
                color: 'rgba(255,255,255,0.28)', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8,
              }}>Try asking…</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => handleSuggestion(s)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 14px', borderRadius: 12, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.68)', fontSize: 13, textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                    <span>{s}</span>
                    <ChevronRight style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.28)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ──────────────────────── */}
        <div style={{ padding: '12px 16px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <form onSubmit={handleSend} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px 9px 16px', borderRadius: 16,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
          }}>
            <Sparkles style={{ width: 15, height: 15, color: 'rgba(165,180,252,0.45)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask SafeBot anything…"
              disabled={loading}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'white', fontSize: 14, caretColor: '#818cf8',
              }}
            />
            <button type="submit" disabled={loading || !input.trim()} style={{
              width: 36, height: 36, borderRadius: 12, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: (input.trim() && !loading)
                ? 'linear-gradient(135deg, #4f46e5, #2563eb)'
                : 'rgba(255,255,255,0.07)',
              border: 'none',
              cursor: (input.trim() && !loading) ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: (input.trim() && !loading) ? '0 4px 12px rgba(79,70,229,0.5)' : 'none',
            }}>
              {loading
                ? <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <Send style={{ width: 14, height: 14, color: input.trim() ? 'white' : 'rgba(255,255,255,0.28)' }} />}
            </button>
          </form>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: 10, marginTop: 8 }}>
            SafeBot is AI-powered — always talk to a trusted adult about serious concerns
          </p>
        </div>
      </div>

      {/* ── RIGHT : Sidebar ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Daily Tip card */}
        <div style={{
          borderRadius: 18, overflow: 'hidden',
          background: 'rgba(9,11,28,0.92)',
          border: '1px solid rgba(245,158,11,0.18)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #fcd34d)' }} />
          <div style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Lightbulb style={{ width: 16, height: 16, color: '#fbbf24' }} />
              </div>
              <div>
                <p style={{ color: '#fbbf24', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Daily Tip</p>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: 0 }}>{tip.headline}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tip.bullets.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: '#fbbf24', fontWeight: 700,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 12, lineHeight: 1.6 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Safety Reminders */}
        <div style={{
          borderRadius: 18, overflow: 'hidden',
          background: 'rgba(9,11,28,0.92)',
          border: '1px solid rgba(59,130,246,0.15)',
        }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }} />
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
              Safety Reminders
            </p>
            {[
              { text: "Never share personal info with strangers online.",    color: '#60a5fa', bg: 'rgba(59,130,246,0.07)',   border: 'rgba(59,130,246,0.18)'   },
              { text: 'If something feels wrong, tell a trusted adult.',     color: '#34d399', bg: 'rgba(16,185,129,0.07)',  border: 'rgba(16,185,129,0.18)'   },
            ].map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 12px', borderRadius: 12,
                background: t.bg, border: `1px solid ${t.border}`,
              }}>
                <Star style={{ width: 13, height: 13, color: t.color, flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: t.color, fontSize: 12, lineHeight: 1.55 }}>{t.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quiz card */}
        <div style={{
          borderRadius: 18, overflow: 'hidden',
          background: 'rgba(9,11,28,0.92)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, #7c3aed, #4f46e5, #3b82f6)' }} />
          <div style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <HelpCircle style={{ width: 14, height: 14, color: '#a5b4fc' }} />
              </div>
              <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: 0, flex: 1 }}>Quick Quiz</p>
              <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11 }}>{quizIdx + 1}/{quizQuestions.length}</span>
            </div>

            <div style={{
              padding: '12px 14px', borderRadius: 12, marginBottom: 12,
              background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)',
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, flexShrink: 0 }}><ShieldBadgeIcon /></div>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.55, margin: 0 }}>{quiz.q}</p>
              </div>
            </div>

            {quizAnswer === null ? (
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { label: 'No',       color: '#34d399', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.25)'  },
                  { label: 'Yes',      color: '#60a5fa', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.25)'  },
                  { label: 'Not sure', color: '#94a3b8', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)'  },
                ].map(opt => (
                  <button key={opt.label} onClick={() => handleQuizAnswer(opt.label)} style={{
                    flex: 1, padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                    background: opt.bg, border: `1px solid ${opt.border}`,
                    color: opt.color, fontSize: 12, fontWeight: 600,
                    transition: 'transform 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center', padding: '10px 14px', borderRadius: 12,
                fontSize: 13, fontWeight: 600,
                ...(quizAnswer === quiz.a
                  ? { background: 'rgba(16,185,129,0.1)',  border: '1px solid rgba(16,185,129,0.28)', color: '#34d399' }
                  : { background: 'rgba(239,68,68,0.09)',  border: '1px solid rgba(239,68,68,0.22)',  color: '#f87171' }
                ),
              }}>
                {quizAnswer === quiz.a
                  ? 'Correct! Great thinking.'
                  : `Not quite — the answer is "${quiz.a}".`}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 12 }}>
              {quizQuestions.map((_, i) => (
                <div key={i} style={{
                  height: 5, borderRadius: 10,
                  width: i === quizIdx ? 18 : 6,
                  background: i === quizIdx ? '#818cf8' : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Mascot card */}
        <div style={{
          borderRadius: 18, overflow: 'hidden',
          background: 'linear-gradient(160deg, rgba(9,11,28,0.95) 0%, rgba(30,58,95,0.45) 100%)',
          border: '1px solid rgba(59,130,246,0.13)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '18px 16px 10px', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 80, height: 80,
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            filter: 'blur(14px)',
          }} />
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            My Safety Buddy
          </p>
          <div style={{ width: 120, height: 148 }}><RobotMascot /></div>
          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
            Here to keep you safe!
          </p>
        </div>

      </div>
    </div>
  )
}