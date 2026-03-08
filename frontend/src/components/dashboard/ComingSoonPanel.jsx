import React from 'react'
import { FileText, Clock, TrendingUp, BarChart3, Calendar, Filter } from 'lucide-react'

const ComingSoonPanel = () => {
  return (
    <div className="relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      borderRadius: 20,
      padding: '60px 40px',
      minHeight: '600px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute animate-pulse" style={{
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
          top: '-200px',
          right: '-100px',
          animation: 'float 8s ease-in-out infinite',
        }} />
        <div className="absolute animate-pulse" style={{
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(147,51,234,0.1) 0%, transparent 70%)',
          bottom: '-100px',
          left: '-50px',
          animation: 'float 10s ease-in-out infinite',
          animationDelay: '2s',
        }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-3xl">
        {/* Icon Container with Animation */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping" style={{
              background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)',
              borderRadius: '50%',
            }} />
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              borderRadius: 20,
              padding: 30,
              boxShadow: '0 10px 40px rgba(59,130,246,0.3)',
            }}>
              <FileText size={64} color="#ffffff" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Coming Soon Text */}
        <h1 className="text-5xl font-bold mb-4" style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Coming Soon
        </h1>
        
        <p className="text-xl mb-12" style={{ color: '#94a3b8' }}>
          Advanced Activity Logs & Analytics Dashboard
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Feature 1 */}
          <div className="group" style={{
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 16,
            padding: 24,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
          }}>
            <div className="flex items-start gap-4">
              <div style={{
                background: 'rgba(59,130,246,0.15)',
                borderRadius: 12,
                padding: 12,
              }}>
                <Clock size={24} color="#3b82f6" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#e2e8f0' }}>
                  Detailed Time Tracking
                </h3>
                <p className="text-sm" style={{ color: '#94a3b8' }}>
                  Track exactly how much time your child spends on each activity with minute-by-minute breakdowns
                </p>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="group" style={{
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 16,
            padding: 24,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
          }}>
            <div className="flex items-start gap-4">
              <div style={{
                background: 'rgba(139,92,246,0.15)',
                borderRadius: 12,
                padding: 12,
              }}>
                <TrendingUp size={24} color="#8b5cf6" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#e2e8f0' }}>
                  Trend Analysis
                </h3>
                <p className="text-sm" style={{ color: '#94a3b8' }}>
                  Identify patterns and trends in your child's online behavior over days, weeks, and months
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="group" style={{
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(236,72,153,0.2)',
            borderRadius: 16,
            padding: 24,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
          }}>
            <div className="flex items-start gap-4">
              <div style={{
                background: 'rgba(236,72,153,0.15)',
                borderRadius: 12,
                padding: 12,
              }}>
                <BarChart3 size={24} color="#ec4899" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#e2e8f0' }}>
                  Visual Reports
                </h3>
                <p className="text-sm" style={{ color: '#94a3b8' }}>
                  Beautiful charts and graphs showing activity distribution, peak usage times, and more
                </p>
              </div>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="group" style={{
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 16,
            padding: 24,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
          }}>
            <div className="flex items-start gap-4">
              <div style={{
                background: 'rgba(34,197,94,0.15)',
                borderRadius: 12,
                padding: 12,
              }}>
                <Filter size={24} color="#22c55e" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#e2e8f0' }}>
                  Advanced Filtering
                </h3>
                <p className="text-sm" style={{ color: '#94a3b8' }}>
                  Filter by date range, category, risk level, and more to find exactly what you're looking for
                </p>
              </div>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="group" style={{
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(251,146,60,0.2)',
            borderRadius: 16,
            padding: 24,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
          }}>
            <div className="flex items-start gap-4">
              <div style={{
                background: 'rgba(251,146,60,0.15)',
                borderRadius: 12,
                padding: 12,
              }}>
                <Calendar size={24} color="#fb923c" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#e2e8f0' }}>
                  Calendar View
                </h3>
                <p className="text-sm" style={{ color: '#94a3b8' }}>
                  See all activities organized in an intuitive calendar interface with daily summaries
                </p>
              </div>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="group" style={{
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(6,182,212,0.2)',
            borderRadius: 16,
            padding: 24,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
          }}>
            <div className="flex items-start gap-4">
              <div style={{
                background: 'rgba(6,182,212,0.15)',
                borderRadius: 12,
                padding: 12,
              }}>
                <FileText size={24} color="#06b6d4" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#e2e8f0' }}>
                  Export Reports
                </h3>
                <p className="text-sm" style={{ color: '#94a3b8' }}>
                  Download comprehensive activity reports in PDF or CSV format for your records
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full" style={{
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.3)',
        }}>
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </div>
          <span className="text-sm font-semibold" style={{ color: '#3b82f6' }}>
            In Development
          </span>
        </div>
      </div>

      {/* CSS for Float Animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .group:hover {
          transform: translateY(-4px);
          border-color: rgba(59,130,246,0.5) !important;
        }
      `}</style>
    </div>
  )
}

export default ComingSoonPanel
