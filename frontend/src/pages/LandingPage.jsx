import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Zap, Lock, Bell, ChevronRight, CheckCircle, BarChart3, Users,
  Eye, MessageSquare, Link2, BookOpen, Chrome, Mail, Activity, Brain, AlertTriangle,
} from 'lucide-react'
import useAuthStore from '../store/authStore'

const LandingPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'Gemini AI Message Analysis',
      desc: 'Google Gemini AI scans every message in real time, detecting cyberbullying, grooming, threats, and manipulation before harm is done.',
      color: 'blue',
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Gmail Inbox Monitoring',
      desc: "Connect your child's Gmail account and let AI scan incoming emails for dangerous content, spam, and suspicious senders automatically.",
      color: 'blue',
    },
    {
      icon: <Chrome className="w-6 h-6" />,
      title: 'Browser Extension',
      desc: "Install the SafeMonitor Chrome extension to monitor messages and links across any website your child visits in real time.",
      color: 'amber',
    },
    {
      icon: <Link2 className="w-6 h-6" />,
      title: 'Ask Before You Click',
      desc: "Children can paste any link and get an instant AI safety verdict — safe, suspicious, or dangerous — before they open it.",
      color: 'pink',
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'SafeBot AI Chat',
      desc: 'A friendly AI companion built for kids. SafeBot answers questions, shares daily safety tips, and makes learning fun with interactive quizzes.',
      color: 'purple',
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Cyber Safety Learning',
      desc: 'Interactive educational modules teach children about online risks, privacy, and responsible digital behavior — at their own pace.',
      color: 'teal',
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'Activity & Browsing Logs',
      desc: "Track every website visit and online session. Full browsing history with timestamps is available on the parent dashboard.",
      color: 'indigo',
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'Instant Parent Alerts',
      desc: 'Get push and email notifications the moment a HIGH or MEDIUM risk message is detected, complete with full message context.',
      color: 'red',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Multi-Child Dashboard',
      desc: 'Manage all your children from one unified parent dashboard. Switch between profiles, view stats, and manage settings per child.',
      color: 'cyan',
    },
  ]

  const steps = [
    { step: '01', title: 'Create Your Account', desc: 'Sign up as a parent in under 2 minutes. Add your children and configure their individual safety settings.' },
    { step: '02', title: 'Connect & Install', desc: "Connect your child's Gmail, install the browser extension, or simply use the built-in dashboards to get started." },
    { step: '03', title: 'AI Monitors 24/7', desc: 'Gemini AI silently scans messages, emails, and browsing activity around the clock — no manual review needed.' },
    { step: '04', title: 'Risk Scoring', desc: 'Every message gets a 0–100 risk score and is classified as SAFE, MEDIUM, or HIGH with full reasoning from the AI.' },
    { step: '05', title: 'You Get Alerted', desc: 'Any MEDIUM or HIGH content triggers an instant notification with the full message, sender, and AI explanation.' },
    { step: '06', title: 'Kids Stay Engaged', desc: 'Children log into their own safe dashboard to chat with SafeBot, check link safety, and earn safety badges through quizzes.' },
  ]

  const stats = [
    { value: '99.8%', label: 'Detection Accuracy' },
    { value: '<200ms', label: 'Analysis Speed' },
    { value: '10k+', label: 'Families Protected' },
    { value: '24/7', label: 'Active Monitoring' },
  ]

  const childFeatures = [
    { icon: <MessageSquare className="w-5 h-5" />, label: 'SafeBot AI Chat',        color: '#818cf8' },
    { icon: <Link2        className="w-5 h-5" />, label: 'Link Safety Checker',    color: '#f472b6' },
    { icon: <BookOpen     className="w-5 h-5" />, label: 'Cyber Safety Lessons',   color: '#60a5fa' },
    { icon: <Bell         className="w-5 h-5" />, label: 'My Alerts',              color: '#fbbf24' },
    { icon: <Eye          className="w-5 h-5" />, label: 'Activity Notifications', color: '#60a5fa' },
  ]

  const colorMap = {
    emerald: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber:   'bg-amber-500/10   text-amber-400   border-amber-500/20',
    blue:    'bg-blue-500/10    text-blue-400    border-blue-500/20',
    purple:  'bg-purple-500/10  text-purple-400  border-purple-500/20',
    pink:    'bg-pink-500/10    text-pink-400    border-pink-500/20',
    teal:    'bg-teal-500/10    text-teal-400    border-teal-500/20',
    indigo:  'bg-indigo-500/10  text-indigo-400  border-indigo-500/20',
    red:     'bg-red-500/10     text-red-400     border-red-500/20',
    cyan:    'bg-cyan-500/10    text-cyan-400    border-cyan-500/20',
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0e1a' }}>
      {/* Navigation */}
      <nav className="nav-glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-gray-900" />
            </div>
            <span className="text-lg font-bold text-white">SafeMonitor</span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate(user?.role === 'ROLE_PARENT' ? '/parent-dashboard' : '/')}
                className="btn-primary"
              >
                Dashboard &rarr;
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="btn-secondary text-sm">
                  Sign In
                </button>
                <button onClick={() => navigate('/register')} className="btn-primary text-sm">
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-28 pb-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full" />
          <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-teal-500/8 blur-[100px] rounded-full" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            AI-Powered Child Safety Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tight mb-6">
            Every Message. Every Link.
            <br />
            <span className="gradient-text">Every Child. Protected.</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            SafeMonitor uses Google Gemini AI to monitor messages, scan Gmail, check links, and educate children
            — giving parents full visibility and kids the tools to stay safe online.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="btn-primary text-base px-8 py-3.5 flex items-center gap-2"
            >
              Start Protecting for Free
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary text-base px-8 py-3.5"
            >
              Sign In to Dashboard
            </button>
          </div>

          <p className="mt-6 text-sm text-gray-500 flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-500" />
            No credit card required &middot; 5-minute setup &middot; Cancel anytime
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="card text-center">
              <p className="text-3xl font-black gradient-text mb-1">{s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
            <h2 className="heading-2 mb-4">Everything You Need to Stay in Control</h2>
            <p className="text-gray-400 max-w-xl mx-auto">A complete child safety platform built for modern families — monitoring, education, and real-time protection in one place.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="card-hover group">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${colorMap[f.color]}`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two dashboards */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Two Dashboards</p>
            <h2 className="heading-2">Built for Parents. Loved by Kids.</h2>
            <p className="text-gray-400 mt-4 max-w-lg mx-auto">
              Separate, purpose-built dashboards ensure parents have full oversight while children get a safe, age-appropriate experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Parent dashboard card */}
            <div className="card border-blue-500/20 p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-base">Parent Dashboard</p>
                  <p className="text-blue-400 text-xs">Full oversight &amp; control</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  'Real-time AI alerts with risk scores',
                  'Browsing activity & session logs',
                  'Gmail inbox monitoring per child',
                  'Multi-child profile management',
                  'Notification preferences & settings',
                  'Audit log of all platform actions',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Child dashboard card */}
            <div className="card border-purple-500/20 p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-base">Child Dashboard</p>
                  <p className="text-purple-400 text-xs">Safe &middot; Friendly &middot; Educational</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  'SafeBot — AI chat companion for kids',
                  'Ask Before You Click link checker',
                  'Cyber safety lessons & interactive quizzes',
                  'My Alerts — see what was flagged',
                  'Activity notifications & history',
                  'Personalised safety tips & daily challenges',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="heading-2">Up and Running in Minutes</h2>
          </div>

          <div className="space-y-4">
            {steps.map((item, i) => (
              <div key={i} className="card flex items-start gap-6 group hover:border-blue-500/20 transition-all duration-300">
                <div className="flex-shrink-0 text-4xl font-black gradient-text opacity-60 group-hover:opacity-100 transition-opacity">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Levels */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">AI Risk Classification</p>
            <h2 className="heading-2">Three Levels of Protection</h2>
            <p className="text-gray-400 mt-4 max-w-lg mx-auto">Every message and email is scored 0–100 by Gemini AI and instantly classified so you always know the severity.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="card border-blue-500/20 text-center">
              <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-blue-400" />
              </div>
              <p className="badge-safe mx-auto mb-3">SAFE &middot; 0–30</p>
              <h3 className="font-semibold text-white mb-2">Normal Conversation</h3>
              <p className="text-sm text-gray-400">No concerning patterns detected. Message is safe and appropriate for the child.</p>
            </div>

            <div className="card border-amber-500/20 text-center">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="w-7 h-7 text-amber-400" />
              </div>
              <p className="badge-medium mx-auto mb-3">MEDIUM &middot; 30–70</p>
              <h3 className="font-semibold text-white mb-2">Needs Monitoring</h3>
              <p className="text-sm text-gray-400">Suspicious activity detected. Parent is notified and should review the conversation.</p>
            </div>

            <div className="card border-red-500/20 text-center">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <p className="badge-high mx-auto mb-3">HIGH &middot; 70–100</p>
              <h3 className="font-semibold text-white mb-2">Immediate Attention</h3>
              <p className="text-sm text-gray-400">Dangerous content detected. Parent is alerted immediately with full message context.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Extension highlight */}
      <section className="px-6 py-20" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="card border-amber-500/20 p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Chrome className="w-8 h-8 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-2">Browser Extension</p>
                <h3 className="text-2xl font-bold text-white mb-3">Monitor Any Website, Automatically</h3>
                <p className="text-gray-400 leading-relaxed">
                  The SafeMonitor Chrome extension works silently in the background. As your child browses, it scans messages on
                  social platforms, checks links before they're opened, and sends risk reports directly to your parent dashboard —
                  all without interrupting the browsing experience.
                </p>
              </div>
              <button
                onClick={() => navigate('/register')}
                className="btn-primary text-sm px-6 py-3 flex items-center gap-2 flex-shrink-0"
              >
                Get Extension
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
            <div className="relative card border-blue-500/20 py-16">
              <h2 className="text-4xl font-black text-white mb-4">
                Your Child's Safety<br />
                <span className="gradient-text">Starts Today</span>
              </h2>
              <p className="text-gray-400 mb-10 max-w-md mx-auto">
                Join thousands of parents using SafeMonitor to protect their children across messages, email, and the web.
              </p>
              <button
                onClick={() => navigate('/register')}
                className="btn-primary text-base px-10 py-4 inline-flex items-center gap-2"
              >
                Create Free Account
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="px-6 py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-gray-900" />
            </div>
            <span className="text-white font-bold">SafeMonitor</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Help</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Contact</a>
          </div>
          <p className="text-gray-600 text-sm">&copy; 2026 SafeMonitor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage